import React, { useState, useEffect, useRef } from "react";
import { supabase, uploadFileToBucket } from "../../supabaseClient";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Navigation } from "swiper/modules";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FaCloudUploadAlt,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaPalette,
  FaSort,
  FaSave,
  FaTimes,
  FaGripVertical,
  FaCrop,
} from "react-icons/fa";

import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import getCroppedImg from "./cropUtils";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./AdminPromociones.css";

// Función para determinar el estado de una promoción
const getStatusLabel = (promo) => {
  const now = new Date();
  const start = promo.start_date ? new Date(promo.start_date) : null;
  const end = promo.end_date ? new Date(promo.end_date) : null;

  if (!promo.active) return { label: "Desactivada", class: "inactive" };
  if (start && start > now) return { label: "Programada", class: "scheduled" };
  if (end && end < now) return { label: "Expirada", class: "expired" };
  return { label: "Activa", class: "active" };
};

const AdminPromociones = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [bgColor, setBgColor] = useState("transparent");
  const [showColorOptions, setShowColorOptions] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const fileInputRef = useRef(null);
  const swiperRef = useRef(null);

  // Estados para fechas de vigencia
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [endDate, setEndDate] = useState("");

  // Estados para el recorte
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppingImageIndex, setCroppingImageIndex] = useState(null);
  const [croppingPromo, setCroppingPromo] = useState(null); // Nueva: para editar promos existentes
  const [croppingImageSrc, setCroppingImageSrc] = useState(null);
  const imgRef = useRef(null);

  // Fetch promotions on load
  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.update();
      swiperRef.current.slideTo(0, 0);
    }
  }, [promotions]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from("promociones")
        .select("*")
        .order("order_index", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "Posiblemente falta la columna 'order_index'. Cargando por fecha.",
          error,
        );
        const fallback = await supabase
          .from("promociones")
          .select("*")
          .order("created_at", { ascending: false });

        if (fallback.error) throw fallback.error;
        data = fallback.data;
      }

      setPromotions(data || []);
    } catch (err) {
      console.error("Error fetching promotions:", err);
      setError("Error al cargar las promociones.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewImages((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setNewImages((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const convertToWebP = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + ".webp",
                {
                  type: "image/webp",
                  lastModified: Date.now(),
                },
              );
              resolve(newFile);
            } else {
              reject(new Error("Error al convertir la imagen"));
            }
          },
          "image/webp",
          0.8,
        );
      };
      img.onerror = (error) => reject(error);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (newImages.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      const uploadPromises = newImages.map(async (image) => {
        const webpFile = await convertToWebP(image);
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.webp`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await uploadFileToBucket({
          bucket: "promociones-bucket",
          path: filePath,
          file: webpFile,
        });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("promociones-bucket").getPublicUrl(filePath);

        // Enviar con offset de Colombia (-05:00) para mantener la hora exacta
        const startDateISO = startDate ? `${startDate}:00-05:00` : null;
        const endDateISO =
          endDate && endDate !== "" ? `${endDate}:00-05:00` : null;

        return supabase.from("promociones").insert([
          {
            image_url: publicUrl,
            bg_color: bgColor,
            active: true,
            order_index: 9999,
            start_date: startDateISO,
            end_date: endDateISO,
          },
        ]);
      });

      await Promise.all(uploadPromises);

      setNewImages([]);
      setBgColor("transparent");
      setShowColorOptions(false);
      setStartDate(new Date().toISOString().slice(0, 16));
      setEndDate("");

      await fetchPromotions();
      alert("Promociones subidas con éxito");
    } catch (err) {
      console.error("Error uploading promotion:", err);
      setError("Error al subir las promociones: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (promotions.length === 0) return;

    if (
      !window.confirm(
        "⚠️ ¿ESTÁS SEGURO? Esto eliminará TODAS las promociones permanentemente. Esta acción no se puede deshacer.",
      )
    )
      return;

    if (!window.confirm("Confirma nuevamente que deseas eliminar TODO."))
      return;

    try {
      setLoading(true);
      const { error: dbError } = await supabase
        .from("promociones")
        .delete()
        .neq("id", 0);

      if (dbError) throw dbError;

      await fetchPromotions();
      alert("Todas las promociones han sido eliminadas.");
    } catch (err) {
      console.error("Error deleting all promotions:", err);
      alert("Error al eliminar todas las promociones: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta promoción?")) return;

    try {
      setLoading(true);
      const { error: dbError } = await supabase
        .from("promociones")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
      await fetchPromotions();
    } catch (err) {
      console.error("Error deleting promotion:", err);
      alert("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from("promociones")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      await fetchPromotions();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const removeImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Funciones de Recorte ---
  const startCropping = (index) => {
    const file = newImages[index];
    if (file) {
      setCroppingImageIndex(index);
      setCroppingImageSrc(URL.createObjectURL(file));
      setCrop(undefined); // Reset crop to undefined for freeform
    }
  };

  const startCroppingPromo = (promo) => {
    setCroppingPromo(promo);
    setCroppingImageSrc(promo.image_url);
    setCrop(undefined);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const crop = {
      unit: "%",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    setCrop(crop);
  };

  const saveCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      // Necesitamos pasar la escala si la imagen mostrada está escalada
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedImageBlob = await getCroppedImg(croppingImageSrc, pixelCrop);

      // CASO 1: Editando una promoción YA existente (subida)
      if (croppingPromo) {
        setLoading(true);
        const fileName = `cropped_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.webp`;

        // Subir la nueva imagen recortada
        const { error: uploadError } = await uploadFileToBucket({
          bucket: "promociones-bucket",
          path: fileName,
          file: croppedImageBlob,
        });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("promociones-bucket").getPublicUrl(fileName);

        // Actualizar la base de datos con la nueva URL
        const { error: dbError } = await supabase
          .from("promociones")
          .update({ image_url: publicUrl })
          .eq("id", croppingPromo.id);

        if (dbError) throw dbError;

        await fetchPromotions();
        alert("Imagen actualizada correctamente");
      }
      // CASO 2: Editando una imagen NUEVA (aún no subida)
      else if (croppingImageIndex !== null) {
        const originalFile = newImages[croppingImageIndex];
        const newFile = new File([croppedImageBlob], originalFile.name, {
          type: "image/webp",
          lastModified: Date.now(),
        });

        const updatedImages = [...newImages];
        updatedImages[croppingImageIndex] = newFile;
        setNewImages(updatedImages);
      }

      // Cerrar el modal
      cancelCropping();
    } catch (e) {
      console.error(e);
      alert("Error al recortar la imagen: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelCropping = () => {
    setCroppingImageIndex(null);
    setCroppingPromo(null);
    setCroppingImageSrc(null);
    setCompletedCrop(null);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(promotions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPromotions(items);
  };

  const saveOrder = async () => {
    try {
      setLoading(true);

      const updates = promotions.map((promo, index) => ({
        id: promo.id,
        order_index: index,
      }));

      const updatePromises = updates.map((item) =>
        supabase
          .from("promociones")
          .update({ order_index: item.order_index })
          .eq("id", item.id),
      );

      await Promise.all(updatePromises);

      setIsReordering(false);
      alert("Orden guardado correctamente");
      await fetchPromotions();
    } catch (err) {
      console.error("Error saving order:", err);
      alert(
        "Error al guardar el orden. Asegúrate de tener la columna 'order_index' en tu tabla.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admp-container">
      <header className="admp-header">
        <Link to="/" className="admp-back-link">
          ← Volver al Inicio
        </Link>
        <h1>Panel de Administración de Promociones</h1>
      </header>

      <main className="admp-main">
        {/* Formulario de Subida */}
        {!isReordering && (
          <section className="admp-upload-section">
            <h2>Agregar Nuevas Promociones</h2>
            <form onSubmit={handleUpload} className="admp-upload-form">
              <div
                className={`admp-drop-zone ${dragActive ? "drag-active" : ""} ${
                  newImages.length > 0 ? "has-file" : ""
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="admp-file-input"
                  style={{ display: "none" }}
                />
                <div className="admp-file-msg">
                  {newImages.length > 0 ? (
                    <div className="admp-files-grid">
                      {newImages.map((img, index) => (
                        <div key={index} className="admp-file-preview-item">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Preview ${index}`}
                            className="admp-preview-thumb"
                          />
                          <div className="admp-preview-actions">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startCropping(index);
                              }}
                              className="admp-action-btn admp-crop-btn"
                              title="Recortar imagen"
                            >
                              <FaCrop />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="admp-action-btn admp-remove-btn"
                              title="Eliminar imagen"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                      <p className="admp-files-count">
                        {newImages.length} imágenes seleccionadas
                      </p>
                    </div>
                  ) : (
                    <>
                      <FaCloudUploadAlt className="admp-upload-icon" />
                      <p>
                        Arrastra tus imágenes aquí o haz clic para seleccionar
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="admp-advanced-options">
                <button
                  type="button"
                  className="admp-toggle-options-btn"
                  onClick={() => setShowColorOptions(!showColorOptions)}
                >
                  <FaPalette />{" "}
                  {showColorOptions
                    ? "Ocultar opciones de color"
                    : "Opciones de color (Fondo para todas)"}
                </button>

                {showColorOptions && (
                  <div className="admp-color-picker-wrapper admp-fade-in">
                    <label>Color de Fondo:</label>
                    <input
                      type="color"
                      value={bgColor === "transparent" ? "#ffffff" : bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setBgColor("transparent")}
                      className="admp-btn-transparent"
                    >
                      Usar Transparente
                    </button>
                    <span className="admp-color-value">{bgColor}</span>
                  </div>
                )}
              </div>

              <div className="admp-date-picker-wrapper">
                <div>
                  <label>Fecha Inicio (Colombia):</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label>Fecha Fin (Opcional):</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || newImages.length === 0}
                className="admp-btn-submit"
              >
                {uploading ? (
                  <div className="admp-loader-inline"></div>
                ) : (
                  `Subir ${newImages.length > 1 ? "Promociones" : "Promoción"}`
                )}
              </button>
            </form>
            {error && <p className="admp-error-msg">{error}</p>}
          </section>
        )}

        {/* Preview y Gestión */}
        <section className="admp-list-section">
          <div className="admp-section-header-row">
            <h2>
              {isReordering
                ? "Reordenar Promociones"
                : "Vista Previa y Gestión"}
            </h2>

            {!isReordering ? (
              <div className="admp-actions-group">
                <button
                  className="admp-btn-delete-all"
                  onClick={handleDeleteAll}
                  disabled={promotions.length === 0}
                  title="Eliminar todas las promociones"
                >
                  <FaTrash /> Eliminar Todo
                </button>
                <button
                  className="admp-btn-reorder"
                  onClick={() => setIsReordering(true)}
                  disabled={promotions.length < 2}
                >
                  <FaSort /> Gestionar Orden
                </button>
              </div>
            ) : (
              <div className="admp-reorder-actions">
                <button
                  className="admp-btn-cancel"
                  onClick={() => {
                    setIsReordering(false);
                    fetchPromotions();
                  }}
                >
                  <FaTimes /> Cancelar
                </button>
                <button className="admp-btn-save" onClick={saveOrder}>
                  <FaSave /> Guardar Orden
                </button>
              </div>
            )}
          </div>

          {!isReordering && (
            <p className="admp-section-desc">
              Así se verán tus promociones en la página pública.
            </p>
          )}

          {loading ? (
            <div className="admp-loader-container">
              <div className="admp-loader"></div>
              <p>Cargando...</p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="admp-empty-state">
              No hay promociones activas. Sube una para empezar.
            </div>
          ) : isReordering ? (
            /* VISTA DE REORDENAMIENTO (Drag & Drop) */
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="promotions-list" direction="vertical">
                {(provided) => (
                  <div
                    className="admp-reorder-grid"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {promotions.map((promo, index) => (
                      <Draggable
                        key={promo.id}
                        draggableId={promo.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`admp-reorder-item ${
                              snapshot.isDragging ? "dragging" : ""
                            }`}
                            style={{
                              ...provided.draggableProps.style,
                              backgroundColor: promo.bg_color || "#fff",
                            }}
                          >
                            <div className="admp-drag-handle">
                              <FaGripVertical />
                            </div>
                            <div className="admp-reorder-img-wrapper">
                              <img src={promo.image_url} alt="Promo" />
                            </div>
                            <div className="admp-reorder-info">
                              <div className="admp-status-badges">
                                <span
                                  className={`admp-mini-badge ${
                                    promo.active ? "active" : "inactive"
                                  }`}
                                >
                                  {promo.active ? "Visible" : "Oculta"}
                                </span>
                                <span
                                  className={`admp-promo-status-badge ${getStatusLabel(promo).class}`}
                                >
                                  {getStatusLabel(promo).label}
                                </span>
                              </div>
                              <div className="admp-date-details">
                                {promo.start_date && (
                                  <span className="admp-date-info">
                                    📅 Inicia:{" "}
                                    {new Date(promo.start_date).toLocaleString(
                                      "es-CO",
                                      {
                                        timeZone: "America/Bogota",
                                        dateStyle: "short",
                                        hour12: true,
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                )}
                                {promo.end_date && (
                                  <span className="admp-date-info">
                                    ⏰ Expira:{" "}
                                    {new Date(promo.end_date).toLocaleString(
                                      "es-CO",
                                      {
                                        timeZone: "America/Bogota",
                                        dateStyle: "short",
                                        hour12: true,
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="admp-reorder-badge">
                              {index + 1}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            /* VISTA NORMAL (Swiper) */
            <div className="admp-swiper-container">
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
                className="my-swiper admp-swiper"
              >
                {promotions.map((promo) => (
                  <SwiperSlide
                    key={promo.id}
                    style={{ backgroundColor: promo.bg_color || "transparent" }}
                    className={!promo.active ? "admp-slide-inactive" : ""}
                  >
                    <img src={promo.image_url} alt="Promoción" />

                    <div className="admp-controls-overlay">
                      <div className="admp-controls-content">
                        <div className="admp-status-group">
                          <span
                            className={`admp-status-badge ${
                              promo.active ? "active" : "inactive"
                            }`}
                          >
                            {promo.active ? "Visible" : "Oculta"}
                          </span>
                          <span
                            className={`admp-promo-status-badge ${getStatusLabel(promo).class}`}
                          >
                            {getStatusLabel(promo).label}
                          </span>
                        </div>
                        {/* Fechas de vigencia */}
                        <div className="admp-dates-info">
                          {promo.start_date && (
                            <small className="admp-date-text">
                              📅{" "}
                              {new Date(promo.start_date).toLocaleString(
                                "es-CO",
                                {
                                  timeZone: "America/Bogota",
                                  dateStyle: "short",
                                  hour12: true,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </small>
                          )}
                          {promo.end_date && (
                            <small className="admp-date-text">
                              ⏰{" "}
                              {new Date(promo.end_date).toLocaleString(
                                "es-CO",
                                {
                                  timeZone: "America/Bogota",
                                  dateStyle: "short",
                                  hour12: true,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </small>
                          )}
                          {!promo.end_date && promo.start_date && (
                            <small className="admp-date-text admp-no-expiry">
                              Sin fecha de expiración
                            </small>
                          )}
                        </div>
                        <div className="admp-control-buttons">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startCroppingPromo(promo);
                            }}
                            className="admp-control-btn admp-crop-btn"
                            title="Recortar imagen"
                          >
                            <FaCrop />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(promo.id, promo.active);
                            }}
                            className="admp-control-btn admp-toggle-btn"
                            title={promo.active ? "Ocultar" : "Mostrar"}
                          >
                            {promo.active ? <FaEyeSlash /> : <FaEye />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(promo.id);
                            }}
                            className="admp-control-btn admp-delete-btn"
                            title="Eliminar permanentemente"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </section>
        {/* Modal de Recorte */}
        {croppingImageSrc && (
          <div className="admp-crop-modal">
            <div className="admp-crop-container">
              <div className="admp-crop-area-scroll">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined} // Libre
                >
                  <img
                    ref={imgRef}
                    src={croppingImageSrc}
                    alt="Crop me"
                    onLoad={onImageLoad}
                    crossOrigin="anonymous"
                    style={{ maxWidth: "100%", maxHeight: "70vh" }}
                  />
                </ReactCrop>
              </div>
              <div className="admp-crop-controls">
                <p className="admp-crop-instructions">
                  Arrastra las esquinas para ajustar el recorte libremente.
                </p>
                <div className="admp-crop-buttons">
                  <button
                    className="admp-btn-cancel"
                    onClick={cancelCropping}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="admp-btn-save"
                    onClick={saveCroppedImage}
                    type="button"
                  >
                    Guardar Recorte
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPromociones;
