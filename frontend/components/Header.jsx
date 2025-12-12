import React, { useState } from "react";
import "./Header.css";
import { Link } from "react-router-dom";
import { FaUserTie, FaTimes, FaChevronDown } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNosotrosOpen, setIsNosotrosOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setIsNosotrosOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setIsNosotrosOpen(false);
  };

  const toggleNosotrosMenu = () => {
    setIsNosotrosOpen((prev) => !prev);
  };

  // Manejar desplazamiento suave para los enlaces del submenú
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const headerHeight = document.querySelector("header").offsetHeight;
      const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - headerHeight,
        behavior: "smooth",
      });
    }
    handleLinkClick();
  };

  return (
    <header>
      <nav className="hd-navbar">
        <div className="hd-container">
          <Link to="/" className="hd-logo-link" onClick={handleLinkClick}>
            <img
              src="/logoMK.webp"
              alt="Logo Merkahorro"
              className="hd-logo-img"
            />
          </Link>

          <button
            className="hd-menu-toggle"
            onClick={toggleMenu}
            aria-label="Abrir o cerrar menú de navegación"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <FaTimes /> : <GiHamburgerMenu />}
          </button>

          <ul className={`hd-nav-list ${isMenuOpen ? "show" : ""}`}>
            <li className={`hd-dropdown ${isNosotrosOpen ? "open" : ""}`}>
              <button
                className="hd-nav-link hd-dropdown-toggle"
                onClick={toggleNosotrosMenu}
                aria-expanded={isNosotrosOpen}
              >
                Nosotros <FaChevronDown className="hd-dropdown-icon" />
              </button>
              <ul className={`hd-submenu ${isNosotrosOpen ? "show" : ""}`}>
                <li>
                  <a
                    href="#sedes"
                    className="hd-submenu-link"
                    onClick={(e) => handleSmoothScroll(e, "sedes")}
                  >
                    Nuestras Sedes
                  </a>
                </li>
                <li>
                  <a
                    href="#principios"
                    className="hd-submenu-link"
                    onClick={(e) => handleSmoothScroll(e, "principios")}
                  >
                    Nuestros Principios
                  </a>
                </li>
                <li>
                  <a
                    href="#historia"
                    className="hd-submenu-link"
                    onClick={(e) => handleSmoothScroll(e, "historia")}
                  >
                    Nuestra Historia
                  </a>
                </li>
              </ul>
            </li>

            <li>
              <Link
                to="/contribucion"
                className="hd-nav-link"
                onClick={handleLinkClick}
              >
                Contribución
              </Link>
            </li>
            <li>
              <Link
                to="/promociones"
                className="hd-nav-link"
                onClick={handleLinkClick}
              >
                Promociones
              </Link>
            </li>
            <li>
              <Link
                to="/trabaja-con-nosotros"
                className="hd-nav-link"
                onClick={handleLinkClick}
              >
                Trabaja con nosotros
              </Link>
            </li>
            <li>
              <a
                href="https://merkahorro.com/Aula/"
                className="hd-nav-link"
                onClick={handleLinkClick}
                target="_blank"
                rel="noopener noreferrer"
              >
                Aula
              </a>
            </li>
            <li className="hd-login-icon">
              <Link
                to="/login"
                className="hd-nav-link"
                onClick={handleLinkClick}
              >
                <FaUserTie className="default-icon" />
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export { Header };