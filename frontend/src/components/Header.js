import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState(null);
  const [strideLogoUrl, setStrideLogoUrl] = useState(null);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);
  const [userFullData, setUserFullData] = useState(null);
  const userMenuRef = useRef(null);

  // Cargar logos y foto del usuario al montar
  useEffect(() => {
    loadLogo();
    loadStrideLogo();
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadLogo = () => {
    const baseUrl = 'http://localhost:5000/uploads/logos/institution-logo';
    
    const extensions = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
    
    const imagePromises = extensions.map(ext => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ found: true, url: baseUrl + ext });
        };
        img.onerror = () => {
          resolve({ found: false, url: baseUrl + ext });
        };
        img.src = baseUrl + ext;
      });
    });

    Promise.all(imagePromises).then(results => {
      const foundLogo = results.find(result => result.found);
      if (foundLogo) {
        setLogoUrl(foundLogo.url);
      } else {
        setLogoUrl(null);
      }
    });
  };

  const loadStrideLogo = () => {
    // Cargar el logo de STRIDE desde la ruta especificada
    const logoPath = 'http://localhost:5000/uploads/logo_app/STRIDE%20WITHE%20LETTERS.png';
    
    const img = new Image();
    img.onload = () => {
      console.log('✅ Logo de STRIDE cargado correctamente');
      setStrideLogoUrl(logoPath);
    };
    img.onerror = () => {
      console.log('❌ Error al cargar el logo de STRIDE, usando alternativo');
      // Intentar con una ruta alternativa
      const alternativePath = 'http://localhost:5000/uploads/logo_app/stride-logo.png';
      const img2 = new Image();
      img2.onload = () => {
        setStrideLogoUrl(alternativePath);
      };
      img2.onerror = () => {
        setStrideLogoUrl(null);
      };
      img2.src = alternativePath;
    };
    img.src = logoPath;
  };

  const loadUserData = async () => {
    if (!user) return;

    console.log('🔍 Cargando datos completos para usuario:', {
      id: user.id,
      tipo: user.tipo,
      email: user.email
    });

    try {
      const response = await axios.get('http://localhost:5000/api/university/personal');
      
      if (response.data.success) {
        const allPersonal = response.data.data || [];
        console.log(`✅ Personal obtenido: ${allPersonal.length} registros`);
        
        const currentUserData = allPersonal.find(p => p.id === user.id);
        
        if (currentUserData) {
          console.log('✅ Usuario encontrado en la lista:', {
            nombre: currentUserData.nombre_completo,
            tieneFoto: !!currentUserData.foto_perfil,
            foto_perfil: currentUserData.foto_perfil
          });
          
          setUserFullData(currentUserData);
          
          if (currentUserData.foto_perfil) {
            loadUserPhoto(currentUserData.foto_perfil);
          } else {
            setUserPhoto(null);
          }
        } else {
          console.log('⚠️ Usuario no encontrado en la lista de personal');
          setUserPhoto(null);
        }
      }
    } catch (error) {
      console.error('❌ Error obteniendo lista de personal:', error);
      setUserPhoto(null);
    }
  };

  const loadUserPhoto = (fotoPerfil) => {
    if (!fotoPerfil) {
      setUserPhoto(null);
      return;
    }

    console.log('📸 Cargando foto:', fotoPerfil);
    
    const urlsToTry = [
      `http://localhost:5000/api/university/personal/foto/${fotoPerfil}`,
      `http://localhost:5000/uploads/personal/${fotoPerfil}`,
      `http://localhost:5000/api/university/personal/foto/default-avatar.png`
    ];

    const tryLoadImage = (index) => {
      if (index >= urlsToTry.length) {
        console.log('❌ Todas las URLs fallaron');
        setUserPhoto(null);
        return;
      }

      const url = urlsToTry[index];
      console.log(`🔄 Probando URL ${index + 1}: ${url}`);

      const img = new Image();
      img.onload = () => {
        console.log(`✅ Foto cargada desde: ${url}`);
        setUserPhoto(url);
      };
      img.onerror = () => {
        console.log(`❌ Falló URL: ${url}`);
        tryLoadImage(index + 1);
      };
      img.src = url;
    };

    tryLoadImage(0);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    setUploadingLogo(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('uploaded_by', user?.username || 'system');
      formData.append('user_type', user?.tipo || 'system');

      const response = await axios.post('http://localhost:5000/api/university/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Logo actualizado correctamente');
        setShowLogoUpload(false);
        setLogoFile(null);
        
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

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El logo debe ser menor a 2MB');
      return;
    }

    const img = new Image();
    img.onload = function() {
      const width = this.width;
      const height = this.height;
      
      if (height > width) {
        toast.warning('Recomendación: Los logos horizontales se ven mejor');
      }
      
      file.width = width;
      file.height = height;
      setLogoFile(file);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
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

  const getUserInitials = () => {
    if (!user) return '?';
    
    const name = user.nombre || user.username || 'Usuario';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getDisplayName = () => {
    if (!user) return '';
    return user.nombre || user.username || 'Usuario';
  };

  return (
    <header className="university-header">
      <div className="header-content">
        <div className="logo-container">
          {/* Logo de STRIDE - Versión pequeña */}
          <div className="stride-logo-section">
            {strideLogoUrl ? (
              <div className="stride-logo-container-small">
                <img 
                  src={strideLogoUrl} 
                  alt="STRIDE" 
                  className="stride-logo-small"
                  title="STRIDE - Sistema de Gestión de actividades universitarias"
                />
              </div>
            ) : (
              <div className="logo-icon-small">🎓</div>
            )}
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

        {/* Modal para logo */}
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
                Mis actividades
              </Link>
              
              {/* Perfil del usuario */}
              <div className="user-profile-compact" ref={userMenuRef}>
                <button 
                  className="user-avatar-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Mi cuenta"
                >
                  {userPhoto ? (
                    <img 
                      src={userPhoto} 
                      alt={getDisplayName()}
                      className="avatar-photo"
                    />
                  ) : (
                    <div className="avatar-circle">
                      {getUserInitials()}
                    </div>
                  )}
                </button>
                
                {/* Menú desplegable */}
                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {userPhoto ? (
                          <img 
                            src={userPhoto} 
                            alt={getDisplayName()}
                            className="avatar-photo-large"
                          />
                        ) : (
                          <div className="avatar-circle-large">
                            {getUserInitials()}
                          </div>
                        )}
                      </div>
                      <div className="dropdown-user-info">
                        <div className="dropdown-greeting">
                          ¡Hola, <strong>{getDisplayName()}!</strong>
                        </div>
                        <div className="dropdown-role">
                          {getUserRole()}
                        </div>
                        <div className="dropdown-email">
                          {user.email}
                        </div>
                        {userFullData?.foto_perfil && (
                          <div className="dropdown-photo-info">
                            <small>
                              ID: {user.id} • Foto: {userFullData.foto_perfil}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <div className="dropdown-actions">
                      <button 
                        className="dropdown-item logout-item"
                        onClick={handleLogout}
                      >
                        <span className="dropdown-icon">🚪</span>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
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