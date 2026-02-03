import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const DirectivoDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Estado para controlar expansión de años y períodos
  const [expansiones, setExpansiones] = useState({
    años: {}, // Ej: { '2024': true, '2023': false }
    periodos: {} // Ej: { '2024-enero-abril': true, '2024-mayo-agosto': false }
  });

  // Configuración del carrusel SIN DOTS
  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
    autoplay: false,
    pauseOnHover: true
  };

  useEffect(() => {
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

  // Función para abrir modal de actividad
  const abrirModalActividad = (actividad) => {
    setActividadSeleccionada(actividad);
    setModalAbierto(true);
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
  };

  // Función para cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setActividadSeleccionada(null);
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  };

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && modalAbierto) {
        cerrarModal();
      }
    };

    if (modalAbierto) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [modalAbierto]);

  // ========== FUNCIONES PARA AGRUPAR POR AÑO Y PERÍODO ==========
  
  const obtenerAnioYPeriodo = (fecha) => {
    if (!fecha) return { anio: 'Sin año', periodo: 'sin-fecha', anioNum: 0 };
    
    const fechaActividad = new Date(fecha);
    const anio = fechaActividad.getFullYear();
    const mes = fechaActividad.getMonth() + 1;
    
    let periodo;
    if (mes >= 1 && mes <= 4) periodo = 'enero-abril';
    else if (mes >= 5 && mes <= 8) periodo = 'mayo-agosto';
    else if (mes >= 9 && mes <= 12) periodo = 'septiembre-diciembre';
    else periodo = 'sin-periodo';
    
    return { 
      anio: anio.toString(), 
      periodo, 
      anioNum: anio,
      periodoNum: mes
    };
  };

  const agruparPorAnioYPeriodo = (actividadesLista) => {
    const agrupacion = {};
    
    actividadesLista.forEach(actividad => {
      const { anio, periodo, anioNum } = obtenerAnioYPeriodo(actividad.fecha_inicio);
      
      if (!agrupacion[anio]) {
        agrupacion[anio] = {
          anio: anio,
          anioNum: anioNum,
          actividades: [],
          periodos: {
            'enero-abril': { 
              actividades: [], 
              label: '❄️ Enero - Abril', 
              color: '#4A90E2',
              emoji: '❄️',
              orden: 1
            },
            'mayo-agosto': { 
              actividades: [], 
              label: '🌸 Mayo - Agosto', 
              color: '#50C878',
              emoji: '🌸',
              orden: 2
            },
            'septiembre-diciembre': { 
              actividades: [], 
              label: '🍂 Septiembre - Diciembre', 
              color: '#FF7F50',
              emoji: '🍂',
              orden: 3
            },
            'sin-fecha': { 
              actividades: [], 
              label: '📅 Sin fecha definida', 
              color: '#A0A0A0',
              emoji: '📅',
              orden: 4
            }
          }
        };
      }
      
      agrupacion[anio].actividades.push(actividad);
      
      if (agrupacion[anio].periodos[periodo]) {
        agrupacion[anio].periodos[periodo].actividades.push(actividad);
      }
    });
    
    const añosOrdenados = Object.values(agrupacion).sort((a, b) => b.anioNum - a.anioNum);
    
    añosOrdenados.forEach(año => {
      Object.values(año.periodos).forEach(periodo => {
        periodo.actividades.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
      });
      año.actividades.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
    });
    
    return añosOrdenados;
  };

  const obtenerPeriodoActual = () => {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth() + 1;
    
    let periodoActual;
    if (mesActual >= 1 && mesActual <= 4) periodoActual = 'enero-abril';
    else if (mesActual >= 5 && mesActual <= 8) periodoActual = 'mayo-agosto';
    else if (mesActual >= 9 && mesActual <= 12) periodoActual = 'septiembre-diciembre';
    else periodoActual = 'enero-abril';
    
    return { anio: anioActual.toString(), periodo: periodoActual };
  };

  const toggleAnioExpandido = (anio) => {
    setExpansiones(prev => ({
      ...prev,
      años: {
        ...prev.años,
        [anio]: !prev.años[anio]
      }
    }));
  };

  const togglePeriodoExpandido = (anio, periodoKey) => {
    const key = `${anio}-${periodoKey}`;
    setExpansiones(prev => ({
      ...prev,
      periodos: {
        ...prev.periodos,
        [key]: !prev.periodos[key]
      }
    }));
  };

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
    if (!dateString) return 'No definida';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getDiasRestantes = (fechaFin) => {
    if (!fechaFin) return null;
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diffTime = fin - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `Faltan ${diffDays} días`;
    if (diffDays === 0) return 'Finaliza hoy';
    return `Finalizó hace ${Math.abs(diffDays)} días`;
  };

  // Componente simplificado para la tarjeta de actividad (solo título)
  const TarjetaActividadMinimalista = ({ actividad }) => {
    return (
      <div className="actividad-minimalista-card">
        <div className="actividad-minimalista-content">
          <div className="actividad-minimalista-info">
            <h3>{actividad.titulo}</h3>
            <div className="actividad-minimalista-metadata">
              <span className="actividad-minimalista-creador">
                👤 {actividad.creado_por_nombre || 'Sistema'}
              </span>
              <span className="actividad-minimalista-fecha">
                📅 {new Date(actividad.fecha_inicio).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
              {getEstadoBadge(actividad.estado)}
            </div>
          </div>
          
          <div className="actividad-minimalista-actions">
            <button 
              className="btn btn-primary btn-small"
              onClick={() => abrirModalActividad(actividad)}
            >
              👁️ Ver detalles
            </button>
          </div>
        </div>
      </div>
    );
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

  // Obtener actividades agrupadas por año y período
  const agrupacionPorAnio = agruparPorAnioYPeriodo(actividades);
  const periodoActual = obtenerPeriodoActual();

  return (
    <div className="dashboard-container">
      {/* Cabecera con Panel de Directivo a la izquierda y usuario a la derecha */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Panel de Directivo</h1>
        </div>
        
        <div className="header-right">
          <div className="user-info-large">
            <div className="user-details">
              <h3>{user.nombre || 'Usuario no identificado'}</h3>
              <p>
                <span className="user-cargo">{user.cargo || 'Sin cargo'}</span>
                <span className="user-separator"> • </span>
                <span className="user-direccion">{user.direccion_nombre || 'Sin dirección asignada'}</span>
              </p>
            </div>
            <div className="user-avatar-large">
              {getInitial()}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Banner mejorado */}
        <div className="dashboard-header-banner">
          <div className="banner-left">
            <h2 className="banner-title">📋 Actividades de mi Dirección</h2>
            <p className="banner-subtitle">
              Actividades creadas por el personal de {user.direccion_nombre || 'tu dirección'}
            </p>
          </div>
          
          <div className="banner-right">
            <div className="periodo-actual-banner">
              <span className="periodo-emoji-banner">
                {periodoActual.periodo === 'enero-abril' ? '❄️' : 
                 periodoActual.periodo === 'mayo-agosto' ? '🌸' : '🍂'}
              </span>
              <div className="periodo-text-banner">
                <h4>📅 PERÍODO ACTUAL</h4>
                <p>
                  Año {periodoActual.anio} • 
                  {periodoActual.periodo === 'enero-abril' ? ' Enero - Abril' : 
                   periodoActual.periodo === 'mayo-agosto' ? ' Mayo - Agosto' : ' Septiembre - Diciembre'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card" onClick={() => {
            const pendientes = actividades.filter(a => a.estado === 'pendiente').length;
            toast.info(`${pendientes} actividades pendientes`);
          }}>
            <span className="stat-number">{actividades.length}</span>
            <span className="stat-label">Total Actividades</span>
            <div className="stat-icon">📋</div>
          </div>
          
          <div className="stat-card" onClick={() => {
            const pendientes = actividades.filter(a => a.estado === 'pendiente').length;
            toast.info(`${pendientes} actividades pendientes`);
          }}>
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'pendiente').length}
            </span>
            <span className="stat-label">Pendientes</span>
            <div className="stat-icon">⏳</div>
          </div>
          
          <div className="stat-card" onClick={() => {
            const enProgreso = actividades.filter(a => a.estado === 'en_progreso').length;
            toast.info(`${enProgreso} actividades en progreso`);
          }}>
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'en_progreso').length}
            </span>
            <span className="stat-label">En Progreso</span>
            <div className="stat-icon">🚀</div>
          </div>
          
          <div className="stat-card" onClick={() => {
            const completadas = actividades.filter(a => a.estado === 'completada').length;
            toast.info(`${completadas} actividades completadas`);
          }}>
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'completada').length}
            </span>
            <span className="stat-label">Completadas</span>
            <div className="stat-icon">✅</div>
          </div>
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
            <button className="btn btn-primary" onClick={fetchActividades}>
              Actualizar
            </button>
          </div>
        ) : (
          <div className="periodos-container">
            <div className="periodos-controls">
              <h3>📅 Actividades por Año y Período</h3>
            </div>

            {/* Mostrar años con actividades */}
            {agrupacionPorAnio
              .filter(añoData => añoData.actividades.length > 0)
              .map(añoData => (
                <div key={añoData.anio} className="año-acordeon">
                  <div 
                    className="año-acordeon-header" 
                    onClick={() => toggleAnioExpandido(añoData.anio)}
                    style={{ 
                      backgroundColor: añoData.anio === periodoActual.anio 
                        ? '#e8f4fd' 
                        : '#f8f9fa' 
                    }}
                  >
                    <div className="año-acordeon-title">
                      <span className="año-emoji">📅</span>
                      <h3>Año {añoData.anio}</h3>
                      {añoData.anio === periodoActual.anio && (
                        <span className="año-actual-badge">AÑO ACTUAL</span>
                      )}
                    </div>
                    
                    <div className="año-acordeon-controls">
                      <span className="año-count">
                        {añoData.actividades.length} actividad(es)
                      </span>
                      <span className="año-toggle">
                        {expansiones.años[añoData.anio] ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                  
                  {expansiones.años[añoData.anio] && (
                    <div className="año-acordeon-content">
                      {/* Mostrar períodos dentro del año */}
                      {Object.entries(añoData.periodos)
                        .filter(([_, periodoData]) => periodoData.actividades.length > 0)
                        .sort(([keyA, a], [keyB, b]) => a.orden - b.orden)
                        .map(([periodoKey, periodoData]) => (
                          <div key={periodoKey} className="periodo-acordeon">
                            <div 
                              className="periodo-acordeon-header" 
                              onClick={() => togglePeriodoExpandido(añoData.anio, periodoKey)}
                              style={{ borderLeftColor: periodoData.color }}
                            >
                              <div className="periodo-acordeon-title">
                                <span className="periodo-emoji">{periodoData.emoji}</span>
                                <h4>{periodoData.label}</h4>
                                {añoData.anio === periodoActual.anio && periodoKey === periodoActual.periodo && (
                                  <span className="periodo-actual-badge">PERÍODO ACTUAL</span>
                                )}
                              </div>
                              
                              <div className="periodo-acordeon-controls">
                                <span className="periodo-count">
                                  {periodoData.actividades.length} actividad(es)
                                </span>
                                <span className="periodo-toggle">
                                  {expansiones.periodos[`${añoData.anio}-${periodoKey}`] ? '▲' : '▼'}
                                </span>
                              </div>
                            </div>
                            
                            {expansiones.periodos[`${añoData.anio}-${periodoKey}`] && (
                              <div className="periodo-acordeon-content">
                                <div className="actividades-lista-minimalista">
                                  {periodoData.actividades.map(actividad => (
                                    <TarjetaActividadMinimalista 
                                      key={actividad.id} 
                                      actividad={actividad} 
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
        
        {/* Resumen por creador mejorado */}
        {actividades.length > 0 && (
          <div className="resumen-creadores-mejorado">
            <div className="resumen-header">
              <h3>📊 Resumen por Creador</h3>
              <p>Estadísticas de actividades por cada miembro del equipo</p>
            </div>
            
            <div className="creadores-resumen-grid">
              {Array.from(new Set(actividades.map(a => a.creado_por_nombre)))
                .filter(creador => creador && creador !== 'Sistema')
                .map(creador => {
                  const actividadesCreador = actividades.filter(a => a.creado_por_nombre === creador);
                  const tipo = actividadesCreador[0]?.creado_por_tipo;
                  const completadas = actividadesCreador.filter(a => a.estado === 'completada').length;
                  const enProgreso = actividadesCreador.filter(a => a.estado === 'en_progreso').length;
                  const pendientes = actividadesCreador.filter(a => a.estado === 'pendiente').length;
                  const porcentajeCompletadas = actividadesCreador.length > 0 ? 
                    Math.round((completadas / actividadesCreador.length) * 100) : 0;
                  
                  return (
                    <div key={creador} className="creador-resumen-card">
                      <div className="creador-resumen-header">
                        <div className="creador-avatar-grande">
                          {creador.charAt(0).toUpperCase()}
                          {tipo === 'personal' ? '' : '👔'}
                        </div>
                        <div className="creador-info-detallada">
                          <h4>{creador}</h4>
                          <span className="creador-role-detallado">
                            {tipo === 'personal' ? 'Personal Administrativo' : 'Directivo'}
                          </span>
                          <span className="creador-actividades-count">
                            {actividadesCreador.length} actividad(es)
                          </span>
                        </div>
                      </div>
                      
                      <div className="creador-estadisticas">
                        <div className="estadistica-item">
                          <div className="estadistica-circulo" style={{ 
                            '--porcentaje': porcentajeCompletadas,
                            '--color': porcentajeCompletadas >= 70 ? '#28a745' : 
                                      porcentajeCompletadas >= 40 ? '#ffc107' : '#dc3545'
                          }}>
                            <span className="estadistica-porcentaje">{porcentajeCompletadas}%</span>
                          </div>
                          <span className="estadistica-label">Efectividad</span>
                        </div>
                        
                        <div className="estadisticas-detalles">
                          <div className="detalle-estado completada">
                            <span className="detalle-icon">✅</span>
                            <span className="detalle-count">{completadas}</span>
                            <span className="detalle-label">Completadas</span>
                          </div>
                          <div className="detalle-estado en-progreso">
                            <span className="detalle-icon">🚀</span>
                            <span className="detalle-count">{enProgreso}</span>
                            <span className="detalle-label">En Progreso</span>
                          </div>
                          <div className="detalle-estado pendiente">
                            <span className="detalle-icon">⏳</span>
                            <span className="detalle-count">{pendientes}</span>
                            <span className="detalle-label">Pendientes</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="creador-ultima-actividad">
                        <span className="ultima-label">Última actividad:</span>
                        <span className="ultima-fecha">
                          {actividadesCreador.length > 0 ? 
                            new Date(actividadesCreador[0].fecha_creacion).toLocaleDateString('es-ES', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            }) : 
                            'Sin actividades'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Actividad */}
      {modalAbierto && actividadSeleccionada && (
        <div className="actividad-modal-overlay" onClick={cerrarModal}>
          <div className="actividad-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cerrarModal}>
              ✕
            </button>
            
            <div className="modal-header">
              <h2>{actividadSeleccionada.titulo}</h2>
              <div className="modal-header-badges">
                {getEstadoBadge(actividadSeleccionada.estado)}
                <span className={`tipo-badge-modal ${actividadSeleccionada.creado_por_tipo}`}>
                  {actividadSeleccionada.creado_por_tipo === 'personal' ? '📝 Personal' : '👔 Directivo'}
                </span>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="modal-creador-info">
                <span className="creador-label">👤 Creador:</span>
                <span className="creador-valor">
                  {actividadSeleccionada.creado_por_nombre || 'Sistema'}
                </span>
                <span className="creador-separator">•</span>
                <span className="creador-direccion">
                  🏛️ {actividadSeleccionada.direccion_nombre || 'Sin dirección'}
                </span>
              </div>
              
              <div className="modal-descripcion">
                <h4>📄 Descripción:</h4>
                <p>{actividadSeleccionada.descripcion || 'Sin descripción'}</p>
              </div>
              
              {/* Carrusel de imágenes en modal */}
              {actividadSeleccionada.imagenes && actividadSeleccionada.imagenes.length > 0 && (
                <div className="modal-imagenes">
                  <h4>🖼️ Galería de Evidencias ({actividadSeleccionada.imagenes.length})</h4>
                  <Slider {...carouselSettings} className="modal-carousel">
                    {actividadSeleccionada.imagenes.map((img, index) => (
                      <div key={index} className="modal-slide">
                        <div className="modal-slide-content">
                          <img 
                            src={img.url} 
                            alt={`Evidencia ${index + 1} - ${actividadSeleccionada.titulo}`}
                            className="modal-image"
                            onError={(e) => {
                              e.target.src = '/placeholder.jpg';
                              e.target.alt = 'Imagen no disponible';
                            }}
                          />
                          <div className="modal-image-info">
                            <span>Evidencia {index + 1} de {actividadSeleccionada.imagenes.length}</span>
                            <small>{img.nombre_archivo || 'Sin nombre'}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              )}
              
              <div className="modal-fechas">
                <h4>📅 Información de Fechas</h4>
                <div className="modal-fechas-grid">
                  <div className="modal-fecha-item">
                    <div className="modal-fecha-header">
                      <span className="modal-fecha-icon">📅</span>
                      <span className="modal-fecha-label">Fecha de creación:</span>
                    </div>
                    <div className="modal-fecha-valor">
                      {formatDate(actividadSeleccionada.fecha_creacion)}
                    </div>
                  </div>
                  
                  <div className="modal-fecha-item">
                    <div className="modal-fecha-header">
                      <span className="modal-fecha-icon">🚀</span>
                      <span className="modal-fecha-label">Fecha de inicio:</span>
                    </div>
                    <div className="modal-fecha-valor">
                      {formatDate(actividadSeleccionada.fecha_inicio)}
                    </div>
                  </div>
                  
                  <div className="modal-fecha-item">
                    <div className="modal-fecha-header">
                      <span className="modal-fecha-icon">🏁</span>
                      <span className="modal-fecha-label">Fecha de fin:</span>
                    </div>
                    <div className="modal-fecha-valor">
                      {formatDate(actividadSeleccionada.fecha_fin)}
                      {actividadSeleccionada.fecha_fin && (
                        <span className="modal-dias-restantes">
                          <span className={`dias-restantes ${new Date(actividadSeleccionada.fecha_fin) < new Date() ? 'finalizado' : 'activo'}`}>
                            {getDiasRestantes(actividadSeleccionada.fecha_fin)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cerrarModal}>
                Cerrar
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  toast.info('Funcionalidad de comentarios próximamente');
                }}
              >
                💬 Agregar Comentario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectivoDashboard;