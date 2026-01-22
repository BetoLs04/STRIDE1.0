import React from 'react';

const Footer = () => {
  return (
    <footer className="university-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>STRIDE</h3>
          <p>
            Sistema Tecnológico para la Gestión y Desarrollo Educativo.
            Comprometidos con la excelencia académica y la innovación tecnológica.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>📧 lazarox200@gmail.com</p>
          <p>📞 +52 449-550-5392</p>
        </div>
        
        <div className="footer-section">
          <h3>Funciones del sistema:</h3>
          <p>• Visualización de actividades</p>
          <p>• Creacion de reportes de actividades.</p>
          <p>• Paneles indviduales para cada tipo de usuario.</p>
          <p>• Soporte Técnico</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} STRIDE Todos los derechos reservados.</p>
        <p>Sistema de Gestión Académica v2.0. Creado por Lázaro Roberto Luevano Serna</p>
      </div>
    </footer>
  );
};

export default Footer;