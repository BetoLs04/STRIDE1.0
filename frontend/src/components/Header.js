import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState(null);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Cargar logo al montar
  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = () => {
    // URL base del logo
    const baseUrl = 'http://localhost:5000/uploads/logos/institution-logo';
    
    // Probar extensiones comunes
    const extensions = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
    
    // Crear un array de promesas para probar cada extensión
    const imagePromises = extensions.map(ext => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Logo encontrado: ${baseUrl}${ext}`);
          resolve({ found: true, url: baseUrl + ext });
        };
        img.onerror = () => {
          resolve({ found: false, url: baseUrl + ext });
        };
        img.src = baseUrl + ext;
      });
    });

    // Esperar a que se resuelvan todas las promesas
    Promise.all(imagePromises).then(results => {
      const foundLogo = results.find(result => result.found);
      if (foundLogo) {
        setLogoUrl(foundLogo.url);
        console.log('Logo cargado:', foundLogo.url);
      } else {
        console.log('ℹ️ No hay logo configurado. Mostrando opción para agregar.');
        setLogoUrl(null);
      }
    });
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    setUploadingLogo(true);
    
    try {
      console.log('📤 Subiendo logo...', logoFile.name);
      
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('uploaded_by', user?.username || 'system');
      formData.append('user_type', user?.tipo || 'system');

      const response = await axios.post('http://localhost:5000/api/university/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Logo subido:', response.data);

      if (response.data.success) {
        toast.success('Logo actualizado correctamente');
        setShowLogoUpload(false);
        setLogoFile(null);
        
        // Forzar recarga de la página para mostrar el nuevo logo
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error subiendo logo:', error);
      toast.error('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar el logo actual?')) {
      return;
    }

    try {
      const response = await axios.delete('http://localhost:5000/api/university/delete-logo');
      
      if (response.data.success) {
        toast.success('Logo eliminado correctamente');
        setLogoUrl(null);
        // Recargar para quitar el logo
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error eliminando logo:', error);
      toast.error('Error al eliminar el logo');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El logo debe ser menor a 2MB');
      return;
    }

    // Leer dimensiones de la imagen
    const img = new Image();
    img.onload = function() {
      const width = this.width;
      const height = this.height;
      
      // Recomendar logos horizontales
      if (height > width) {
        toast.warning('Recomendación: Los logos horizontales se ven mejor');
      }
      
      // Guardar dimensiones en el objeto file
      file.width = width;
      file.height = height;
      setLogoFile(file);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('stride_user');
    if (onLogout) onLogout();
    toast.info('Sesión cerrada correctamente');
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch(user.tipo) {
      case 'superadmin': return '/admin/dashboard';
      case 'directivo': return '/directivo/dashboard';
      case 'personal': return '/personal/dashboard';
      default: return '/';
    }
  };

  const getUserRole = () => {
    if (!user) return '';
    switch(user.tipo) {
      case 'superadmin': return 'Super Administrador';
      case 'directivo': return `Directivo - ${user.cargo || ''}`;
      case 'personal': return `Personal - ${user.puesto || ''}`;
      default: return 'Usuario';
    }
  };

  return (
  <header className="university-header">
    <div className="header-content">
      <div className="logo-container">
        {/* STRIDE a la izquierda */}
        <div className="stride-logo-section">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <h1>STRIDE</h1>
            <p className="subtitle">Sistema de Gestión de actividades universitarias</p>
          </div>
        </div>

        {/* Logo de la institución */}
        <div className="institution-logo-section">
          {logoUrl ? (
            <div className="logo-with-controls">
              <div className="institution-logo-container">
                <img 
                  src={logoUrl} 
                  alt="Logo de la Institución" 
                  className="institution-logo"
                />
              </div>
              
              {/* Botón al lado derecho del logo */}
              {user?.tipo === 'superadmin' && (
                <button 
                  className="btn-logo-action"
                  onClick={() => setShowLogoUpload(true)}
                  title="Cambiar logo"
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : (
            /* Si no hay logo */
            user?.tipo === 'superadmin' && (
              <div className="no-logo-section">
                <div className="no-logo-message">
                  <span className="no-logo-icon">🏫</span>
                  <span className="no-logo-text">Sin logo</span>
                </div>
                <button 
                  className="btn-add-logo"
                  onClick={() => setShowLogoUpload(true)}
                  title="Agregar logo"
                >
                  + Agregar
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal simplificado */}
      {showLogoUpload && (
          <div className="logo-upload-modal-overlay" onClick={() => setShowLogoUpload(false)}>
            <div className="logo-upload-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h4>Gestionar Logo</h4>
                <button 
                  className="close-modal"
                  onClick={() => {
                    setShowLogoUpload(false);
                    setLogoFile(null);
                  }}
                >
                  ×
                </button>
              </div>
              
              <div className="logo-upload-form">
                {/* Logo actual (si existe) */}
                {logoUrl && (
                  <div className="current-logo-compact">
                    <p className="section-label">Logo actual:</p>
                    <div className="logo-current-container">
                      <img 
                        src={logoUrl} 
                        alt="Logo actual" 
                        className="logo-current"
                      />
                      <button 
                        className="btn-delete-logo"
                        onClick={handleLogoDelete}
                        title="Eliminar logo"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Área de subida */}
                <div className="upload-area">
                  <p className="section-label">Nuevo logo:</p>
                  
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  
                  <label htmlFor="logo-upload" className="upload-label">
                    <div className="upload-content">
                      {logoFile ? (
                        <>
                          <div className="file-info">
                            <div className="file-name">{logoFile.name}</div>
                            <div className="file-size">{(logoFile.size / 1024).toFixed(1)} KB</div>
                          </div>
                          {logoFile.width && logoFile.height && (
                            <div className="file-dimensions">
                              {logoFile.width} × {logoFile.height}px
                            </div>
                          )}
                          <div className="change-file">Haz clic para cambiar</div>
                        </>
                      ) : (
                        <>
                          <div className="upload-icon">📁</div>
                          <div className="upload-text">Seleccionar archivo</div>
                          <div className="upload-hint">JPG, PNG, GIF, WEBP, SVG • Máx. 2MB</div>
                        </>
                      )}
                    </div>
                  </label>
                  
                  {/* Vista previa compacta */}
                  {logoFile && (
                    <div className="preview-compact">
                      <img 
                        src={URL.createObjectURL(logoFile)} 
                        alt="Vista previa" 
                        className="preview-image"
                        onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                      />
                    </div>
                  )}
                </div>
                
                {/* Acciones */}
                <div className="modal-actions-compact">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowLogoUpload(false);
                      setLogoFile(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleLogoUpload}
                    disabled={!logoFile || uploadingLogo}
                  >
                    {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="nav-menu">
          <Link to="/" className="nav-link">Inicio</Link>
          
          {user ? (
            <>
              <Link to={getDashboardPath()} className="nav-link">
                Panel de Control
              </Link>
              
              <div className="user-info">
                <div className="user-avatar">
                  {(user.nombre || user.username || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="user-details-small">
                  <div className="user-name">{user.nombre || user.username}</div>
                  <div className="user-role">{getUserRole()}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="btn btn-small btn-secondary"
                >
                  Salir
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link active">
                Iniciar Sesión
              </Link>
              <Link to="/create-superadmin" className="nav-link">
                Crear Super Admin
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;