import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import FormNuevaDireccion from './FormNuevaDireccion';
import FormNuevoDirectivo from './FormNuevoDirectivo';
import FormNuevoPersonal from './FormNuevoPersonal';

const SuperAdminDashboard = ({ admin }) => {
  const navigate = useNavigate();
  
  // Estados para mostrar formularios modales
  const [showFormDireccion, setShowFormDireccion] = useState(false);
  const [showFormDirectivo, setShowFormDirectivo] = useState(false);
  const [showFormPersonal, setShowFormPersonal] = useState(false);
  
  // Estados para datos
  const [usuarios, setUsuarios] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [directivos, setDirectivos] = useState([]);
  const [personal, setPersonal] = useState([]);
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({ 
    usuarios: 0, 
    direcciones: 0, 
    directivos: 0, 
    personal: 0 
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!admin) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [admin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Iniciando carga de datos...');
      
      // 1. Obtener estadísticas
      try {
        const statsRes = await axios.get('http://localhost:5000/api/university/estadisticas');
        console.log('📊 Estadísticas:', statsRes.data);
        setEstadisticas(statsRes.data.data || { usuarios: 0, direcciones: 0, directivos: 0, personal: 0 });
      } catch (error) {
        console.warn('⚠️ Error cargando estadísticas:', error.message);
      }

      // 2. Obtener super usuarios
      try {
        const usersRes = await axios.get('http://localhost:5000/api/university/superusers');
        console.log('👥 Usuarios:', usersRes.data.data?.length || 0);
        setUsuarios(usersRes.data.data || []);
      } catch (error) {
        console.warn('⚠️ Error cargando usuarios:', error.message);
      }

      // 3. Obtener direcciones
      try {
        const dirRes = await axios.get('http://localhost:5000/api/university/direcciones');
        console.log('🏛️ Direcciones:', dirRes.data.data?.length || 0);
        setDirecciones(dirRes.data.data || []);
      } catch (error) {
        console.warn('⚠️ Error cargando direcciones:', error.message);
      }

      // 4. Obtener directivos
      try {
        const dirivosRes = await axios.get('http://localhost:5000/api/university/directivos');
        console.log('👔 Directivos:', dirivosRes.data.data?.length || 0);
        setDirectivos(dirivosRes.data.data || []);
      } catch (error) {
        console.warn('⚠️ Error cargando directivos:', error.message);
      }

      // 5. Obtener personal
      try {
        const persRes = await axios.get('http://localhost:5000/api/university/personal');
        console.log('👤 Personal:', persRes.data.data?.length || 0);
        setPersonal(persRes.data.data || []);
      } catch (error) {
        console.warn('⚠️ Error cargando personal:', error.message);
      }

      console.log('✅ Datos cargados exitosamente');
      
    } catch (error) {
      console.error('❌ Error general al cargar datos:', error);
      toast.error('Error al cargar datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h2>Panel de Super Administración</h2>
        <p>Bienvenido, <strong>{admin?.username || 'Administrador'}</strong>. Gestiona todo el sistema universitario.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveTab('usuarios')}>
          <span className="stat-number">{estadisticas.usuarios || 0}</span>
          <span className="stat-label">Super Usuarios</span>
          <div className="stat-icon">👥</div>
        </div>
        
        <div className="stat-card" onClick={() => setActiveTab('direcciones')}>
          <span className="stat-number">{estadisticas.direcciones || 0}</span>
          <span className="stat-label">Direcciones/Áreas</span>
          <div className="stat-icon">🏛️</div>
        </div>
        
        <div className="stat-card" onClick={() => setActiveTab('directivos')}>
          <span className="stat-number">{estadisticas.directivos || 0}</span>
          <span className="stat-label">Directivos</span>
          <div className="stat-icon">👔</div>
        </div>
        
        <div className="stat-card" onClick={() => setActiveTab('personal')}>
          <span className="stat-number">{estadisticas.personal || 0}</span>
          <span className="stat-label">Personal</span>
          <div className="stat-icon">👤</div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => setShowFormDireccion(true)}>
            <span className="action-icon">➕</span>
            <span>Nueva Dirección</span>
          </button>
          
          <button className="action-btn" onClick={() => setShowFormDirectivo(true)}>
            <span className="action-icon">👤</span>
            <span>Nuevo Directivo</span>
          </button>
          
          <button className="action-btn" onClick={() => setShowFormPersonal(true)}>
            <span className="action-icon">👥</span>
            <span>Nuevo Personal</span>
          </button>
          
          {/* NUEVO BOTÓN */}
          <button className="action-btn" onClick={() => navigate('/admin/actividades')}>
            <span className="action-icon">📋</span>
            <span>Ver Todas las Actividades</span>
          </button>
          
          <button className="action-btn" onClick={fetchData}>
            <span className="action-icon">🔄</span>
            <span>Actualizar Datos</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsuarios = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>👥 Super Usuarios</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
            ← Volver al Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/create-superadmin')}>
            + Nuevo Super Admin
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div className="no-data">
          <p>No hay usuarios registrados</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-superadmin')}>
            Crear Primer Usuario
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td><strong>#{usuario.id}</strong></td>
                  <td>
                    {usuario.username}
                    {usuario.id === admin?.id && (
                      <span style={{ 
                        marginLeft: '10px', 
                        background: 'var(--accent-gold)', 
                        color: 'var(--primary-blue)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        Tú
                      </span>
                    )}
                  </td>
                  <td>{usuario.email}</td>
                  <td>{new Date(usuario.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDirecciones = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>🏛️ Direcciones/Áreas</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
            ← Volver al Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => setShowFormDireccion(true)}>
            + Nueva Dirección
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Cargando direcciones...</div>
      ) : direcciones.length === 0 ? (
        <div className="no-data">
          <p>No hay direcciones registradas</p>
          <button className="btn btn-primary" onClick={() => setShowFormDireccion(true)}>
            Crear Primera Dirección
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Fecha de Creación</th>
              </tr>
            </thead>
            <tbody>
              {direcciones.map(dir => (
                <tr key={dir.id}>
                  <td><strong>#{dir.id}</strong></td>
                  <td>{dir.nombre}</td>
                  <td>{new Date(dir.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDirectivos = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>👔 Directivos</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
            ← Volver al Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => setShowFormDirectivo(true)}>
            + Nuevo Directivo
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Cargando directivos...</div>
      ) : directivos.length === 0 ? (
        <div className="no-data">
          <p>No hay directivos registrados</p>
          <button className="btn btn-primary" onClick={() => setShowFormDirectivo(true)}>
            Crear Primer Directivo
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Dirección</th>
                <th>Email</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {directivos.map(dir => (
                <tr key={dir.id}>
                  <td><strong>{dir.nombre_completo}</strong></td>
                  <td>{dir.cargo}</td>
                  <td>{dir.direccion_nombre || 'Sin asignar'}</td>
                  <td>{dir.email}</td>
                  <td>{new Date(dir.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPersonal = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>👥 Personal Administrativo</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
            ← Volver al Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => setShowFormPersonal(true)}>
            + Nuevo Personal
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Cargando personal...</div>
      ) : personal.length === 0 ? (
        <div className="no-data">
          <p>No hay personal registrado</p>
          <button className="btn btn-primary" onClick={() => setShowFormPersonal(true)}>
            Crear Primer Personal
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Dirección</th>
                <th>Email</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {personal.map(pers => (
                <tr key={pers.id}>
                  <td><strong>{pers.nombre_completo}</strong></td>
                  <td>{pers.puesto}</td>
                  <td>{pers.direccion_nombre || 'Sin asignar'}</td>
                  <td>{pers.email}</td>
                  <td>{new Date(pers.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="superadmin-dashboard">
      {/* Header del Dashboard */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>STRIDE University Admin</h1>
          <div className="user-info">
            <span className="user-avatar">
              {(admin?.username || 'A').charAt(0).toUpperCase()}
            </span>
            <span>{admin?.username || 'Admin'} • Super Admin</span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn btn-accent" onClick={fetchData} disabled={loading}>
            {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Inicio
          </button>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          🏠 Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          👥 Usuarios
        </button>
        <button 
          className={`tab-btn ${activeTab === 'direcciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('direcciones')}
        >
          🏛️ Direcciones
        </button>
        <button 
          className={`tab-btn ${activeTab === 'directivos' ? 'active' : ''}`}
          onClick={() => setActiveTab('directivos')}
        >
          👔 Directivos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          👤 Personal
        </button>
      </div>

      {/* Contenido principal según pestaña activa */}
      <div className="dashboard-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'usuarios' && renderUsuarios()}
        {activeTab === 'direcciones' && renderDirecciones()}
        {activeTab === 'directivos' && renderDirectivos()}
        {activeTab === 'personal' && renderPersonal()}
      </div>

      {/* Modales de formularios (solo se muestran cuando están activos) */}
      {showFormDireccion && (
        <FormNuevaDireccion 
          onClose={() => setShowFormDireccion(false)}
          onSuccess={fetchData}
        />
      )}
      
      {showFormDirectivo && (
        <FormNuevoDirectivo 
          admin={admin}
          onClose={() => setShowFormDirectivo(false)}
          onSuccess={fetchData}
        />
      )}
      
      {showFormPersonal && (
        <FormNuevoPersonal 
          admin={admin}
          onClose={() => setShowFormPersonal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;