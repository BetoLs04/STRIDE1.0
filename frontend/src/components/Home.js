import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/App.css';

const Home = () => {
  const navigate = useNavigate();
  const [superAdminExists, setSuperAdminExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuperAdminExistence();
  }, []);

  const checkSuperAdminExistence = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/university/superusers');
      const hasSuperAdmin = response.data.data && response.data.data.length > 0;
      setSuperAdminExists(hasSuperAdmin);
    } catch (error) {
      console.error('Error verificando super admin:', error);
      setSuperAdminExists(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando configuración del sistema...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">STRIDE</h1>
        <p className="hero-subtitle">
          Plataforma integral de gestión académica universitaria. 
          Tecnología avanzada para la educación del futuro.
        </p>
        
        <div className="button-group" style={{ justifyContent: 'center' }}>
          {/* Solo mostrar botón de crear Super Admin si NO existe ninguno */}
          {!superAdminExists ? (
            <button 
              className="btn btn-accent"
              onClick={() => navigate('/create-superadmin')}
              style={{ fontSize: '1.1rem', padding: '15px 30px' }}
            >
              Configurar Sistema (Primer Super Admin)
            </button>
          ) : null}
          
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/login')}
            style={{ fontSize: '1.1rem', padding: '15px 30px' }}
          >
            Iniciar Sesión
          </button>
        </div>

        {!superAdminExists && (
          <div className="system-warning" style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            maxWidth: '600px',
            margin: '2rem auto 0'
          }}>
            <h4 style={{ color: '#ffc107', marginBottom: '0.5rem' }}>
              ⚠️ Sistema no configurado
            </h4>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              Es necesario crear el primer Super Administrador para configurar el sistema.
              Después de esta configuración inicial, solo los Super Admins podrán crear más usuarios.
            </p>
          </div>
        )}
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">👑</div>
          <h3>Super Administración</h3>
          <p>Control total del sistema, creación de direcciones, directivos y personal.</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">👔</div>
          <h3>Panel Directivo</h3>
          <p>Gestión de actividades y supervisión del personal de su direccion.</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>Área Personal</h3>
          <p>Creación y seguimiento de actividades asignadas por dirección.</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }}>
          ¿Listo para transformar la gestión educativa?
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/welcome')}
          style={{ fontSize: '1.2rem', padding: '15px 40px' }}
        >
          Explorar STRIDE
        </button>
      </div>
    </div>
  );
};

export default Home;