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

  // Estado para controlar expansión de años y períodos
  const [expansiones, setExpansiones] = useState({
    años: {}, // Ej: { '2024': true, '2023': false }
    periodos: {} // Ej: { '2024-enero-abril': true, '2024-mayo-agosto': false }
  });

  // Configuración del carrusel
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true
  };

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
      
      console.log('🔄 Cargando actividades para dirección:', user.direccion_id);
      const response = await axios.get(`http://localhost:5000/api/university/actividades/direccion/${user.direccion_id}`);
      
      console.log('📊 Actividades recibidas:', response.data.data?.length || 0);
      setActividades(response.data.data || []);
    } catch (error) {
      console.error('Error fetching actividades:', error);
      toast.error('Error al cargar actividades');
      setError('No se pudieron cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  // ========== FUNCIONES PARA AGRUPAR POR AÑO Y PERÍODO ==========
  
  // Función para obtener año y período
  const obtenerAnioYPeriodo = (fecha) => {
    if (!fecha) return { anio: 'Sin año', periodo: 'sin-fecha', anioNum: 0 };
    
    const fechaActividad = new Date(fecha);
    const anio = fechaActividad.getFullYear();
    const mes = fechaActividad.getMonth() + 1; // 1-12
    
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

  // Agrupar actividades por AÑO primero, luego por PERÍODO
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
      
      // Agregar a actividades totales del año
      agrupacion[anio].actividades.push(actividad);
      
      // Agregar al período correspondiente
      if (agrupacion[anio].periodos[periodo]) {
        agrupacion[anio].periodos[periodo].actividades.push(actividad);
      }
    });
    
    // Ordenar años de más reciente a más antiguo
    const añosOrdenados = Object.values(agrupacion).sort((a, b) => b.anioNum - a.anioNum);
    
    // Ordenar actividades dentro de cada período por fecha (más reciente primero)
    añosOrdenados.forEach(año => {
      Object.values(año.periodos).forEach(periodo => {
        periodo.actividades.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
      });
      año.actividades.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
    });
    
    return añosOrdenados;
  };

  // Función para obtener el período actual (año y período)
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

  // Funciones para controlar expansión
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

  const expandirTodos = () => {
    const nuevasExpansiones = { años: {}, periodos: {} };
    
    agrupacionPorAnio.forEach(añoData => {
      nuevasExpansiones.años[añoData.anio] = true;
      Object.keys(añoData.periodos).forEach(periodoKey => {
        const key = `${añoData.anio}-${periodoKey}`;
        nuevasExpansiones.periodos[key] = true;
      });
    });
    
    setExpansiones(nuevasExpansiones);
  };

  const colapsarTodos = () => {
    setExpansiones({ años: {}, periodos: {} });
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

  // Función para verificar si una imagen existe
  const checkImageExists = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
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
          <button 
            className="btn btn-accent" 
            onClick={() => window.open('http://localhost:5000/check-uploads', '_blank')}
            title="Verificar archivos subidos"
          >
            📁 Ver Uploads
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="section-header">
          <h2>📋 Actividades de mi Dirección</h2>
          <p>Actividades creadas por el personal de {user.direccion_nombre || 'tu dirección'}</p>
          <div className="stats-summary">
            <span className="stat-summary-item">
              <strong>Total:</strong> {actividades.length} actividades
            </span>
            <span className="stat-summary-item">
              <strong>En progreso:</strong> {actividades.filter(a => a.estado === 'en_progreso').length}
            </span>
            <span className="stat-summary-item">
              <strong>Completadas:</strong> {actividades.filter(a => a.estado === 'completada').length}
            </span>
          </div>
          
          {/* Indicador del año y período actual */}
          <div className="periodo-actual-indicator">
            <div className="periodo-actual-indicator-icon">
              {periodoActual.periodo === 'enero-abril' ? '❄️' : 
               periodoActual.periodo === 'mayo-agosto' ? '🌸' : '🍂'}
            </div>
            <div className="periodo-actual-indicator-text">
              <h4>📅 PERÍODO ACTUAL</h4>
              <p>Año {periodoActual.anio} • {periodoActual.periodo === 'enero-abril' ? 'Enero - Abril' : 
                 periodoActual.periodo === 'mayo-agosto' ? 'Mayo - Agosto' : 'Septiembre - Diciembre'}</p>
            </div>
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
            {/* Controles para expandir/colapsar todos */}
            <div className="periodos-controls">
              <h3>📅 Actividades por Año y Período</h3>
              <div className="periodos-buttons">
                <button className="btn btn-small" onClick={expandirTodos}>
                  ▶️ Expandir Todos
                </button>
                <button className="btn btn-small" onClick={colapsarTodos}>
                  ◀️ Colapsar Todos
                </button>
              </div>
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
                                <div className="actividades-grid">
                                  {periodoData.actividades.map(actividad => (
                                    <div key={actividad.id} className="actividad-card">
                                      <div className="actividad-header">
                                        <div className="actividad-title-section">
                                          <h3>{actividad.titulo}</h3>
                                          <span className="creador-info">
                                            👤 {actividad.creado_por_nombre || 'Sistema'}
                                            {actividad.creado_por_tipo === 'personal' && ' (Personal)'}
                                            {actividad.creado_por_tipo === 'directivo' && ' (Directivo)'}
                                          </span>
                                        </div>
                                        <div className="actividad-actions">
                                          {getEstadoBadge(actividad.estado)}
                                        </div>
                                      </div>
                                      
                                      <div className="actividad-body">
                                        <p className="actividad-descripcion">{actividad.descripcion || 'Sin descripción'}</p>
                                        
                                        {/* Carrusel de imágenes */}
                                        {actividad.imagenes && actividad.imagenes.length > 0 && (
                                          <div className="actividad-imagenes-carousel">
                                            <div className="carousel-header">
                                              <span className="carousel-title">
                                                🖼️ Galería de evidencias ({actividad.imagenes.length})
                                              </span>
                                            </div>
                                            <Slider {...carouselSettings} className="imagenes-carousel">
                                              {actividad.imagenes.map((img, index) => (
                                                <div key={index} className="carousel-slide">
                                                  <div className="slide-content">
                                                    <img 
                                                      src={img.url} 
                                                      alt={`Evidencia ${index + 1} - ${actividad.titulo}`}
                                                      className="carousel-image"
                                                      onError={(e) => {
                                                        console.error(`❌ Error cargando imagen: ${img.url}`);
                                                        e.target.src = '/placeholder.jpg';
                                                        e.target.alt = 'Imagen no disponible';
                                                      }}
                                                    />
                                                    <div className="image-caption">
                                                      <span>Evidencia {index + 1} de {actividad.imagenes.length}</span>
                                                      <small>{img.nombre_archivo || 'Sin nombre'}</small>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </Slider>
                                            <div className="carousel-info">
                                              <small>
                                                {actividad.imagenes.length} imagen(es) subida(s) por el personal como evidencia de la actividad.
                                              </small>
                                            </div>
                                          </div>
                                        )}
                                        
                                        <div className="actividad-meta">
                                          <div className="meta-row">
                                            <div className="meta-item">
                                              <span className="meta-label">📅 Fecha de inicio:</span>
                                              <span className="meta-value highlight">{formatDate(actividad.fecha_inicio)}</span>
                                            </div>
                                            
                                            <div className="meta-item">
                                              <span className="meta-label">📅 Fecha de fin:</span>
                                              <span className="meta-value">{formatDate(actividad.fecha_fin)}</span>
                                              {actividad.fecha_fin && (
                                                <span className={`dias-restantes ${new Date(actividad.fecha_fin) < new Date() ? 'finalizado' : 'activo'}`}>
                                                  {getDiasRestantes(actividad.fecha_fin)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div className="meta-row">
                                            <div className="meta-item">
                                              <span className="meta-label">📅 Creada el:</span>
                                              <span className="meta-value">{formatDate(actividad.fecha_creacion)}</span>
                                            </div>
                                            
                                            <div className="meta-item">
                                              <span className="meta-label">👥 Creador:</span>
                                              <span className="meta-value creador-tag">
                                                {actividad.creado_por_tipo === 'personal' ? '👤 Personal' : '👔 Directivo'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="actividad-footer">
                                        <div className="footer-left">
                                          <span className="direccion-tag">
                                            🏛️ {actividad.direccion_nombre || 'Sin dirección'}
                                          </span>
                                          <span className="tipo-actividad-tag">
                                            {actividad.creado_por_tipo === 'personal' ? '📝 Actividad de Personal' : '👔 Actividad Directiva'}
                                          </span>
                                        </div>
                                        
                                        <div className="footer-right">
                                          <button 
                                            className="btn btn-small btn-outline"
                                            onClick={() => {
                                              toast.info('Funcionalidad de comentarios próximamente');
                                            }}
                                          >
                                            💬 Comentar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
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

        {/* Resumen por años */}
        {actividades.length > 0 && (
          <div className="años-resumen">
            <h3>📊 Resumen por Años</h3>
            <div className="años-resumen-grid">
              {agrupacionPorAnio
                .filter(añoData => añoData.actividades.length > 0)
                .map(añoData => (
                  <div 
                    key={añoData.anio} 
                    className={`año-resumen-card ${añoData.anio === periodoActual.anio ? 'año-actual' : ''}`}
                    onClick={() => {
                      toggleAnioExpandido(añoData.anio);
                    }}
                  >
                    <div className="año-resumen-header">
                      <span className="año-resumen-year">{añoData.anio}</span>
                      {añoData.anio === periodoActual.anio && (
                        <span className="año-resumen-actual">ACTUAL</span>
                      )}
                    </div>
                    
                    <div className="año-resumen-stats">
                      <span className="año-resumen-count">{añoData.actividades.length}</span>
                      <span className="año-resumen-percent">
                        {actividades.length > 0 
                          ? `${((añoData.actividades.length / actividades.length) * 100).toFixed(1)}%`
                          : '0%'}
                      </span>
                    </div>
                    
                    <div className="año-resumen-periodos">
                      {Object.entries(añoData.periodos)
                        .filter(([_, periodoData]) => periodoData.actividades.length > 0)
                        .sort(([keyA, a], [keyB, b]) => a.orden - b.orden)
                        .map(([periodoKey, periodoData]) => (
                          <div 
                            key={periodoKey} 
                            className={`año-resumen-periodo ${añoData.anio === periodoActual.anio && periodoKey === periodoActual.periodo ? 'año-resumen-periodo-actual' : ''}`}
                          >
                            <span className="periodo-resumen-label">
                              <span>{periodoData.emoji}</span>
                              <span>{periodoData.label}</span>
                            </span>
                            <span className="periodo-resumen-count">{periodoData.actividades.length}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

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

        {/* Resumen por creador */}
        {actividades.length > 0 && (
          <div className="resumen-creadores">
            <h3>📊 Resumen por Creador</h3>
            <div className="creadores-grid">
              {Array.from(new Set(actividades.map(a => a.creado_por_nombre))).map(creador => {
                if (!creador || creador === 'Sistema') return null;
                
                const actividadesCreador = actividades.filter(a => a.creado_por_nombre === creador);
                const tipo = actividadesCreador[0]?.creado_por_tipo;
                
                return (
                  <div key={creador} className="creador-card">
                    <div className="creador-header">
                      <div className="creador-avatar">
                        {creador.charAt(0).toUpperCase()}
                      </div>
                      <div className="creador-info">
                        <h4>{creador}</h4>
                        <span className="creador-role">
                          {tipo === 'personal' ? '👤 Personal' : '👔 Directivo'}
                        </span>
                      </div>
                    </div>
                    <div className="creador-stats">
                      <div className="creador-stat">
                        <span className="stat-number">{actividadesCreador.length}</span>
                        <span className="stat-label">Actividades</span>
                      </div>
                      <div className="creador-stat">
                        <span className="stat-number">
                          {actividadesCreador.filter(a => a.estado === 'completada').length}
                        </span>
                        <span className="stat-label">Completadas</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectivoDashboard;