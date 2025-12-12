import React, { useRef, useState, useEffect } from "react";
import "./Home.css";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ChatBot } from "../components/ChatBot";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const playButtonRef = useRef(null);
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Referencias para las secciones a las que se va a desplazar
  const sedesRef = useRef(null);
  const companiaRef = useRef(null);
  const principiosRef = useRef(null);
  const historiaRef = useRef(null);

  const images = [
    { src: "/mk1.webp" },
    { src: "/mk2.webp" },
    { src: "/mk3.webp" },
    { src: "/mk4.webp" },
  ];

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Manejar el desplazamiento suave
  useEffect(() => {
    // Escucha los cambios en el hash de la URL (ej. #sedes)
    const handleHashChange = () => {
      const hash = window.location.hash;
      let targetElement = null;

      switch (hash) {
        case "#sedes":
          targetElement = sedesRef.current;
          break;
        case "#principios":
          targetElement = principiosRef.current;
          break;
        case "#historia":
          targetElement = historiaRef.current;
          break;
        default:
          // Si no hay hash específico o es un hash vacío, no hacer scroll
          return;
      }

      if (targetElement) {
        // Usa scrollIntoView para un desplazamiento suave
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        // Opcional: Eliminar el hash de la URL después del scroll para una URL más limpia
        // window.history.replaceState(null, document.title, window.location.pathname);
      }
    };

    // Si ya hay un hash al cargar la página, desplázate inmediatamente
    handleHashChange();

    // Añade el event listener para cambios de hash posteriores (cuando el usuario hace clic)
    window.addEventListener("hashchange", handleHashChange);

    // Limpia el event listener al desmontar el componente
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Flecha izquierda
  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    removeArrowActiveState();
  };

  // Flecha derecha
  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
    removeArrowActiveState();
  };

  // Remueve el estado :active visual de las flechas tras el click
  const removeArrowActiveState = () => {
    setTimeout(() => {
      document.querySelectorAll(".carousel-arrow").forEach((btn) => btn.blur());
    }, 100);
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    if (playButtonRef.current) {
      playButtonRef.current.classList.toggle("playing", isPlaying);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const progressValue =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progressValue);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const seekTime = (e.target.value / 100) * videoRef.current.duration;
      videoRef.current.currentTime = seekTime;
      setProgress(e.target.value);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="Home-body">
      <Header />

      {/* Carrusel */}
      <div className="carousel" data-aos="fade-in">
        {/* Flecha izquierda */}
        <button
          className="carousel-arrow left"
          onClick={prevSlide}
          aria-label="Anterior"
          type="button"
        >
          <FaChevronLeft />
        </button>
        <div className="container-slides">
          {images.map((image, index) => (
            <div
              key={index}
              className={`slide ${index === currentIndex ? "active" : ""}`}
              style={{ display: index === currentIndex ? "block" : "none" }}
            >
              <img src={image.src} alt={`Imagen ${index + 1}`} />
            </div>
          ))}
        </div>
        {/* Flecha derecha */}
        <button
          className="carousel-arrow right"
          onClick={nextSlide}
          aria-label="Siguiente"
          type="button"
        >
          <FaChevronRight />
        </button>
      </div>
      {/* Puntos fuera del carrusel */}
      <div className="dots">
        {images.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
          ></span>
        ))}
      </div>

      {/* Botones flotantes */}
      <div className="floating-buttons" data-aos="zoom-in">
        <button
          id="playButton"
          className="play-button"
          ref={playButtonRef}
          onClick={handlePlay}
          type="button"
          aria-label="Reproducir o pausar radio"
          title={
            isPlaying ? "Pausar radio en vivo" : "Reproducir radio en vivo"
          }
          aria-pressed={isPlaying}
        >
          <span className="play-icon">
            {isPlaying ? <FaPause /> : <FaPlay />}
          </span>
        </button>
        <audio id="live-audio" preload="auto" ref={audioRef}>
          <source
            src="https://radiolatina.info/8016/stream"
            type="audio/mpeg"
          />
          Tu navegador no soporta la reproducción de audio.
        </audio>
        <ChatBot />
      </div>

      {/* Sección de sedes */}
      {/* Agregado el ID "sedes" y la ref */}
      <h1 className="title-sedes" data-aos="fade-up" id="sedes" ref={sedesRef}>
        Conoce nuestras sedes
      </h1>
      <div
        className="tarjeta-container"
        data-aos="fade-up"
        data-aos-delay="200"
      >
        <section className="tarjeta" id="tarjeta">
          <img
            className="logo-sedes"
            src="/Plaza.webp"
            alt="Copacabana Plaza"
          />
          <h2>Copacabana Plaza</h2>
          <p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Calle+52+%2352-27"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetas"
                src="/ubicacion.webp"
                alt="Ubicación"
              />
            </a>
            Dirección: Calle 52 #52-27
          </p>
          <p>
            <a
              href="https://wa.me/573147956325"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetatel"
                src="/wasap.webp"
                alt="Teléfono"
              />
            </a>
            Teléfono: 3147956325
          </p>
        </section>

        <section className="tarjeta" id="tarjeta">
          <img
            className="logo-sedes"
            src="/centro A.webp"
            alt="Centro Administrativo"
          />
          <h2>Centro Administrativo</h2>
          <p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Calle+52+%2352-27"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetas"
                src="/ubicacion.webp"
                alt="Ubicación"
              />
            </a>
            Dirección: Calle 52 #52-27
          </p>
          <p>
            <a
              href="https://wa.me/573245597862"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetatel"
                src="/wasap.webp"
                alt="Teléfono"
              />
            </a>
            Teléfono: 3245597862
          </p>
        </section>

        <section className="tarjeta" id="tarjeta">
          <img
            className="logo-sedes"
            src="/villahermosa.webp"
            alt="Villa Hermosa"
          />
          <h2>Villa Hermosa</h2>
          <p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Carrera+40+%2364-51"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetas"
                src="/ubicacion.webp"
                alt="Ubicación"
              />
            </a>
            Dirección: Carrera 40 #64-51
          </p>
          <p>
            <a
              href="https://wa.me/573185369987"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetatel"
                src="/wasap.webp"
                alt="Teléfono"
              />
            </a>
            Teléfono: 3185369987
          </p>
        </section>

        <section className="tarjeta" id="tarjeta">
          <img
            className="logo-sedes"
            src="/girardota parque.webp"
            alt="Girardota parque"
          />
          <h2>Girardota Parque</h2>
          <p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Calle+7+%2315-61"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetas"
                src="/ubicacion.webp"
                alt="Ubicación"
              />
            </a>
            Dirección: Calle 7 #15-61
          </p>
          <p>
            <a
              href="https://wa.me/573186247765"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetatel"
                src="/wasap.webp"
                alt="Teléfono"
              />
            </a>
            Teléfono: 3186247765
          </p>
        </section>

        <section className="tarjeta" id="tarjeta">
          <img
            className="logo-sedes"
            src="/girardota llano.webp"
            alt="Girardota llano"
          />
          <h2>Girardota Llano</h2>
          <p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Calle+11+%2316-43"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetas"
                src="/ubicacion.webp"
                alt="Ubicación"
              />
            </a>
            Dirección: Calle 11 #16-43
          </p>
          <p>
            <a
              href="https://wa.me/573182681285"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetatel"
                src="/wasap.webp"
                alt="Teléfono"
              />
            </a>
            Teléfono: 3182681285
          </p>
        </section>

        <section className="tarjeta" id="tarjeta">
          <img
            className="logo-sedes"
            src="/carnes barbosa.webp"
            alt="Carnes barbosa"
          />
          <h2>Carnes Barbosa</h2>
          <p>
            <a
              href="https://maps.app.goo.gl/7jCPPiDha7FviHP58"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetas"
                src="/ubicacion.webp"
                alt="Ubicación"
              />
            </a>
            Dirección: Carrera 14 #11-09
          </p>
          <p>
            <a
              href="https://wa.me/573225105463"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetatel"
                src="/wasap.webp"
                alt="Teléfono"
              />
            </a>
            Teléfono: 3225105463
          </p>
        </section>

        <section className="tarjeta" id="tarjeta">
          <img
            className="logo-sedes"
            src="/copacabana vegas.webp"
            alt="Copacabana Vegas"
          />
          <h2>Copacabana Vegas</h2>
          <p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Carrera+56+%23+43-159"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetas"
                src="/ubicacion.webp"
                alt="Ubicación"
              />
            </a>
            Dirección: Carrera 56 # 43 - 159
          </p>
          <p>
            <a
              href="https://wa.me/573243638526"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetatel"
                src="/wasap.webp"
                alt="Teléfono"
              />
            </a>
            Teléfono: 3243638526
          </p>
        </section>

        <section className="tarjeta" id="tarjeta">
          <img className="logo-sedes" src="/barbosa.webp" alt="Barbosa" />
          <h2>Barbosa</h2>
          <p>
            <a
              href="https://maps.app.goo.gl/3K9oqWHPMk5WpXfK6"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetas"
                src="/ubicacion.webp"
                alt="Ubicación"
              />
            </a>
            Dirección: Carrera 14 # 11-18
          </p>
          <p>
            <a
              href="https://wa.me/573006828595"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetatel"
                src="/wasap.webp"
                alt="Teléfono"
              />
            </a>
            Teléfono: 3006828595
          </p>
        </section>

        <section className="tarjeta" id="tarjeta">
          <img
            className="logo-sedes"
            src="/copacabana san juan.webp"
            alt="Copacabana San Juan"
          />
          <h2>Copacabana San Juan</h2>
          <p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Carrera+28+%23+45-41"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetas"
                src="/ubicacion.webp"
                alt="Ubicación"
              />
            </a>
            Dirección: Carrera 28 # 45-41
          </p>
          <p>
            <a
              href="https://wa.me/573165563838"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="icono-tarjetatel"
                src="/wasap.webp"
                alt="Teléfono"
              />
            </a>
            Teléfono: 3165563838
          </p>
        </section>
      </div>

      {/* Logo corporativo - Sección "Nuestra Compañía" */}
      {/* Agregado el ID "compañia" y la ref */}
      <div
        className="container-logocorporativo"
        data-aos="fade-in"
        id="compañia"
        ref={companiaRef}
      >
        <img
          id="logocorporativo"
          className="logocorporativo"
          src="/logoMK.webp"
          alt="Logo corporativo"
        />
      </div>

      {/* Sección principal */}
      <main className="Home" data-aos="fade-up">
        <div className="card-container">
          {/* Tarjeta de "Nuestra Compañía" */}
          <div className="flip-card">
            {" "}
            {/* No es necesario id="compañia" aquí si el div contenedor superior ya lo tiene */}
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <img
                  className="logosmain"
                  src="/carritomercado.webp"
                  alt="Nuestra Compañía"
                />
                <h2>Nuestra Compañía</h2>
              </div>
              <div className="flip-card-back">
                <p>
                  Merkahorro es una entidad empresarial que ha destacado por su
                  notable presencia en el mercado. Su expansión se fundamenta en
                  el compromiso constante de perfeccionar y agilizar los
                  procesos de pedidos, entregas, promociones, órdenes y
                  servicios al cliente.
                </p>
              </div>
            </div>
          </div>

          <div className="flip-card" id="mision">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <img className="logosmain" src="/objetivo.webp" alt="Misión" />
                <h2>Misión</h2>
              </div>
              <div className="flip-card-back">
                <p>
                  Llevamos bienestar y felicidad a los hogares, a través de
                  productos y servicios de alta calidad que distribuimos en cada
                  uno de nuestros supermercados, con un ambiente de respeto y
                  cuidado hacia nuestros visitantes, y un equipo humano que
                  disfruta lo que hace.
                </p>
              </div>
            </div>
          </div>

          <div className="flip-card" id="vision">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <img
                  className="logosmain"
                  src="/visionymision.webp"
                  alt="Visión"
                />
                <h2>Visión</h2>
              </div>
              <div className="flip-card-back">
                <p>
                  En el año 2026, se proyecta que Merkahorro S.A.S tendrá 12
                  sedes en todo el territorio nacional en diversos municipios,
                  con alrededor de 450 empleados, siendo líder en el segmento de
                  supermercados independientes.
                </p>
              </div>
            </div>
          </div>

          {/* Sección "Nuestros Principios" */}
          {/* Agregado el ID "principios" y la ref */}
          <div className="flip-card" id="principios" ref={principiosRef}>
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <img
                  className="logosmain"
                  src="/principios-morales.webp"
                  alt="Principios"
                />
                <h2>Principios</h2>
              </div>
              <div className="flip-card-back">
                <ul>
                  <li>
                    <strong>La Verdad:</strong> Es la razón de ser, que nos
                    lleva a vivir en responsabilidad y confiabilidad,
                    fortaleciendo el carácter y las relaciones de valor
                    impactando vidas.
                  </li>
                  <li>
                    <strong>La Belleza:</strong> Es el estado de conciencia que
                    nos permite admitir cada detalle, transformando lo común en
                    extraordinario, creando signifcado en cada encuentro de
                    vida.
                  </li>
                  <li>
                    <strong>La Bondad:</strong> Es nuestra desición de ser
                    buenos. Nace del amor propio cuando armonizamos la
                    gratuitud, la ética y el bienestar, al servir con
                    integridad, lo que nos otorga una vida en grandeza.
                  </li>
                  <li>
                    <strong>La Unidad:</strong> Promover la cohesión y
                    colaboración.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flip-card" id="fundadores">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <img className="logosmain" src="/Ceo.webp" alt="Fundadores" />
                <h2>Fundadores</h2>
              </div>
              <div className="flip-card-back">
                <p>
                  Supermercados Merkahorro surgió como la materialización de la
                  visión compartida por dos hermanos en 2015, quienes, pese a la
                  carencia inicial de recursos, se dedicaron a hacer realidad su
                  ambicioso proyecto en Copacabana.
                </p>
                <p>
                  Su enfoque fue lograr ser el principal supermercado en la
                  localidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <br />
      <br />
      <br />

      {/* Sección de video - "Nuestra Historia" */}
      {/* Agregado el ID "historia" y la ref */}
      <div
        className="video-container"
        data-aos="zoom-in"
        id="historia"
        ref={historiaRef}
      >
        <h1>Historia de nuestra compañía</h1>
        <div className="responsive-video-wrapper">
          <video
            controls
            muted
            loop
            preload="auto"
            src="/Videomercahorro.mp4"
            className="video-historia"
            poster="/mk1.webp"
          ></video>
        </div>
      </div>

      {/* Sección de olas*/}
      <div className="wave-container">
        <svg className="wave" viewBox="0 0 2880 170" preserveAspectRatio="none">
          <path
            d="M0,170 C960,120 1920,120 2880,170 L2880,170 H0 Z"
            style={{ transform: "translateY(2px)" }} // Base fija, bajado 2px
          >
            <animate
              attributeName="d"
              values="
          M0,170 C960,120 1920,120 2880,170 L2880,170 H0 Z;
          M0,170 C960,100 1920,100 2880,170 L2880,170 H0 Z;
          M0,170 C960,120 1920,120 2880,170 L2880,170 H0 Z"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      <Footer />
    </div>
  );
};

export { Home };
