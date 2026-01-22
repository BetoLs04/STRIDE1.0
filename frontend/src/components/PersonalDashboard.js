import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const PersonalDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormActividad, setShowFormActividad] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    imagenes: []
  });

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

  const handleImageUpload = (files) => {
    const newFiles = Array.from(files);
    
    if (newFiles.length + formData.imagenes.length > 5) {
      toast.error('Solo puedes subir máximo 5 imágenes');
      return;
    }

    const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Alguna imagen excede el tamaño máximo de 5MB');
      return;
    }

    const invalidFiles = newFiles.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    const imagenesConPreview = newFiles.map(file => {
      return {
        file: file,
        preview: URL.createObjectURL(file),
        nombre: file.name,
        tamano: file.size,
        tipo: file.type
      };
    });

    setFormData({
      ...formData,
      imagenes: [...formData.imagenes, ...imagenesConPreview]
    });

    toast.success(`${newFiles.length} imagen(es) cargada(s) correctamente`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(formData.imagenes[index].preview);
    
    const nuevasImagenes = formData.imagenes.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      imagenes: nuevasImagenes
    });
    toast.info('Imagen eliminada');
  };

  const handleSubmitActividad = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    
    if (!formData.fecha_inicio) {
      toast.error('La fecha de inicio es requerida');
      return;
    }
    
    if (formData.fecha_fin && new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
      toast.error('La fecha de fin no puede ser anterior a la fecha de inicio');
      return;
    }
    
    const wordCount = formData.descripcion.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 200) {
      toast.error('La descripción no puede exceder las 200 palabras');
      return;
    }
    
    setUploadingImages(true);
    
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('fecha_inicio', formData.fecha_inicio);
      formDataToSend.append('fecha_fin', formData.fecha_fin || '');
      formDataToSend.append('direccion_id', user.direccion_id);
      formDataToSend.append('creado_por_id', user.id);
      formDataToSend.append('creado_por_tipo', 'personal');
      
      formData.imagenes.forEach((imagenObj, index) => {
        formDataToSend.append(`imagenes`, imagenObj.file);
      });
      
      console.log('Enviando actividad con', formData.imagenes.length, 'imágenes');
      
      const response = await axios.post('http://localhost:5000/api/university/actividades', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Actividad creada exitosamente con ' + formData.imagenes.length + ' imagen(es)!');
      
      setFormData({ 
        titulo: '', 
        descripcion: '', 
        fecha_inicio: '',
        fecha_fin: '',
        imagenes: [] 
      });
      setShowFormActividad(false);
      fetchActividades();
      
    } catch (error) {
      console.error('Error al crear actividad:', error);
      toast.error(error.response?.data?.error || 'Error al crear actividad');
    } finally {
      setUploadingImages(false);
    }
  };

  useEffect(() => {
    return () => {
      formData.imagenes.forEach(imagen => {
        if (imagen.preview) {
          URL.revokeObjectURL(imagen.preview);
        }
      });
    };
  }, [formData.imagenes]);

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

  const eliminarActividad = async (actividadId, titulo) => {
    if (!window.confirm(`¿Estás seguro de eliminar la actividad "${titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      const response = await axios.delete(`http://localhost:5000/api/university/actividades/${actividadId}`);
      
      if (response.data.success) {
        toast.success('Actividad eliminada exitosamente');
        
        setActividades(prev => prev.filter(a => a.id !== actividadId));
        
        if (response.data.imagenesEliminadas > 0) {
          toast.info(`Se eliminaron ${response.data.imagenesEliminadas} imágenes`);
        }
      }
      
    } catch (error) {
      console.error('Error eliminando actividad:', error);
      
      let errorMessage = 'Error al eliminar actividad';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
    }
  };

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
            <p>Crea tu primera actividad para comenzar.</p>
            <button className="btn btn-primary" onClick={() => setShowFormActividad(true)}>
              + Crear Primera Actividad
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
                                          
                                          {actividad.creado_por_id === user.id && (
                                            <button
                                              className="btn btn-danger btn-small"
                                              onClick={() => eliminarActividad(actividad.id, actividad.titulo)}
                                              title="Eliminar esta actividad"
                                            >
                                              🗑️ Eliminar
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="actividad-body">
                                        <p className="actividad-descripcion">{actividad.descripcion || 'Sin descripción'}</p>
                                        
                                        {actividad.imagenes && actividad.imagenes.length > 0 && (
                                          <div className="actividad-imagenes-carousel">
                                            <div className="carousel-header">
                                              <span className="carousel-title">Galería de imágenes ({actividad.imagenes.length})</span>
                                            </div>
                                            <Slider {...carouselSettings} className="imagenes-carousel">
                                              {actividad.imagenes.map((img, index) => (
                                                <div key={index} className="carousel-slide">
                                                  <div className="slide-content">
                                                    <img 
                                                      src={img.url || '/placeholder.jpg'} 
                                                      alt={`Imagen ${index + 1} - ${actividad.titulo}`}
                                                      className="carousel-image"
                                                    />
                                                    <div className="image-caption">
                                                      <span>Imagen {index + 1} de {actividad.imagenes.length}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </Slider>
                                            <div className="carousel-thumbnails">
                                              {actividad.imagenes.slice(0, 5).map((img, index) => (
                                                <div key={index} className="thumbnail-item">
                                                  <img 
                                                    src={img.url || '/placeholder.jpg'} 
                                                    alt={`Miniatura ${index + 1}`}
                                                    className="thumbnail-image"
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        <div className="actividad-meta">
                                          <div className="meta-row">
                                            <div className="meta-item">
                                              <span className="meta-label">📅 Inicio:</span>
                                              <span className="meta-value">{formatDate(actividad.fecha_inicio)}</span>
                                            </div>
                                            
                                            <div className="meta-item">
                                              <span className="meta-label">📅 Fin:</span>
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
                                              <span className="meta-label">👤 Creado por:</span>
                                              <span className="meta-value">{actividad.creado_por_nombre || 'Sistema'}</span>
                                            </div>
                                            
                                            <div className="meta-item">
                                              <span className="meta-label">📅 Publicado el:</span>
                                              <span className="meta-value">{formatDate(actividad.fecha_creacion)}</span>
                                            </div>
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
          
          <div className="stat-card">
            <span className="stat-number">
              {actividades.filter(a => a.creado_por_id === user.id && a.estado === 'pendiente').length}
            </span>
            <span className="stat-label">Mis Pendientes</span>
          </div>
        </div>
      </div>

      {/* Modal para nueva actividad */}
      {showFormActividad && (
        <div className="form-modal">
          <div className="form-modal-content large-modal">
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
                  placeholder="Ej: Jornada de capacitación técnica"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Descripción (Máximo 200 palabras)</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe los detalles de la actividad, objetivos, participantes, etc..."
                  rows="4"
                  maxLength="2000"
                />
                <div className="word-counter">
                  <small>
                    {formData.descripcion.split(/\s+/).filter(word => word.length > 0).length} / 200 palabras
                    {formData.descripcion.split(/\s+/).filter(word => word.length > 0).length > 200 && 
                      <span style={{ color: '#dc3545', marginLeft: '10px' }}>⚠️ Límite excedido</span>
                    }
                  </small>
                </div>
              </div>
              
              <div className="form-grid dates-grid">
                <div className="form-group">
                  <label>Fecha de Inicio *</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <small className="form-hint">Primer día del evento/actividad</small>
                </div>
                
                <div className="form-group">
                  <label>Fecha de Fin (Opcional)</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                    min={formData.fecha_inicio || new Date().toISOString().split('T')[0]}
                  />
                  <small className="form-hint">Último día del evento/actividad</small>
                </div>
              </div>
              
              {/* Indicador del año y período seleccionado */}
              <div className="form-group">
                <label>Año y Período de la Actividad</label>
                <div className="periodo-preview">
                  {formData.fecha_inicio ? (
                    <>
                      <span className="periodo-preview-icon">
                        {obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'enero-abril' ? '❄️' : 
                         obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'mayo-agosto' ? '🌸' : 
                         obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'septiembre-diciembre' ? '🍂' : '📅'}
                      </span>
                      <span className="periodo-preview-text">
                        Esta actividad pertenecerá a: 
                        <strong> Año {obtenerAnioYPeriodo(formData.fecha_inicio).anio} • {
                          obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'enero-abril' ? 'Enero - Abril' : 
                          obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'mayo-agosto' ? 'Mayo - Agosto' : 
                          obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'septiembre-diciembre' ? 'Septiembre - Diciembre' : 'Sin período'
                        }</strong>
                      </span>
                    </>
                  ) : (
                    <span className="periodo-preview-empty">
                      📅 Selecciona una fecha de inicio para ver el año y período
                    </span>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Imágenes (Máximo 5)</label>
                <div className="image-upload-container">
                  <div className="image-upload-area">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploadingImages || formData.imagenes.length >= 5}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="image-upload" 
                      className={`image-upload-label ${isDragOver ? 'drag-over' : ''} ${uploadingImages ? 'uploading' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="upload-icon">📷</div>
                      <div className="upload-text">
                        {isDragOver ? 'Suelta las imágenes aquí' : 'Subir imágenes del evento'}
                      </div>
                      <div className="upload-hint">
                        {isDragOver ? 'Suelta para cargar' : 'Haz clic o arrastra imágenes aquí'}
                      </div>
                      <div className="upload-limit">
                        Máximo 5 imágenes • 5MB cada una • Formatos: JPG, PNG, GIF
                      </div>
                    </label>
                    
                    {formData.imagenes.length > 0 && (
                      <div className="image-previews">
                        <h4>Imágenes cargadas ({formData.imagenes.length}/5):</h4>
                        <div className="preview-grid">
                          {formData.imagenes.map((img, index) => (
                            <div key={index} className="preview-item">
                              <img 
                                src={img.preview} 
                                alt={`Vista previa ${index + 1}`}
                                className="preview-image"
                              />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => removeImage(index)}
                                title="Eliminar imagen"
                              >
                                ×
                              </button>
                              <div className="image-info">
                                <small>{img.nombre}</small>
                                <small>{(img.tamano / 1024).toFixed(1)} KB</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="form-info">
                <p><strong>Nota:</strong> Esta actividad será visible para los directivos de {user.direccion_nombre || 'tu dirección'}</p>
                <p><small>Las imágenes se mostrarán en un carrusel en el panel de actividades.</small></p>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formData.descripcion.split(/\s+/).filter(word => word.length > 0).length > 200 || uploadingImages || !formData.fecha_inicio}
                >
                  {uploadingImages ? 'Subiendo...' : `Crear Actividad con ${formData.imagenes.length} imagen(es)`}
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