/**
 * Configuración de CORS para el servidor
 */
export const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
