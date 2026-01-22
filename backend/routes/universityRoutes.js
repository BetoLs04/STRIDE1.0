const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== CONFIGURACIÓN DE MULTER ==========

// Crear carpeta de uploads si no existe
const uploadDir = 'uploads/actividades';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = 'actividad-' + uniqueSuffix + ext;
        console.log('📸 Guardando imagen:', filename);
        cb(null, filename);
    }
});

// Configuración de multer
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB por imagen
        files: 5 // Máximo 5 archivos
    }
});

// ========== RUTAS BÁSICAS PARA SUPER USERS ==========

// Crear super usuario
router.post('/create-superuser', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Todos los campos son obligatorios' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.execute(
            'INSERT INTO super_users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        
        res.status(201).json({ 
            success: true,
            message: 'Super usuario creado exitosamente',
            userId: result.insertId 
        });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                error: 'El usuario o email ya existe' 
            });
        }
        console.error('Error al crear super user:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al crear el usuario' 
        });
    }
});

// Login para super users
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Intento de login para:', email);
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email y contraseña son requeridos' 
            });
        }
        
        const [users] = await db.execute(
            'SELECT * FROM super_users WHERE email = ?',
            [email]
        );
        
        console.log('👤 Usuarios encontrados:', users.length);
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenciales inválidas' 
            });
        }
        
        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenciales inválidas' 
            });
        }
        
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            tipo: 'superadmin',
            created_at: user.created_at
        };
        
        console.log('✅ Login exitoso para:', user.email);
        
        res.json({ 
            success: true,
            message: 'Login exitoso',
            user: userResponse
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error en el servidor' 
        });
    }
});

// ========== LOGIN GENERAL PARA TODOS LOS TIPOS ==========
router.post('/login-general', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login general para:', email);
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email y contraseña son requeridos' 
            });
        }
        
        let user = null;
        let userType = null;
        
        const [superUsers] = await db.execute(
            'SELECT * FROM super_users WHERE email = ?',
            [email]
        );
        
        if (superUsers.length > 0) {
            const superUser = superUsers[0];
            const isValidPassword = await bcrypt.compare(password, superUser.password);
            
            if (isValidPassword) {
                user = {
                    id: superUser.id,
                    nombre: superUser.username,
                    username: superUser.username,
                    email: superUser.email,
                    tipo: 'superadmin',
                    userType: 'superadmin'
                };
                userType = 'superadmin';
            }
        }
        
        if (!user) {
            const [directivos] = await db.execute(
                'SELECT d.*, dir.nombre as direccion_nombre FROM directivos d LEFT JOIN direcciones dir ON d.direccion_id = dir.id WHERE d.email = ?',
                [email]
            );
            
            if (directivos.length > 0) {
                const directivo = directivos[0];
                const isValidPassword = await bcrypt.compare(password, directivo.password);
                
                if (isValidPassword) {
                    user = {
                        id: directivo.id,
                        nombre: directivo.nombre_completo,
                        username: directivo.nombre_completo,
                        email: directivo.email,
                        cargo: directivo.cargo,
                        direccion_id: directivo.direccion_id,
                        direccion_nombre: directivo.direccion_nombre,
                        tipo: 'directivo',
                        userType: 'directivo'
                    };
                    userType = 'directivo';
                }
            }
        }
        
        if (!user) {
            const [personal] = await db.execute(
                'SELECT p.*, dir.nombre as direccion_nombre FROM personal p LEFT JOIN direcciones dir ON p.direccion_id = dir.id WHERE p.email = ?',
                [email]
            );
            
            if (personal.length > 0) {
                const personalUser = personal[0];
                const isValidPassword = await bcrypt.compare(password, personalUser.password);
                
                if (isValidPassword) {
                    user = {
                        id: personalUser.id,
                        nombre: personalUser.nombre_completo,
                        username: personalUser.nombre_completo,
                        email: personalUser.email,
                        puesto: personalUser.puesto,
                        direccion_id: personalUser.direccion_id,
                        direccion_nombre: personalUser.direccion_nombre,
                        tipo: 'personal',
                        userType: 'personal'
                    };
                    userType = 'personal';
                }
            }
        }
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenciales inválidas' 
            });
        }
        
        console.log('✅ Login exitoso para:', user.email, 'Tipo:', userType);
        
        res.json({ 
            success: true,
            message: 'Login exitoso',
            user: user,
            userType: userType
        });
        
    } catch (error) {
        console.error('Error en login general:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error en el servidor' 
        });
    }
});

// Obtener todos los super users
router.get('/superusers', async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, username, email, created_at FROM super_users ORDER BY created_at DESC'
        );
        
        res.json({ 
            success: true,
            data: users 
        });
        
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener usuarios' 
        });
    }
});

// ========== ESTADÍSTICAS BÁSICAS ==========
router.get('/estadisticas', async (req, res) => {
    try {
        const [[{ total_usuarios }]] = await db.execute('SELECT COUNT(*) as total_usuarios FROM super_users');
        const [[{ total_direcciones }]] = await db.execute('SELECT COUNT(*) as total_direcciones FROM direcciones');
        const [[{ total_directivos }]] = await db.execute('SELECT COUNT(*) as total_directivos FROM directivos');
        const [[{ total_personal }]] = await db.execute('SELECT COUNT(*) as total_personal FROM personal');
        
        res.json({
            success: true,
            data: {
                usuarios: total_usuarios,
                direcciones: total_direcciones,
                directivos: total_directivos,
                personal: total_personal
            }
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener estadísticas' 
        });
    }
});

// ========== RUTA DE PRUEBA ==========
router.get('/test', async (req, res) => {
    try {
        const [result] = await db.execute('SELECT 1 + 1 as test');
        res.json({ 
            success: true,
            message: 'API funcionando correctamente',
            dbTest: result[0].test,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Error de conexión a la base de datos' 
        });
    }
});

// ========== DIRECCIONES ==========
router.get('/direcciones', async (req, res) => {
    try {
        const [direcciones] = await db.execute(
            'SELECT * FROM direcciones ORDER BY nombre'
        );
        
        res.json({ 
            success: true,
            data: direcciones 
        });
        
    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener direcciones' 
        });
    }
});

router.post('/direcciones', async (req, res) => {
    try {
        const { nombre } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ 
                success: false,
                error: 'El nombre es requerido' 
            });
        }
        
        const [result] = await db.execute(
            'INSERT INTO direcciones (nombre) VALUES (?)',
            [nombre]
        );
        
        res.status(201).json({ 
            success: true,
            message: 'Dirección creada exitosamente',
            direccionId: result.insertId 
        });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                error: 'Esta dirección ya existe' 
            });
        }
        console.error('Error al crear dirección:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al crear la dirección' 
        });
    }
});

// ========== DIRECTIVOS ==========
router.get('/directivos', async (req, res) => {
    try {
        const [directivos] = await db.execute(
            'SELECT d.*, dir.nombre as direccion_nombre FROM directivos d LEFT JOIN direcciones dir ON d.direccion_id = dir.id ORDER BY d.nombre_completo'
        );
        
        res.json({ 
            success: true,
            data: directivos 
        });
        
    } catch (error) {
        console.error('Error al obtener directivos:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener directivos' 
        });
    }
});

router.post('/directivos', async (req, res) => {
    try {
        const { nombre_completo, cargo, direccion_id, email, password } = req.body;
        
        if (!nombre_completo || !cargo || !direccion_id || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Todos los campos son requeridos' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.execute(
            'INSERT INTO directivos (nombre_completo, cargo, direccion_id, email, password) VALUES (?, ?, ?, ?, ?)',
            [nombre_completo, cargo, direccion_id, email, hashedPassword]
        );
        
        res.status(201).json({ 
            success: true,
            message: 'Directivo creado exitosamente',
            directivoId: result.insertId 
        });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                error: 'El email ya está registrado' 
            });
        }
        console.error('Error al crear directivo:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al crear el directivo' 
        });
    }
});

// ========== PERSONAL ==========
router.get('/personal', async (req, res) => {
    try {
        const [personal] = await db.execute(
            'SELECT p.*, dir.nombre as direccion_nombre FROM personal p LEFT JOIN direcciones dir ON p.direccion_id = dir.id ORDER BY p.nombre_completo'
        );
        
        res.json({ 
            success: true,
            data: personal 
        });
        
    } catch (error) {
        console.error('Error al obtener personal:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener personal' 
        });
    }
});

router.post('/personal', async (req, res) => {
    try {
        const { nombre_completo, puesto, direccion_id, email, password } = req.body;
        
        if (!nombre_completo || !puesto || !direccion_id || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Todos los campos son requeridos' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.execute(
            'INSERT INTO personal (nombre_completo, puesto, direccion_id, email, password) VALUES (?, ?, ?, ?, ?)',
            [nombre_completo, puesto, direccion_id, email, hashedPassword]
        );
        
        res.status(201).json({ 
            success: true,
            message: 'Personal creado exitosamente',
            personalId: result.insertId 
        });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                error: 'El email ya está registrado' 
            });
        }
        console.error('Error al crear personal:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al crear el personal' 
        });
    }
});

// ========== ACTIVIDADES CON IMÁGENES ==========

// Crear nueva actividad con imágenes
router.post('/actividades', upload.array('imagenes', 5), async (req, res) => {
    try {
        const { 
            titulo, 
            descripcion, 
            fecha_inicio, 
            fecha_fin, 
            direccion_id, 
            creado_por_id, 
            creado_por_tipo 
        } = req.body;
        
        console.log('📝 Datos recibidos:', {
            titulo, descripcion, fecha_inicio, fecha_fin, direccion_id, 
            creado_por_id, creado_por_tipo
        });
        console.log('📸 Archivos recibidos:', req.files ? req.files.length : 0);
        
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                console.log(`  Archivo ${index + 1}:`, file.originalname, '->', file.filename);
            });
        }
        
        if (!titulo || !fecha_inicio || !direccion_id || !creado_por_id || !creado_por_tipo) {
            // Limpiar archivos si hay error
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                        console.log('🗑️ Archivo eliminado:', file.path);
                    } catch (err) {
                        console.error('Error al limpiar archivos:', err);
                    }
                });
            }
            return res.status(400).json({ 
                success: false,
                error: 'Título, fecha de inicio, dirección, creador y tipo son requeridos' 
            });
        }
        
        // Validar que fecha_fin no sea anterior a fecha_inicio
        if (fecha_fin && new Date(fecha_fin) < new Date(fecha_inicio)) {
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (err) {
                        console.error('Error al limpiar archivos:', err);
                    }
                });
            }
            return res.status(400).json({ 
                success: false,
                error: 'La fecha de fin no puede ser anterior a la fecha de inicio' 
            });
        }
        
        // Insertar actividad
        const [result] = await db.execute(
            `INSERT INTO actividades 
            (titulo, descripcion, fecha_inicio, fecha_fin, direccion_id, creado_por_id, creado_por_tipo, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
            [titulo, descripcion || null, fecha_inicio, fecha_fin || null, direccion_id, creado_por_id, creado_por_tipo]
        );
        
        const actividadId = result.insertId;
        
        // Si hay imágenes, guardar referencias en la base de datos
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await db.execute(
                    `INSERT INTO actividad_imagenes 
                    (actividad_id, nombre_archivo, ruta_archivo, tipo_mime, tamano) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [actividadId, file.originalname, file.filename, file.mimetype, file.size]
                );
                console.log('💾 Imagen guardada en BD:', file.filename);
            }
        }
        
        res.status(201).json({ 
            success: true,
            message: 'Actividad creada exitosamente',
            actividadId: actividadId,
            imagenesCount: req.files ? req.files.length : 0
        });
        
    } catch (error) {
        console.error('❌ Error al crear actividad:', error);
        
        // Si hay error, eliminar archivos subidos
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    console.error('Error al eliminar archivo:', err);
                }
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: error.message || 'Error al crear la actividad' 
        });
    }
});

// Obtener actividades por dirección
router.get('/actividades/direccion/:direccion_id', async (req, res) => {
    try {
        const { direccion_id } = req.params;
        console.log(`📋 Obteniendo actividades para dirección: ${direccion_id}`);
        
        const [actividades] = await db.execute(`
            SELECT a.*, 
                   d.nombre as direccion_nombre,
                   CASE 
                     WHEN a.creado_por_tipo = 'directivo' THEN dir.nombre_completo
                     WHEN a.creado_por_tipo = 'personal' THEN per.nombre_completo
                     ELSE 'Sistema'
                   END as creado_por_nombre
            FROM actividades a
            LEFT JOIN direcciones d ON a.direccion_id = d.id
            LEFT JOIN directivos dir ON a.creado_por_id = dir.id AND a.creado_por_tipo = 'directivo'
            LEFT JOIN personal per ON a.creado_por_id = per.id AND a.creado_por_tipo = 'personal'
            WHERE a.direccion_id = ?
            ORDER BY a.fecha_creacion DESC
        `, [direccion_id]);
        
        console.log(`📊 Actividades encontradas: ${actividades.length}`);
        
        // Para cada actividad, obtener sus imágenes
        for (let actividad of actividades) {
            const [imagenes] = await db.execute(
                `SELECT id, actividad_id, nombre_archivo, ruta_archivo, tipo_mime, tamano, fecha_subida 
                 FROM actividad_imagenes 
                 WHERE actividad_id = ?`,
                [actividad.id]
            );
            
            // Crear URLs públicas para las imágenes
            actividad.imagenes = imagenes.map(img => ({
                ...img,
                url: `http://localhost:5000/uploads/actividades/${img.ruta_archivo}`
            }));
            
            // Verificar que los archivos existen
            if (imagenes.length > 0) {
                console.log(`   Actividad ${actividad.id}: ${imagenes.length} imágenes`);
                imagenes.forEach(img => {
                    const filePath = path.join(uploadDir, img.ruta_archivo);
                    const fileExists = fs.existsSync(filePath);
                    console.log(`     - ${img.ruta_archivo}: ${fileExists ? '✅ Existe' : '❌ No existe'}`);
                });
            }
        }
        
        res.json({ 
            success: true,
            data: actividades 
        });
        
    } catch (error) {
        console.error('Error al obtener actividades:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener actividades' 
        });
    }
});

// Actualizar estado de actividad
router.put('/actividades/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        const [result] = await db.execute(
            'UPDATE actividades SET estado = ? WHERE id = ?',
            [estado, id]
        );
        
        res.json({ 
            success: true,
            message: 'Estado actualizado',
            affectedRows: result.affectedRows
        });
        
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al actualizar estado' 
        });
    }
});

// Ruta para verificar archivos subidos
router.get('/debug/uploads', (req, res) => {
    try {
        const uploadDir = 'uploads/actividades';
        
        if (!fs.existsSync(uploadDir)) {
            return res.json({
                success: false,
                message: 'Directorio no existe',
                path: path.resolve(uploadDir)
            });
        }
        
        const files = fs.readdirSync(uploadDir);
        const fileDetails = files.map(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            return {
                nombre: file,
                ruta: filePath,
                tamaño: stats.size,
                url: `http://localhost:5000/uploads/actividades/${file}`,
                existe: fs.existsSync(filePath)
            };
        });
        
        res.json({
            success: true,
            uploadDir: path.resolve(uploadDir),
            totalArchivos: files.length,
            archivos: fileDetails
        });
        
    } catch (error) {
        console.error('Error al leer directorio:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/actividades/todas', async (req, res) => {
    try {
        console.log('📋 Obteniendo TODAS las actividades del sistema');
        
        const [actividades] = await db.execute(`
            SELECT a.*, 
                   d.nombre as direccion_nombre,
                   CASE 
                     WHEN a.creado_por_tipo = 'directivo' THEN dir.nombre_completo
                     WHEN a.creado_por_tipo = 'personal' THEN per.nombre_completo
                     ELSE 'Sistema'
                   END as creado_por_nombre
            FROM actividades a
            LEFT JOIN direcciones d ON a.direccion_id = d.id
            LEFT JOIN directivos dir ON a.creado_por_id = dir.id AND a.creado_por_tipo = 'directivo'
            LEFT JOIN personal per ON a.creado_por_id = per.id AND a.creado_por_tipo = 'personal'
            ORDER BY a.fecha_creacion DESC
        `);
        
        console.log(`📊 Total actividades encontradas: ${actividades.length}`);
        
        // Para cada actividad, obtener sus imágenes
        for (let actividad of actividades) {
            const [imagenes] = await db.execute(
                `SELECT id, actividad_id, nombre_archivo, ruta_archivo, tipo_mime, tamano, fecha_subida 
                 FROM actividad_imagenes 
                 WHERE actividad_id = ?`,
                [actividad.id]
            );
            
            // Crear URLs públicas para las imágenes
            actividad.imagenes = imagenes.map(img => ({
                ...img,
                url: `http://localhost:5000/uploads/actividades/${img.ruta_archivo}`
            }));
        }
        
        res.json({ 
            success: true,
            data: actividades,
            total: actividades.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener todas las actividades:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener actividades' 
        });
    }
});

// Añadir esta ruta después de las demás rutas de actividades:

// ========== ELIMINAR ACTIVIDAD ==========

// Eliminar actividad (con todas sus imágenes)
router.delete('/actividades/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ Solicitando eliminación de actividad ID: ${id}`);
        
        // 1. Obtener información de la actividad
        const [actividades] = await db.execute(
            'SELECT * FROM actividades WHERE id = ?',
            [id]
        );
        
        if (actividades.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Actividad no encontrada'
            });
        }
        
        const actividad = actividades[0];
        
        // 2. Obtener imágenes de la actividad
        const [imagenes] = await db.execute(
            'SELECT * FROM actividad_imagenes WHERE actividad_id = ?',
            [id]
        );
        
        console.log(`📸 Imágenes a eliminar: ${imagenes.length}`);
        
        // 3. Eliminar archivos físicos de las imágenes
        let imagenesEliminadas = 0;
        for (const imagen of imagenes) {
            try {
                const filePath = path.join(uploadDir, imagen.ruta_archivo);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`   ✅ Archivo eliminado: ${filePath}`);
                    imagenesEliminadas++;
                }
            } catch (fileError) {
                console.error(`   ⚠️ Error eliminando archivo: ${fileError.message}`);
            }
        }
        
        // 4. Eliminar registros de la base de datos
        // Primero las imágenes (por la restricción de clave foránea)
        await db.execute(
            'DELETE FROM actividad_imagenes WHERE actividad_id = ?',
            [id]
        );
        
        // Luego la actividad
        const [result] = await db.execute(
            'DELETE FROM actividades WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                error: 'No se pudo eliminar la actividad'
            });
        }
        
        console.log(`✅ Actividad ${id} eliminada exitosamente`);
        
        res.json({
            success: true,
            message: 'Actividad eliminada exitosamente',
            actividadId: id,
            titulo: actividad.titulo,
            imagenesEliminadas: imagenesEliminadas,
            registrosEliminados: result.affectedRows
        });
        
    } catch (error) {
        console.error('❌ Error al eliminar actividad:', error);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Error al eliminar la actividad'
        });
    }
});

// ========== CONFIGURACIÓN SIMPLE PARA LOGOS ==========

const logoDir = 'uploads/logos';

// Subir logo (REEMPLAZA totalmente el anterior)
router.post('/upload-logo', async (req, res) => {
  try {
    console.log('📤 Subiendo logo...');
    
    // Manejo manual del archivo (sin multer complicado)
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type debe ser multipart/form-data'
      });
    }
    
    // Parsear manualmente (simplificado)
    const busboy = require('busboy');
    const bb = busboy({ headers: req.headers });
    let fileName = '';
    let fileBuffer = Buffer.from('');
    
    bb.on('file', (name, file, info) => {
      console.log(`📄 Archivo recibido: ${info.filename}`);
      fileName = info.filename;
      const chunks = [];
      
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });
    
    bb.on('close', async () => {
      if (!fileBuffer.length || !fileName) {
        return res.status(400).json({
          success: false,
          error: 'No se recibió ningún archivo'
        });
      }
      
      // Asegurar que la carpeta existe
      if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
      }
      
      // Obtener extensión del archivo original
      const ext = path.extname(fileName);
      
      // Nombre fijo: institution-logo + extensión original
      const newFileName = 'institution-logo' + ext;
      const filePath = path.join(logoDir, newFileName);
      
      // Eliminar logo anterior si existe
      const existingFiles = fs.readdirSync(logoDir);
      existingFiles.forEach(file => {
        if (file.startsWith('institution-logo')) {
          fs.unlinkSync(path.join(logoDir, file));
          console.log('🗑️ Logo anterior eliminado:', file);
        }
      });
      
      // Guardar el nuevo archivo
      fs.writeFileSync(filePath, fileBuffer);
      console.log('💾 Logo guardado:', newFileName, 'tamaño:', fileBuffer.length);
      
      res.json({
        success: true,
        message: 'Logo subido exitosamente',
        filename: newFileName,
        path: filePath
      });
    });
    
    req.pipe(bb);
    
  } catch (error) {
    console.error('❌ Error subiendo logo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir el logo'
    });
  }
});

// Eliminar logo (MUY simple)
router.delete('/delete-logo', (req, res) => {
  try {
    console.log('🗑️ Eliminando logo...');
    
    if (!fs.existsSync(logoDir)) {
      return res.json({
        success: true,
        message: 'No hay logo para eliminar'
      });
    }
    
    const files = fs.readdirSync(logoDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      if (file.startsWith('institution-logo')) {
        const filePath = path.join(logoDir, file);
        fs.unlinkSync(filePath);
        console.log('✅ Logo eliminado:', file);
        deletedCount++;
      }
    });
    
    res.json({
      success: true,
      message: 'Logo eliminado',
      deletedCount: deletedCount
    });
    
  } catch (error) {
    console.error('Error eliminando logo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar logo'
    });
  }
});

// Verificar logo (opcional, para debugging)
router.get('/check-logo', (req, res) => {
  try {
    if (!fs.existsSync(logoDir)) {
      return res.json({
        success: false,
        exists: false,
        message: 'Carpeta de logos no existe'
      });
    }
    
    const files = fs.readdirSync(logoDir);
    const logoFile = files.find(file => file.startsWith('institution-logo'));
    
    if (!logoFile) {
      return res.json({
        success: false,
        exists: false,
        message: 'No hay logo'
      });
    }
    
    const filePath = path.join(logoDir, logoFile);
    const stats = fs.statSync(filePath);
    
    res.json({
      success: true,
      exists: true,
      filename: logoFile,
      size: stats.size,
      path: filePath,
      url: `http://localhost:5000/uploads/logos/${logoFile}`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;