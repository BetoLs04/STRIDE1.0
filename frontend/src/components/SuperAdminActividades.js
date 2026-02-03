import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import '../styles/SuperAdminActividades.css';

const SuperAdminActividades = ({ admin }) => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtros, setFiltros] = useState({
    direccion: 'todas',
    creador_tipo: 'todos',
    estado: 'todos',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_actividad: ''
  });
  const [direcciones, setDirecciones] = useState([]);
  const [tiposActividad, setTiposActividad] = useState([]);

  // Estado para controlar expansión de años y períodos
  const [expansiones, setExpansiones] = useState({
    años: {},
    periodos: {}
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
          } else {
            console.log(`   ⚠️ No hay actividades en esta dirección`);
          }
        } catch (dirError) {
          console.error(`   ❌ Error en dirección ${direccion.id}:`, dirError.message);
        }
      }
      
      console.log(`📊 Total de actividades en todo el sistema: ${todasActividades.length}`);
      
      if (todasActividades.length === 0) {
        setError('No hay actividades en el sistema. Crea algunas actividades primero.');
        toast.info('No hay actividades registradas en el sistema');
      }
      
      setActividades(todasActividades);
      
      const tiposUnicos = [...new Set(todasActividades
        .map(a => a.tipo_actividad)
        .filter(tipo => tipo && tipo.trim() !== '')
      )];
      setTiposActividad(tiposUnicos);
      
    } catch (error) {
      console.error('❌ Error general cargando actividades:', error);
      setError('Error al cargar las actividades. Verifica la conexión con el servidor.');
      toast.error('Error al cargar actividades');
    } finally {
      setLoading(false);
    }
  };

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

  // ========== FUNCIÓN PARA ELIMINAR ACTIVIDAD ==========
  const eliminarActividad = async (actividadId, titulo, direccion) => {
    const confirmMessage = `¿Estás seguro de eliminar la actividad?\n\n"${titulo}"\n\nDe la dirección: ${direccion}\n\n⚠️ Esta acción eliminará TODAS las imágenes asociadas y NO se puede deshacer.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      const response = await axios({
        method: 'DELETE',
        url: `http://localhost:5000/api/university/actividades/${actividadId}`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success(`✅ Actividad eliminada: "${titulo}"`);
        setActividades(prev => prev.filter(a => a.id !== actividadId));
        
        const actividadEliminada = actividades.find(a => a.id === actividadId);
        if (actividadEliminada && actividadEliminada.tipo_actividad) {
          const tiposActualizados = [...new Set(actividades
            .filter(a => a.id !== actividadId)
            .map(a => a.tipo_actividad)
            .filter(tipo => tipo && tipo.trim() !== '')
          )];
          setTiposActividad(tiposActualizados);
        }
        
        if (response.data.imagenesEliminadas > 0) {
          toast.info(`Se eliminaron ${response.data.imagenesEliminadas} imágenes`);
        }
      } else {
        toast.error(response.data.error || 'Error al eliminar actividad');
      }
    } catch (error) {
      console.error('❌ Error eliminando actividad:', error);
      if (error.response) {
        if (error.response.status === 404) {
          toast.error('Actividad no encontrada');
        } else if (error.response.status === 403) {
          toast.error('No tienes permisos para eliminar esta actividad');
        } else {
          toast.error(error.response.data?.error || `Error ${error.response.status}`);
        }
      } else if (error.request) {
        toast.error('No se pudo conectar con el servidor');
      } else {
        toast.error('Error al configurar la solicitud');
      }
    }
  };

  // ========== FUNCIONES PARA MODAL ==========
  const abrirModalActividad = (actividad) => {
    setActividadSeleccionada(actividad);
    setModalAbierto(true);
    document.body.style.overflow = 'hidden';
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setActividadSeleccionada(null);
    document.body.style.overflow = 'auto';
  };

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

  const getInitial = () => {
    if (!admin || !admin.username) return '?';
    return admin.username.charAt(0).toUpperCase();
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
      fecha_fin: '',
      tipo_actividad: ''
    });
  };

  // Aplicar filtros
  const actividadesFiltradas = actividades.filter(actividad => {
    if (filtros.direccion !== 'todas' && actividad.direccion_id !== parseInt(filtros.direccion)) {
      return false;
    }
    
    if (filtros.creador_tipo !== 'todos' && actividad.creado_por_tipo !== filtros.creador_tipo) {
      return false;
    }
    
    if (filtros.estado !== 'todos' && actividad.estado !== filtros.estado) {
      return false;
    }
    
    if (filtros.tipo_actividad && actividad.tipo_actividad !== filtros.tipo_actividad) {
      return false;
    }
    
    if (filtros.fecha_inicio && new Date(actividad.fecha_inicio) < new Date(filtros.fecha_inicio)) {
      return false;
    }
    
    if (filtros.fecha_fin && new Date(actividad.fecha_inicio) > new Date(filtros.fecha_fin)) {
      return false;
    }
    
    return true;
  });

  // Obtener actividades agrupadas por año y período (con filtros aplicados)
  const agrupacionPorAnioFiltrada = agruparPorAnioYPeriodo(actividadesFiltradas);
  const periodoActual = obtenerPeriodoActual();

  // Componente simplificado para la tarjeta de actividad
  const TarjetaActividadMinimalista = ({ actividad, mostrarEliminar = false }) => {
    return (
      <div className="actividad-minimalista-card">
        <div className="actividad-minimalista-content">
          <div className="actividad-minimalista-info">
            <h3>{actividad.titulo}</h3>
            <div className="actividad-minimalista-metadata">
              <span className="actividad-minimalista-creador">
                👤 {actividad.creado_por_nombre || 'Sistema'}
                <span className="creador-tipo-badge">
                  {actividad.creado_por_tipo === 'personal' ? '👤 Personal' : '👔 Directivo'}
                </span>
              </span>
              <span className="actividad-minimalista-fecha">
                📅 {new Date(actividad.fecha_inicio).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
              <span className="actividad-minimalista-direccion">
                🏛️ {actividad.direccion_nombre || 'Sin dirección'}
              </span>
              {getEstadoBadge(actividad.estado)}
            </div>
          </div>
          
          <div className="actividad-minimalista-actions">
            <button 
              className="btn btn-primary btn-small"
              onClick={() => abrirModalActividad(actividad)}
            >
              Ver detalles
            </button>
            
          </div>
        </div>
      </div>
    );
  };

  // Crear datos de ejemplo si no hay actividades reales
  const crearDatosEjemplo = () => {
    const actividadesEjemplo = [
      {
        id: 1,
        titulo: 'Reunión de planificación trimestral',
        descripcion: 'Reunión para planificar las actividades del próximo trimestre',
        tipo_actividad: 'Reunión de trabajo',
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
        tipo_actividad: 'Taller de capacitación',
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
      },
      {
        id: 3,
        titulo: 'Seminario de innovación educativa',
        descripcion: 'Seminario sobre nuevas metodologías educativas',
        tipo_actividad: 'Seminario',
        fecha_inicio: '2024-02-10',
        fecha_fin: '2024-02-11',
        direccion_id: 3,
        direccion_nombre: 'Dirección de Investigación',
        creado_por_id: 3,
        creado_por_nombre: 'María García',
        creado_por_tipo: 'personal',
        estado: 'pendiente',
        fecha_creacion: '2024-01-25T09:15:00Z',
        imagenes: []
      }
    ];
    
    setActividades(actividadesEjemplo);
    const tiposUnicos = [...new Set(actividadesEjemplo
      .map(a => a.tipo_actividad)
      .filter(tipo => tipo && tipo.trim() !== '')
    )];
    setTiposActividad(tiposUnicos);
    
    toast.info('Datos de ejemplo cargados. Crea actividades reales para ver datos reales.');
  };

  if (!admin) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="spinner"></div>
        <p>Cargando información del administrador...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Cabecera con Panel de SuperAdmin */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Panel de Super Admin</h1>
        </div>
        
        <div className="header-right">
          <div className="user-info-large">
            <div className="user-details">
              <h3>{admin.username || 'Super Admin'}</h3>
              <p>
                <span className="user-cargo">Administrador del Sistema</span>
                <span className="user-separator"> • </span>
                <span className="user-direccion">Control total de actividades</span>
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
            <h2 className="banner-title">🌐 Actividades del Sistema Completo</h2>
            <p className="banner-subtitle">
              Visualización y gestión de todas las actividades de todas las direcciones
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

        {/* Estadísticas */}
        <div className="dashboard-stats">
          <div className="stat-card" onClick={() => {
            toast.info(`Total de ${actividades.length} actividades en todo el sistema`);
          }}>
            <span className="stat-number">{actividades.length}</span>
            <span className="stat-label">Total Actividades</span>
            <div className="stat-icon">📋</div>
          </div>
          
          <div className="stat-card" onClick={() => {
            const direccionesConActividades = new Set(actividades.map(a => a.direccion_id)).size;
            toast.info(`${direccionesConActividades} direcciones con actividades de ${direcciones.length} totales`);
          }}>
            <span className="stat-number">
              {new Set(actividades.map(a => a.direccion_id)).size}
            </span>
            <span className="stat-label">Direcciones Activas</span>
            <div className="stat-icon">🏛️</div>
          </div>
          
          <div className="stat-card" onClick={() => {
            const creadores = new Set(actividades.map(a => a.creado_por_nombre)).size;
            toast.info(`${creadores} usuarios han creado actividades`);
          }}>
            <span className="stat-number">
              {new Set(actividades.map(a => a.creado_por_nombre)).size}
            </span>
            <span className="stat-label">Usuarios Activos</span>
            <div className="stat-icon">👥</div>
          </div>
          
          <div className="stat-card" onClick={() => {
            toast.info(`${tiposActividad.length} tipos diferentes de actividad registrados`);
          }}>
            <span className="stat-number">
              {tiposActividad.length}
            </span>
            <span className="stat-label">Tipos de Actividad</span>
            <div className="stat-icon">📌</div>
          </div>
        </div>

        {/* Filtros para SuperAdmin */}
        <div className="filtros-superadmin">
          <h3>🔍 Filtros Avanzados</h3>
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
              <label>Tipo de Actividad:</label>
              <select name="tipo_actividad" value={filtros.tipo_actividad} onChange={handleFiltroChange}>
                <option value="">Todos los Tipos</option>
                {tiposActividad.map((tipo, index) => (
                  <option key={index} value={tipo}>
                    {tipo}
                  </option>
                ))}
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
              {filtros.tipo_actividad && ` • Tipo actividad: ${filtros.tipo_actividad}`}
            </span>
          </div>
        </div>

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
            <p>Cargando actividades de todo el sistema...</p>
          </div>
        ) : actividades.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📭</div>
            <h3>No hay actividades en el sistema</h3>
            <p>Para ver actividades aquí, primero necesitas crear direcciones y que los usuarios creen actividades.</p>
            <div className="no-data-actions">
              <button className="btn btn-primary" onClick={() => navigate('/admin/dashboard')}>
                Ir al Dashboard para crear datos
              </button>
              <button className="btn btn-secondary" onClick={crearDatosEjemplo}>
                Ver datos de ejemplo
              </button>
            </div>
          </div>
        ) : (
          <div className="periodos-container">

            {/* Mostrar años con actividades */}
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
                                <div className="actividades-lista-minimalista">
                                  {periodoData.actividades.map(actividad => (
                                    <TarjetaActividadMinimalista 
                                      key={actividad.id} 
                                      actividad={actividad} 
                                      mostrarEliminar={true}
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

        {/* Resumen por direcciones - VERSIÓN TABLA COMPACTA */}
        {actividades.length > 0 && direcciones.length > 0 && (
          <div className="resumen-creadores-mejorado compacto-direcciones">
            <div className="resumen-header compacto-direcciones">
              <h3>🏛️ Resumen por Dirección</h3>
              <p>Actividades agrupadas por cada dirección del sistema</p>
            </div>
            
            <table className="tabla-direcciones-compacta">
              <thead>
                <tr>
                  <th>Dirección</th>
                  <th>Actividades</th>
                  <th>Efectividad</th>
                  <th>Estados</th>
                  <th>Última Actividad</th>
                </tr>
              </thead>
              <tbody>
                {direcciones.map(direccion => {
                  const actividadesDir = actividades.filter(a => a.direccion_id === direccion.id);
                  const completadas = actividadesDir.filter(a => a.estado === 'completada').length;
                  const enProgreso = actividadesDir.filter(a => a.estado === 'en_progreso').length;
                  const pendientes = actividadesDir.filter(a => a.estado === 'pendiente').length;
                  const porcentajeCompletadas = actividadesDir.length > 0 ? 
                    Math.round((completadas / actividadesDir.length) * 100) : 0;
                  
                  // Obtener fecha de la última actividad
                  let ultimaActividad = null;
                  if (actividadesDir.length > 0) {
                    const actividadesOrdenadas = [...actividadesDir].sort((a, b) => 
                      new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
                    );
                    ultimaActividad = actividadesOrdenadas[0];
                  }
                  
                  return (
                    <tr key={direccion.id}>
                      <td className="col-direccion">
                        <span className="avatar-direccion">
                          {direccion.nombre.charAt(0).toUpperCase()}
                        </span>
                        {direccion.nombre}
                      </td>
                      
                      <td className="col-actividades">
                        <span className={`contador-actividades ${actividadesDir.length === 0 ? 'cero' : ''}`}>
                          <span>📋</span>
                          {actividadesDir.length}
                        </span>
                      </td>
                      
                      <td className="col-efectividad">
                        <div 
                          className="circulo-efectividad"
                          style={{
                            '--porcentaje-efectividad': porcentajeCompletadas,
                            '--color-efectividad': porcentajeCompletadas >= 70 ? '#10b981' : 
                                                  porcentajeCompletadas >= 40 ? '#f59e0b' : '#ef4444'
                          }}
                        >
                          <span className="porcentaje-efectividad">{porcentajeCompletadas}%</span>
                        </div>
                      </td>
                      
                      <td className="col-estados">
                        <div className="estados-mini">
                          <div className="estado-mini-item">
                            <span className="estado-mini-icon">✅</span>
                            <span className="estado-mini-count">{completadas}</span>
                            <span className="estado-mini-label">Compl.</span>
                          </div>
                          <div className="estado-mini-item">
                            <span className="estado-mini-icon">🚀</span>
                            <span className="estado-mini-count">{enProgreso}</span>
                            <span className="estado-mini-label">Prog.</span>
                          </div>
                          <div className="estado-mini-item">
                            <span className="estado-mini-icon">⏳</span>
                            <span className="estado-mini-count">{pendientes}</span>
                            <span className="estado-mini-label">Pend.</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="col-ultima">
                        <span className={`fecha-ultima ${!ultimaActividad ? 'vacia' : ''}`}>
                          {ultimaActividad ? 
                            new Date(ultimaActividad.fecha_creacion).toLocaleDateString('es-ES', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            }) : 
                            'Sin actividades'
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Resumen por tipos de actividad */}
        {tiposActividad.length > 0 && (
          <div className="resumen-creadores-mejorado">
            <div className="resumen-header">
              <h3>📌 Tipos de Actividad</h3>
              <p>Diferentes categorías de actividades en el sistema</p>
            </div>
            
            <div className="creadores-resumen-grid">
              {tiposActividad.map((tipo, index) => {
                const actividadesDeEsteTipo = actividades.filter(a => a.tipo_actividad === tipo);
                const completadas = actividadesDeEsteTipo.filter(a => a.estado === 'completada').length;
                const enProgreso = actividadesDeEsteTipo.filter(a => a.estado === 'en_progreso').length;
                const pendientes = actividadesDeEsteTipo.filter(a => a.estado === 'pendiente').length;
                const porcentajeCompletadas = actividadesDeEsteTipo.length > 0 ? 
                  Math.round((completadas / actividadesDeEsteTipo.length) * 100) : 0;
                
                return (
                  <div key={index} className="creador-resumen-card">
                    <div className="creador-resumen-header">
                      <div className="creador-avatar-grande">
                        {tipo.charAt(0).toUpperCase()}
                        
                      </div>
                      <div className="creador-info-detallada">
                        <h4>{tipo}</h4>
                        <span className="creador-actividades-count">
                          {actividadesDeEsteTipo.length} actividad(es)
                        </span>
                      </div>
                    </div>
                    
                    <div className="creador-estadisticas">
                      <div className="estadistica-item">
                        <div className="estadistica-circulo">
                          <span className="estadistica-porcentaje">
                            {new Set(actividadesDeEsteTipo.map(a => a.direccion_nombre)).size}
                          </span>
                        </div>
                        <span className="estadistica-label">Direcciones</span>
                      </div>
                      
                      <div className="estadisticas-detalles">
                        <div className="detalle-estado completada">
                          <span className="detalle-icon">✅</span>
                          <span className="detalle-count">
                            {completadas}
                          </span>
                          <span className="detalle-label">Completadas</span>
                        </div>
                        <div className="detalle-estado en-progreso">
                          <span className="detalle-icon">🚀</span>
                          <span className="detalle-count">
                            {enProgreso}
                          </span>
                          <span className="detalle-label">En Progreso</span>
                        </div>
                        <div className="detalle-estado pendiente">
                          <span className="detalle-icon">⏳</span>
                          <span className="detalle-count">
                            {pendientes}
                          </span>
                          <span className="detalle-label">Pendientes</span>
                        </div>
                      </div>
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
              
              {/* Tipo de actividad */}
              {actividadSeleccionada.tipo_actividad && (
                <div className="modal-tipo-actividad">
                  <span className="tipo-actividad-label">📌 Tipo de Actividad:</span>
                  <span className="tipo-actividad-valor">{actividadSeleccionada.tipo_actividad}</span>
                </div>
              )}
              
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
                      {formatDateTime(actividadSeleccionada.fecha_creacion)}
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
              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm(`¿Estás seguro de eliminar esta actividad?\n\n"${actividadSeleccionada.titulo}"\n\n⚠️ Esta acción NO se puede deshacer.`)) {
                    eliminarActividad(
                      actividadSeleccionada.id, 
                      actividadSeleccionada.titulo, 
                      actividadSeleccionada.direccion_nombre
                    );
                    cerrarModal();
                  }
                }}
              >
                🗑️ Eliminar Actividad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminActividades;