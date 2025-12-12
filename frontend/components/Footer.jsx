import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaRegCopyright,
} from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

const Footer = () => {
  return (
    <footer className="footer">
      {/* Redes sociales al inicio */}
      <div className="social-media-top">
        <a
          href="https://www.facebook.com/supermercadosmerkahorro/?locale=es_LA"
          aria-label="Facebook"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaFacebookF className="social-icon" />
        </a>
        <a
          href="https://www.tiktok.com/@supermercadomerkahorro"
          aria-label="TikTok"
          target="_blank"
          rel="noopener noreferrer"
        >
          <SiTiktok className="social-icon" />
        </a>
        <a
          href="https://www.instagram.com/supermercadomerkahorro/?hl=es"
          aria-label="Instagram"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram className="social-icon" />
        </a>
        <a
          href="https://www.youtube.com/@Merkahorro"
          aria-label="Youtube"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaYoutube className="social-icon" />
        </a>
      </div>

      {/* Contenido principal */}
      <div className="footer-content">
        {/* Contacto a la izquierda */}
        <div className="footer-section contact-info">
          <h3>Contacto</h3>
          <ul>
            <li>Calle 52 #52-27, Copacabana, Antioquia</li>
            <li>
              <a href="tel:+573245597862">324 5597862</a>
            </li>
            <li>
              <a href="mailto:paginaweb@merkahorrosas.com">
                paginaweb@merkahorrosas.com
              </a>
            </li>
          </ul>
        </div>

        {/* Logo y frase en el centro */}
        <div className="footer-brand">
          <img src="/logoMK.webp" alt="Footer Logo" className="footer-logo" />
          <p>Calidad y ahorro, siempre.</p>
        </div>

        {/* Legal a la derecha */}
        <div className="footer-section quick-links">
          <h3>Legal</h3>
          <ul>
            <li>
              <Link to="/politicas">Políticas de Privacidad</Link>
            </li>
            <li>
              <Link to="/condiciones">Términos y Condiciones</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Parte inferior */}
      <div className="footer-bottom">
        <p className="all-rights">
          <FaRegCopyright size={14} style={{ marginRight: "6px" }} />
          2025 Supermercados Merkahorro - Todos los derechos reservados
        </p>
        {/* ***** MODIFICACIÓN AQUÍ ***** */}
        <p className="developer-info">
          Desarrollado por{" "}
          <a
            href="https://stelarcode.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }} /* Opcional: para mantener el estilo del texto existente pero subrayado */
          >
            StelarCode
          </a>
        </p>
        {/* ***** FIN DE LA MODIFICACIÓN ***** */}
      </div>
    </footer>
  );
};

export { Footer };