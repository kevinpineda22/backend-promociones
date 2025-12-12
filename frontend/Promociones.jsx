import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Importaciones de Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

import "./Promociones.css";
import { Footer } from "../components/Footer";
import { ChatBot } from "../components/ChatBot";

const Promociones = () => {
  const [modalImg, setModalImg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:3000/api/promociones";

  useEffect(() => {
    const fetchPromociones = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Error al cargar promociones");
        const data = await response.json();
        setPromociones(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromociones();
  }, []);

  const openModal = (imgSrc) => {
    setModalImg(imgSrc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImg("");
  };

  return (
    <div className="promo-page">
      <header className="promo-header">
        <Link to="/" className="promo-back-logo">
          <img src="/mkicono.webp" alt="Logo Merkahorro" />
        </Link>
        <div className="promo-title-container">
          <h1 className="promo-title">Súper Ofertas Merkahorro</h1>
        </div>
      </header>

      <main className="promo-main-content">
        {loading ? (
          <div
            className="promo-loading"
            style={{ textAlign: "center", padding: "50px", color: "white" }}
          >
            <h2>Cargando ofertas...</h2>
          </div>
        ) : promociones.length > 0 ? (
          <Swiper
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={"auto"}
            initialSlide={0}
            loop={false}
            coverflowEffect={{
              rotate: 50,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: true,
            }}
            pagination={{ clickable: true }}
            navigation={true}
            modules={[EffectCoverflow, Pagination, Navigation]}
            className="my-swiper"
          >
            {promociones.map((promo, index) => (
              <SwiperSlide
                key={promo.id}
                style={{ backgroundColor: "transparent" }}
                onClick={() => openModal(promo.image_url)}
              >
                <img src={promo.image_url} alt={`Promoción ${index + 1}`} />
                <div className="slide-overlay">
                  <span className="slide-overlay-text">Ampliar</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="promo-no-promociones">
            <h2>Próximamente...</h2>
            <p>
              Estamos preparando las mejores ofertas para ti. ¡Vuelve pronto!
            </p>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="promo-modal-overlay" onClick={closeModal}>
          <span className="promo-modal-close-btn" onClick={closeModal}>
            &times;
          </span>
          <img
            src={modalImg}
            alt="Ampliación de promoción"
            className="promo-modal-image"
          />
        </div>
      )}

      <div className="promo-floating-buttons">
        <ChatBot showInviteMessage={false} />
      </div>

      <Footer />
    </div>
  );
};

export { Promociones };
