/**
 * Middleware para manejo de errores globales
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Error no manejado:", err.stack);

  res.status(err.status || 500).json({
    mensaje: err.message || "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

/**
 * Middleware para rutas no encontradas
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    mensaje: "Ruta no encontrada",
    ruta: req.originalUrl,
  });
};
