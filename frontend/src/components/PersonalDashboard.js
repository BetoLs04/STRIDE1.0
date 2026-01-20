import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const PersonalDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormActividad, setShowFormActividad] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_entrega: ''
  });

  useEffect(() => {
    // Verificación más robusta
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.tipo !== 'personal') {
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
        setError('No tienes una dirección asignada');
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitActividad = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/api/university/actividades', {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fecha_entrega: formData.fecha_entrega || null,
        direccion_id: user.direccion_id,
        creado_por_id: user.id,
        creado_por_tipo: 'personal'
      });
      
      toast.success('Actividad creada exitosamente!');
      setFormData({ titulo: '', descripcion: '', fecha_entrega: '' });
      setShowFormActividad(false);
      fetchActividades();
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear actividad');
    }
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

  const updateEstadoActividad = async (actividadId, nuevoEstado) => {
    try {
      await axios.put(`http://localhost:5000/api/university/actividades/${actividadId}/estado`, {
        estado: nuevoEstado
      });
      
      toast.success('Estado actualizado');
      fetchActividades();
      
    } catch (error) {
      toast.error('Error al actualizar estado');
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
          <h1>Panel de Personal</h1>
          <div className="user-info">
            <div className="user-avatar-large">
              {getInitial()}
            </div>
            <div className="user-details">
              <h3>{user.nombre || 'Usuario no identificado'}</h3>
              <p>{user.puesto || 'Sin puesto'} • {user.direccion_nombre || 'Sin dirección asignada'}</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => setShowFormActividad(true)}>
            + Nueva Actividad
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/welcome')}>
            Ver STRIDE
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="section-header">
          <h2>📋 Mis Actividades</h2>
          <p>Gestiona las actividades de {user.direccion_nombre || 'tu dirección'}</p>
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
            <p>Crea tu primera actividad para comenzar.</p>
            <button className="btn btn-primary" onClick={() => setShowFormActividad(true)}>
              + Crear Primera Actividad
            </button>
          </div>
        ) : (
          <div className="actividades-grid">
            {actividades.map(actividad => (
              <div key={actividad.id} className="actividad-card">
                <div className="actividad-header">
                  <h3>{actividad.titulo}</h3>
                  <div className="actividad-actions">
                    {getEstadoBadge(actividad.estado)}
                    
                    <div className="dropdown-estados">
                      <select 
                        value={actividad.estado}
                        onChange={(e) => updateEstadoActividad(actividad.id, e.target.value)}
                        className="estado-select"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="completada">Completada</option>
                      </select>
                    </div>
                  </div>
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
                  
                  {actividad.creado_por_id === user.id && (
                    <span className="creador-tag">
                      ✏️ Creada por mí
                    </span>
                  )}
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
              {actividades.filter(a => a.creado_por_id === user.id).length}
            </span>
            <span className="stat-label">Creadas por mí</span>
          </div>
          
          <div className="stat-card">
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'completada').length}
            </span>
            <span className="stat-label">Completadas</span>
          </div>
        </div>
      </div>

      {/* Modal para nueva actividad */}
      {showFormActividad && (
        <div className="form-modal">
          <div className="form-modal-content">
            <div className="form-header">
              <h2>Nueva Actividad</h2>
              <p>Crear nueva actividad para {user.direccion_nombre || 'tu dirección'}</p>
              <button className="close-btn" onClick={() => setShowFormActividad(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmitActividad}>
              <div className="form-group">
                <label>Título de la Actividad *</label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej: Preparar informe mensual"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe los detalles de la actividad..."
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Fecha de Entrega (Opcional)</label>
                <input
                  type="date"
                  name="fecha_entrega"
                  value={formData.fecha_entrega}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-info">
                <p><strong>Nota:</strong> Esta actividad será visible para los directivos de {user.direccion_nombre || 'tu dirección'}</p>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Crear Actividad
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowFormActividad(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDashboard;