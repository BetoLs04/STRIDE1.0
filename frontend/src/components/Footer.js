import React from 'react';

const Footer = () => {
  return (
    <footer className="university-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>STRIDE University</h3>
          <p>
            Sistema Tecnológico para la Gestión y Desarrollo Educativo.
            Comprometidos con la excelencia académica y la innovación tecnológica.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>📧 info@stride.edu</p>
          <p>📞 +1 (555) 123-4567</p>
          <p>📍 Universidad STRIDE, Ciudad Educativa</p>
        </div>
        
        <div className="footer-section">
          <h3>Enlaces Rápidos</h3>
          <p>• Admisiones</p>
          <p>• Biblioteca Digital</p>
          <p>• Portal Docente</p>
          <p>• Soporte Técnico</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} STRIDE University. Todos los derechos reservados.</p>
        <p>Sistema de Gestión Académica v2.0</p>
      </div>
    </footer>
  );
};

export default Footer;