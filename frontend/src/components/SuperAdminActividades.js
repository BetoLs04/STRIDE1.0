import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const SuperAdminActividades = ({ admin }) => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    direccion: 'todas',
    creador_tipo: 'todos',
    estado: 'todos',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [direcciones, setDirecciones] = useState([]);
  
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
    autoplay: false,
    pauseOnHover: true
  };

  useEffect(() => {
    if (!admin) {
      navigate('/login');
      return;
    }
    
    if (admin.tipo !== 'superadmin') {
      toast.error('Acceso no autorizado');
      navigate('/login');
      return;
    }
    
    fetchDirecciones();
    fetchTodasActividades();
  }, [admin, navigate]);

  const fetchDirecciones = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/university/direcciones');
      setDirecciones(response.data.data || []);
    } catch (error) {
      console.error('Error cargando direcciones:', error);
    }
  };

  const fetchTodasActividades = async () => {
    try {
      console.log('🔄 Cargando TODAS las actividades del sistema...');
      setLoading(true);
      setError(null);
      
      let todasActividades = [];
      let direccionesConActividades = [];
      
      const direccionesRes = await axios.get('http://localhost:5000/api/university/direcciones');
      const direccionesList = direccionesRes.data.data || [];
      
      if (direccionesList.length === 0) {
        console.log('⚠️ No hay direcciones en el sistema');
        setActividades([]);
        setLoading(false);
        return;
      }
      
      console.log(`🏛️ Direcciones encontradas: ${direccionesList.length}`);
      
      for (const direccion of direccionesList) {
        try {
          console.log(`   📂 Obteniendo actividades de: ${direccion.nombre} (ID: ${direccion.id})`);
          const response = await axios.get(`http://localhost:5000/api/university/actividades/direccion/${direccion.id}`);
          
          if (response.data.data && response.data.data.length > 0) {
            console.log(`   ✅ ${response.data.data.length} actividades encontradas`);
            
            const actividadesConDireccion = response.data.data.map(actividad => ({
              ...actividad,
              direccion_nombre: direccion.nombre,
              direccion_id: direccion.id,
              imagenes: actividad.imagenes ? actividad.imagenes.map(img => ({
                ...img,
                url: img.url || `http://localhost:5000/uploads/actividades/${img.ruta_archivo}`
              })) : []
            }));
            
            todasActividades = [...todasActividades, ...actividadesConDireccion];
            direccionesConActividades.push({
              ...direccion,
              count: response.data.data.length
            });
          } else {
            console.log(`   ⚠️ No hay actividades en esta dirección`);
          }
        } catch (dirError) {
          console.error(`   ❌ Error en dirección ${direccion.id}:`, dirError.message);
        }
      }
      
      console.log(`📊 Total de actividades en todo el sistema: ${todasActividades.length}`);
      console.log(`📍 Direcciones con actividades: ${direccionesConActividades.length}`);
      
      if (todasActividades.length === 0) {
        setError('No hay actividades en el sistema. Crea algunas actividades primero.');
        toast.info('No hay actividades registradas en el sistema');
      }
      
      setActividades(todasActividades);
      
    } catch (error) {
      console.error('❌ Error general cargando actividades:', error);
      setError('Error al cargar las actividades. Verifica la conexión con el servidor.');
      toast.error('Error al cargar actividades');
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
    
    agrupacionPorAnioFiltrada.forEach(añoData => {
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

  // ========== FUNCIÓN PARA ELIMINAR ACTIVIDAD ==========
  const eliminarActividad = async (actividadId, titulo, direccion) => {
    const confirmMessage = `¿Estás seguro de eliminar la actividad?\n\n"${titulo}"\n\nDe la dirección: ${direccion}\n\n⚠️ Esta acción eliminará TODAS las imágenes asociadas y NO se puede deshacer.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      console.log(`🗑️ Intentando eliminar actividad ${actividadId}...`);
      
      const response = await axios({
        method: 'DELETE',
        url: `http://localhost:5000/api/university/actividades/${actividadId}`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`✅ Respuesta del servidor:`, response.data);
      
      if (response.data.success) {
        toast.success(`✅ Actividad eliminada: "${titulo}"`);
        
        // Actualizar lista localmente
        setActividades(prev => prev.filter(a => a.id !== actividadId));
        
        // Mostrar info de imágenes eliminadas
        if (response.data.imagenesEliminadas > 0) {
          toast.info(`Se eliminaron ${response.data.imagenesEliminadas} imágenes`);
        }
      } else {
        toast.error(response.data.error || 'Error al eliminar actividad');
      }
    } catch (error) {
      console.error('❌ Error eliminando actividad:', error);
      
      if (error.response) {
        console.error('📊 Status:', error.response.status);
        console.error('📊 Data:', error.response.data);
        
        if (error.response.status === 404) {
          toast.error('Actividad no encontrada');
        } else if (error.response.status === 403) {
          toast.error('No tienes permisos para eliminar esta actividad');
        } else {
          toast.error(error.response.data?.error || `Error ${error.response.status}`);
        }
      } else if (error.request) {
        console.error('❌ No se recibió respuesta:', error.request);
        toast.error('No se pudo conectar con el servidor');
      } else {
        console.error('❌ Error configurando la petición:', error.message);
        toast.error('Error al configurar la solicitud');
      }
    }
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { label: 'Pendiente', class: 'estado-pendiente', color: '#ffc107' },
      en_progreso: { label: 'En Progreso', class: 'estado-progreso', color: '#17a2b8' },
      completada: { label: 'Completada', class: 'estado-completada', color: '#28a745' }
    };
    
    const estadoInfo = estados[estado] || estados.pendiente;
    return (
      <span className={`badge ${estadoInfo.class}`} style={{ backgroundColor: estadoInfo.color }}>
        {estadoInfo.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const resetFiltros = () => {
    setFiltros({
      direccion: 'todas',
      creador_tipo: 'todos',
      estado: 'todos',
      fecha_inicio: '',
      fecha_fin: ''
    });
  };

  // Aplicar filtros
  const actividadesFiltradas = actividades.filter(actividad => {
    // Filtrar por dirección
    if (filtros.direccion !== 'todas' && actividad.direccion_id !== parseInt(filtros.direccion)) {
      return false;
    }
    
    // Filtrar por tipo de creador
    if (filtros.creador_tipo !== 'todos' && actividad.creado_por_tipo !== filtros.creador_tipo) {
      return false;
    }
    
    // Filtrar por estado
    if (filtros.estado !== 'todos' && actividad.estado !== filtros.estado) {
      return false;
    }
    
    // Filtrar por fecha de inicio
    if (filtros.fecha_inicio && new Date(actividad.fecha_inicio) < new Date(filtros.fecha_inicio)) {
      return false;
    }
    
    // Filtrar por fecha de fin
    if (filtros.fecha_fin && new Date(actividad.fecha_inicio) > new Date(filtros.fecha_fin)) {
      return false;
    }
    
    return true;
  });

  // Obtener actividades agrupadas por año y período (con filtros aplicados)
  const agrupacionPorAnioFiltrada = agruparPorAnioYPeriodo(actividadesFiltradas);
  const periodoActual = obtenerPeriodoActual();

  // Crear datos de ejemplo si no hay actividades reales
  const crearDatosEjemplo = () => {
    const actividadesEjemplo = [
      {
        id: 1,
        titulo: 'Reunión de planificación trimestral',
        descripcion: 'Reunión para planificar las actividades del próximo trimestre',
        fecha_inicio: '2024-01-15',
        fecha_fin: '2024-01-15',
        direccion_id: 1,
        direccion_nombre: 'Rectoría',
        creado_por_id: 1,
        creado_por_nombre: 'Ana Pérez',
        creado_por_tipo: 'personal',
        estado: 'completada',
        fecha_creacion: '2024-01-10T10:30:00Z',
        imagenes: []
      },
      {
        id: 2,
        titulo: 'Capacitación en nuevas tecnologías',
        descripcion: 'Curso de capacitación sobre las nuevas herramientas tecnológicas',
        fecha_inicio: '2024-01-20',
        fecha_fin: '2024-01-22',
        direccion_id: 2,
        direccion_nombre: 'Dirección Académica',
        creado_por_id: 2,
        creado_por_nombre: 'Carlos López',
        creado_por_tipo: 'directivo',
        estado: 'en_progreso',
        fecha_creacion: '2024-01-12T14:20:00Z',
        imagenes: []
      }
    ];
    
    setActividades(actividadesEjemplo);
    toast.info('Datos de ejemplo cargados. Crea actividades reales para ver datos reales.');
  };

  if (!admin) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando información del administrador...</p>
      </div>
    );
  }

  return (
    <div className="superadmin-actividades">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📋 Panel de Super Admin - Todas las Actividades</h1>
          <div className="user-info">
            <div className="user-avatar-large">
              {(admin.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <h3>{admin.username || 'Super Admin'}</h3>
              <p>Administrador del Sistema • Visualización total de actividades</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => navigate('/admin/dashboard')}>
            ← Volver al Dashboard
          </button>
          <button className="btn btn-accent" onClick={fetchTodasActividades} disabled={loading}>
            {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
          </button>
          {actividades.length === 0 && !loading && (
            <button className="btn btn-secondary" onClick={crearDatosEjemplo}>
              Ver Ejemplo
            </button>
          )}
        </div>
      </div>

      {/* Mensaje si no hay actividades */}
      {actividades.length === 0 && !loading && (
        <div className="no-actividades-message">
          <div className="message-content">
            <div className="message-icon">📭</div>
            <h3>No hay actividades en el sistema</h3>
            <p>
              Para ver actividades aquí, primero necesitas:
            </p>
            <ol className="instructions-list">
              <li>Crear direcciones desde el panel de Super Admin</li>
              <li>Crear personal o directivos para esas direcciones</li>
              <li>Que los usuarios creen actividades desde sus dashboards</li>
              <li>Las actividades aparecerán automáticamente aquí</li>
            </ol>
            <div className="message-actions">
              <button className="btn btn-primary" onClick={() => navigate('/admin/dashboard')}>
                Ir al Dashboard para crear datos
              </button>
              <button className="btn btn-secondary" onClick={crearDatosEjemplo}>
                Ver datos de ejemplo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solo mostrar el contenido si hay actividades */}
      {actividades.length > 0 && (
        <>
          {/* Estadísticas generales */}
          <div className="stats-summary-container">
            <h3>📊 Estadísticas del Sistema</h3>
            <div className="stats-grid-large">
              <div className="stat-card-large">
                <div className="stat-number-large">{actividades.length}</div>
                <div className="stat-label-large">Total Actividades</div>
                <div className="stat-detail">En todo el sistema</div>
              </div>
              
              <div className="stat-card-large">
                <div className="stat-number-large">
                  {new Set(actividades.map(a => a.direccion_id)).size}
                </div>
                <div className="stat-label-large">Direcciones con Actividades</div>
                <div className="stat-detail">De {direcciones.length} direcciones totales</div>
              </div>
              
              <div className="stat-card-large">
                <div className="stat-number-large">
                  {new Set(actividades.map(a => a.creado_por_nombre)).size}
                </div>
                <div className="stat-label-large">Usuarios Activos</div>
                <div className="stat-detail">Han creado actividades</div>
              </div>
              
              <div className="stat-card-large">
                <div className="stat-number-large">
                  {actividades.reduce((total, act) => total + (act.imagenes?.length || 0), 0)}
                </div>
                <div className="stat-label-large">Total Imágenes</div>
                <div className="stat-detail">Subidas al sistema</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="filtros-container">
            <h3>🔍 Filtros de Búsqueda</h3>
            <div className="filtros-grid">
              <div className="filtro-group">
                <label>Dirección:</label>
                <select name="direccion" value={filtros.direccion} onChange={handleFiltroChange}>
                  <option value="todas">Todas las Direcciones</option>
                  {direcciones.map(dir => (
                    <option key={dir.id} value={dir.id}>
                      {dir.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filtro-group">
                <label>Tipo de Creador:</label>
                <select name="creador_tipo" value={filtros.creador_tipo} onChange={handleFiltroChange}>
                  <option value="todos">Todos los Tipos</option>
                  <option value="personal">Personal</option>
                  <option value="directivo">Directivo</option>
                </select>
              </div>
              
              <div className="filtro-group">
                <label>Estado:</label>
                <select name="estado" value={filtros.estado} onChange={handleFiltroChange}>
                  <option value="todos">Todos los Estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
              
              <div className="filtro-group">
                <label>Fecha Desde:</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={filtros.fecha_inicio}
                  onChange={handleFiltroChange}
                />
              </div>
              
              <div className="filtro-group">
                <label>Fecha Hasta:</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={filtros.fecha_fin}
                  onChange={handleFiltroChange}
                />
              </div>
              
              <div className="filtro-actions">
                <button className="btn btn-secondary" onClick={resetFiltros}>
                  Limpiar Filtros
                </button>
              </div>
            </div>
            
            <div className="filtro-results">
              <span>
                Mostrando <strong>{actividadesFiltradas.length}</strong> de <strong>{actividades.length}</strong> actividades
                {filtros.direccion !== 'todas' && ` • Dirección: ${direcciones.find(d => d.id == filtros.direccion)?.nombre || 'Seleccionada'}`}
                {filtros.creador_tipo !== 'todos' && ` • Tipo: ${filtros.creador_tipo}`}
                {filtros.estado !== 'todos' && ` • Estado: ${filtros.estado}`}
              </span>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="dashboard-content">
            {error ? (
              <div className="error-message-box">
                <p>{error}</p>
                <button className="btn btn-primary" onClick={fetchTodasActividades}>
                  Reintentar
                </button>
              </div>
            ) : loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando todas las actividades del sistema...</p>
              </div>
            ) : actividadesFiltradas.length === 0 ? (
              <div className="no-data">
                <div className="no-data-icon">🔍</div>
                <h3>No hay actividades con los filtros seleccionados</h3>
                <p>Intenta cambiar los filtros o espera a que se creen actividades.</p>
                <button className="btn btn-primary" onClick={resetFiltros}>
                  Limpiar Filtros
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

                {/* Mostrar años con actividades (filtradas) */}
                {agrupacionPorAnioFiltrada
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
                                    <div className="actividades-list">
                                      {periodoData.actividades.map(actividad => (
                                        <div key={actividad.id} className="actividad-card-admin">
                                          <div className="actividad-header-admin">
                                            <div className="actividad-title-admin">
                                              <h3>
                                                {actividad.titulo}
                                                <span className="actividad-id">ID: {actividad.id}</span>
                                              </h3>
                                              <div className="actividad-meta-tags">
                                                {getEstadoBadge(actividad.estado)}
                                                <span className="tipo-tag">
                                                  {actividad.creado_por_tipo === 'personal' ? '👤 Personal' : '👔 Directivo'}
                                                </span>
                                                <span className="direccion-tag">
                                                  🏛️ {actividad.direccion_nombre}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="actividad-actions-admin">
                                              <span className="fecha-creacion">
                                                📅 {formatDateTime(actividad.fecha_creacion)}
                                              </span>
                                              
                                              {/* BOTÓN PARA ELIMINAR ACTIVIDAD */}
                                              <button
                                                className="btn btn-danger btn-small"
                                                onClick={() => eliminarActividad(
                                                  actividad.id, 
                                                  actividad.titulo, 
                                                  actividad.direccion_nombre
                                                )}
                                                title="Eliminar esta actividad"
                                                style={{ marginLeft: '10px' }}
                                              >
                                                🗑️ Eliminar
                                              </button>
                                            </div>
                                          </div>
                                          
                                          <div className="actividad-body-admin">
                                            <p className="actividad-descripcion">{actividad.descripcion || 'Sin descripción'}</p>
                                            
                                            {/* Carrusel de imágenes si existen */}
                                            {actividad.imagenes && actividad.imagenes.length > 0 && (
                                              <div className="actividad-imagenes-carousel">
                                                <div className="carousel-header">
                                                  <span className="carousel-title">
                                                    🖼️ {actividad.imagenes.length} Imagen(es)
                                                  </span>
                                                </div>
                                                <Slider {...carouselSettings} className="imagenes-carousel">
                                                  {actividad.imagenes.map((img, index) => (
                                                    <div key={index} className="carousel-slide">
                                                      <div className="slide-content">
                                                        <img 
                                                          src={img.url} 
                                                          alt={`Imagen ${index + 1}`}
                                                          className="carousel-image"
                                                          onError={(e) => {
                                                            e.target.src = '/placeholder.jpg';
                                                            e.target.alt = 'Imagen no disponible';
                                                          }}
                                                        />
                                                        <div className="image-caption">
                                                          <span>Imagen {index + 1} de {actividad.imagenes.length}</span>
                                                          <small>{img.nombre_archivo}</small>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </Slider>
                                              </div>
                                            )}
                                            
                                            <div className="actividad-info-grid">
                                              <div className="info-item">
                                                <span className="info-label">👤 Creador:</span>
                                                <span className="info-value">{actividad.creado_por_nombre || 'Sistema'}</span>
                                              </div>
                                              
                                              <div className="info-item">
                                                <span className="info-label">📅 Inicio:</span>
                                                <span className="info-value highlight">{formatDate(actividad.fecha_inicio)}</span>
                                              </div>
                                              
                                              <div className="info-item">
                                                <span className="info-label">📅 Fin:</span>
                                                <span className="info-value">{formatDate(actividad.fecha_fin)}</span>
                                              </div>
                                              
                                              <div className="info-item">
                                                <span className="info-label">📊 Estado:</span>
                                                <span className="info-value">{actividad.estado}</span>
                                              </div>
                                              
                                              <div className="info-item">
                                                <span className="info-label">🖼️ Imágenes:</span>
                                                <span className="info-value">{actividad.imagenes ? actividad.imagenes.length : 0}</span>
                                              </div>
                                              
                                              <div className="info-item">
                                                <span className="info-label">📍 Dirección:</span>
                                                <span className="info-value">{actividad.direccion_nombre}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="actividad-footer-admin">
                                            <div className="footer-info">
                                              <span className="fecha-info">
                                                Creada: {formatDateTime(actividad.fecha_creacion)}
                                              </span>
                                              <span className="eliminar-info" style={{ color: '#dc3545', fontSize: '0.85rem', marginLeft: '20px' }}>
                                                ⚠️ Solo Super Admin puede eliminar
                                              </span>
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
          </div>

          {/* Resumen por años (con filtros aplicados) */}
          {actividadesFiltradas.length > 0 && (
            <div className="años-resumen">
              <h3>📊 Resumen por Años (Filtrados)</h3>
              <div className="años-resumen-grid">
                {agrupacionPorAnioFiltrada
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
                          {actividadesFiltradas.length > 0 
                            ? `${((añoData.actividades.length / actividadesFiltradas.length) * 100).toFixed(1)}%`
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

          {/* Resumen por direcciones */}
          {actividades.length > 0 && direcciones.length > 0 && (
            <div className="resumen-direcciones">
              <h3>🏛️ Actividades por Dirección</h3>
              <div className="direcciones-grid">
                {direcciones.map(direccion => {
                  const actividadesDir = actividades.filter(a => a.direccion_id === direccion.id);
                  
                  return (
                    <div key={direccion.id} className="direccion-card">
                      <div className="direccion-header">
                        <h4>{direccion.nombre}</h4>
                        <span className={`actividad-count ${actividadesDir.length === 0 ? 'empty' : ''}`}>
                          {actividadesDir.length} actividades
                        </span>
                      </div>
                      {actividadesDir.length > 0 ? (
                        <>
                          <div className="direccion-stats">
                            <div className="direccion-stat">
                              <span className="stat-label">Pendientes:</span>
                              <span className="stat-number">{actividadesDir.filter(a => a.estado === 'pendiente').length}</span>
                            </div>
                            <div className="direccion-stat">
                              <span className="stat-label">En Progreso:</span>
                              <span className="stat-number">{actividadesDir.filter(a => a.estado === 'en_progreso').length}</span>
                            </div>
                            <div className="direccion-stat">
                              <span className="stat-label">Completadas:</span>
                              <span className="stat-number">{actividadesDir.filter(a => a.estado === 'completada').length}</span>
                            </div>
                          </div>
                          <div className="direccion-images">
                            <span className="images-count">
                              🖼️ {actividadesDir.reduce((total, act) => total + (act.imagenes?.length || 0), 0)} imágenes
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="direccion-empty">
                          <p>No hay actividades en esta dirección</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminActividades;