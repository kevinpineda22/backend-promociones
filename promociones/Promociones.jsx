import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// Importaciones de Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

import "./Promociones.css";
import { Footer } from "../../components/Footer";
import { ChatBot } from "../../components/ChatBot";
import { getAssetUrl } from "../../config/storage";

const Promociones = () => {
  const [modalImg, setModalImg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flyers, setFlyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        // Hora actual en UTC (Supabase usa UTC)
        const now = new Date().toISOString();

        const { data, error } = await supabase
          .from("promociones")
          .select("*")
          .eq("active", true)
          .lte("start_date", now) // Fecha inicio debe ser menor o igual a hoy
          .or(`end_date.is.null,end_date.gt.${now}`) // end_date nulo O mayor a hoy
          .order("order_index", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        setFlyers(data || []);
      } catch (err) {
        console.error("Error fetching promotions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.update();
      swiperRef.current.slideTo(0, 0);
    }
  }, [flyers]);

  const openModal = (imgSrc) => {
    setModalImg(imgSrc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImg("");
  };

  const promocionesActivas = flyers.length > 0;

  return (
    <div className="promo-page">
      <header className="promo-header">
        <Link to="/" className="promo-back-logo">
          <img src={getAssetUrl("mkicono.webp")} alt="Logo Merkahorro" />
        </Link>
        <div className="promo-title-container">
          <h1 className="promo-title">Súper Ofertas Merkahorro</h1>
        </div>
      </header>

      <main className="promo-main-content">
        {loading ? (
          <div className="promo-loading">
            <p>Cargando ofertas...</p>
          </div>
        ) : promocionesActivas ? (
          <Swiper
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={"auto"}
            initialSlide={0}
            loop={false}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              swiper.slideTo(0, 0);
            }}
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
            {flyers.map((flyer, index) => (
              <SwiperSlide
                key={flyer.id || index}
                style={{ backgroundColor: flyer.bg_color || "transparent" }}
                onClick={() => openModal(flyer.image_url)}
              >
                <img src={flyer.image_url} alt={`Promoción ${index + 1}`} />
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
