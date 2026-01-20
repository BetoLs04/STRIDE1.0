import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const CreateSuperAdmin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [superAdminExists, setSuperAdminExists] = useState(false);

  useEffect(() => {
    checkSuperAdminExistence();
  }, []);

  const checkSuperAdminExistence = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/university/superusers');
      const hasSuperAdmin = response.data.data && response.data.data.length > 0;
      setSuperAdminExists(hasSuperAdmin);
      
      // Si ya existe un super admin, redirigir al login
      if (hasSuperAdmin) {
        toast.warning('Ya existe un Super Administrador configurado');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error verificando super admin:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // Verificar nuevamente que no exista super admin
    if (superAdminExists) {
      toast.error('Ya existe un Super Administrador. Contacta al administrador actual.');
      navigate('/login');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Creando primer Super Admin con datos:', formData);
      const createRes = await axios.post('http://localhost:5000/api/university/create-superuser', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      console.log('Respuesta creación:', createRes.data);
      toast.success('¡Super Administrador creado exitosamente!');
      toast.info('Ahora podrás configurar el sistema completo.');

      // Hacer login automático con el nuevo usuario
      const loginRes = await axios.post('http://localhost:5000/api/university/login', {
        email: formData.email,
        password: formData.password
      });

      console.log('Respuesta login:', loginRes.data);

      if (loginRes.data.success && onLogin) {
        const userData = loginRes.data.user;
        onLogin(userData);
        localStorage.setItem('stride_user', JSON.stringify(userData));
        
        // Mostrar mensaje de bienvenida especial
        setTimeout(() => {
          toast.info('Bienvenido al panel de Super Administración. Aquí podrás configurar direcciones, directivos y personal.');
        }, 1000);
        
        navigate('/admin/dashboard');
      }

    } catch (error) {
      console.error('Error completo:', error);
      toast.error(error.response?.data?.error || 'Error al crear administrador');
    } finally {
      setLoading(false);
    }
  };

  // Si ya existe super admin, mostrar mensaje
  if (superAdminExists) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Acceso Restringido</h2>
            <p className="auth-subtitle">El sistema ya está configurado</p>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3>Ya existe un Super Administrador</h3>
            <p style={{ marginBottom: '2rem' }}>
              Solo puede existir un Super Administrador principal en el sistema.
              Si necesitas acceso, contacta al administrador actual.
            </p>
            <div className="button-group">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/login')}
              >
                Ir al Login
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Configurar Sistema</h2>
          <p className="auth-subtitle">Crear primer Super Administrador</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre de Usuario *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Ej: admin.rectoria"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Correo Electrónico *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@stride.edu"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Contraseña *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite la contraseña"
              required
              disabled={loading}
            />
          </div>

          <div className="form-info important-note">
            <p><strong>⚠️ IMPORTANTE:</strong> Esta será la cuenta principal del sistema. 
            Después de crearla, podrás configurar todas las direcciones, directivos y personal.</p>
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Configurando...' : 'Configurar Sistema'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSuperAdmin;