import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

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
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <h1>STRIDE University</h1>
            <p className="subtitle">Sistema de Gestión</p>
          </div>
        </div>

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