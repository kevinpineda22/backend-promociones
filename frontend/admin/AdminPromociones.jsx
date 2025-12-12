import React, { useState, useEffect } from "react";
import "./AdminPromociones.css";

const AdminPromociones = () => {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Ajusta esta URL si tu backend corre en otro puerto o dominio
  const API_URL = "https://backend-promociones.vercel.app/api/promociones";

  useEffect(() => {
    fetchPromociones();
  }, []);

  const fetchPromociones = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Error al cargar promociones");
      const data = await response.json();
      setPromociones(data);
    } catch (error) {
      console.error(error);
      alert("Error al cargar las promociones");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Selecciona una imagen primero");

    const formData = new FormData();
    formData.append("image", selectedFile);

    setUploading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Error al subir imagen");

      const newPromo = await response.json();
      setPromociones([newPromo, ...promociones]);
      setSelectedFile(null);
      // Limpiar input file
      document.getElementById("fileInput").value = "";
    } catch (error) {
      console.error(error);
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta promoción?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");

      setPromociones(promociones.filter((p) => p.id !== id));
    } catch (error) {
      console.error(error);
      alert("Error al eliminar la promoción");
    }
  };

  return (
    <div className="admin-promociones-container">
      <h2>Administrar Promociones</h2>

      <div className="admin-promociones-upload-section">
        <h3>Subir Nueva Promoción</h3>
        <form onSubmit={handleUpload} className="admin-promociones-upload-form">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button type="submit" disabled={uploading || !selectedFile}>
            {uploading ? "Subiendo..." : "Subir Imagen"}
          </button>
        </form>
      </div>

      <div className="admin-promociones-grid">
        {loading ? (
          <p>Cargando...</p>
        ) : promociones.length === 0 ? (
          <p>No hay promociones activas.</p>
        ) : (
          promociones.map((promo) => (
            <div key={promo.id} className="admin-promociones-card">
              <img src={promo.image_url} alt="Promoción" />
              <button
                className="admin-promociones-delete-btn"
                onClick={() => handleDelete(promo.id)}
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPromociones;
