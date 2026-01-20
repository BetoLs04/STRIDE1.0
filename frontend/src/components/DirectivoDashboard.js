import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const DirectivoDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificación más robusta
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.tipo !== 'directivo') {
      toast.error('Acceso no autorizado');
      navigate('/login');
      return;
    }
    
    fetchActividades();
  }, [user, navigate]);

  const fetchActividades = async () => {
    try {
      // Verificar que user tiene direccion_id
      if (!user.direccion_id) {
        toast.error('No tienes una dirección asignada');
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/api/university/actividades/direccion/${user.direccion_id}`);
      setActividades(response.data.data || []);
    } catch (error) {
      console.error('Error fetching actividades:', error);
      toast.error('Error al cargar actividades');
      setError('No se pudieron cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  // Función segura para obtener inicial
  const getInitial = () => {
    if (!user || !user.nombre) return '?';
    return user.nombre.charAt(0).toUpperCase();
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { label: 'Pendiente', class: 'estado-pendiente' },
      en_progreso: { label: 'En Progreso', class: 'estado-progreso' },
      completada: { label: 'Completada', class: 'estado-completada' }
    };
    
    const estadoInfo = estados[estado] || estados.pendiente;
    return <span className={`badge ${estadoInfo.class}`}>{estadoInfo.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Si no hay user, mostrar loading
  if (!user) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="spinner"></div>
        <p>Cargando información del usuario...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Panel de Directivo</h1>
          <div className="user-info">
            <div className="user-avatar-large">
              {getInitial()}
            </div>
            <div className="user-details">
              <h3>{user.nombre || 'Usuario no identificado'}</h3>
              <p>{user.cargo || 'Sin cargo'} • {user.direccion_nombre || 'Sin dirección asignada'}</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={() => navigate('/welcome')}>
            Ver STRIDE
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Inicio
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="section-header">
          <h2>📋 Actividades de mi Dirección</h2>
          <p>Actividades asignadas al personal de {user.direccion_nombre || 'tu dirección'}</p>
        </div>

        {error ? (
          <div className="error-message-box">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchActividades}>
              Reintentar
            </button>
          </div>
        ) : loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando actividades...</p>
          </div>
        ) : actividades.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📭</div>
            <h3>No hay actividades registradas</h3>
            <p>El personal aún no ha creado actividades para esta dirección.</p>
          </div>
        ) : (
          <div className="actividades-grid">
            {actividades.map(actividad => (
              <div key={actividad.id} className="actividad-card">
                <div className="actividad-header">
                  <h3>{actividad.titulo}</h3>
                  {getEstadoBadge(actividad.estado)}
                </div>
                
                <div className="actividad-body">
                  <p>{actividad.descripcion || 'Sin descripción'}</p>
                  
                  <div className="actividad-meta">
                    <div className="meta-item">
                      <span className="meta-label">📅 Fecha de entrega:</span>
                      <span className="meta-value">{formatDate(actividad.fecha_entrega)}</span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="meta-label">👤 Creado por:</span>
                      <span className="meta-value">{actividad.creado_por_nombre || 'Sistema'}</span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="meta-label">📅 Creado el:</span>
                      <span className="meta-value">{formatDate(actividad.fecha_creacion)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="actividad-footer">
                  <span className="direccion-tag">
                    🏛️ {actividad.direccion_nombre || 'Sin dirección'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-number">{actividades.length}</span>
            <span className="stat-label">Total Actividades</span>
          </div>
          
          <div className="stat-card">
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'pendiente').length}
            </span>
            <span className="stat-label">Pendientes</span>
          </div>
          
          <div className="stat-card">
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'en_progreso').length}
            </span>
            <span className="stat-label">En Progreso</span>
          </div>
          
          <div className="stat-card">
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'completada').length}
            </span>
            <span className="stat-label">Completadas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectivoDashboard;