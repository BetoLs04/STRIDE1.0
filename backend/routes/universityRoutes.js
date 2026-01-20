const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

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
        
        // Buscar en super_users
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
        
        // Respuesta SIMPLIFICADA - solo datos básicos
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
        
        // Buscar en super_users
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
        
        // Si no es super admin, buscar en directivos
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
        
        // Si no es directivo, buscar en personal
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
        
        // Si no se encontró usuario válido
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

// Obtener todos los super users (para administración)
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
        // Verificar conexión a BD
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

module.exports = router;