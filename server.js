import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Importar configuraciones y middleware
import { connectDatabase } from "./config/database.js";
import { corsOptions } from "./middleware/cors.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Importar rutas
import promocionesRoutes from "./routes/promocionesRoutes.js";

// Configuración inicial
dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

// Middleware global
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.json({
    message: "API de Promociones está corriendo.",
    status: "active",
  });
});

// Rutas de la API
app.use("/api/promociones", promocionesRoutes);

// Middleware de manejo de errores (debe ir al final)
app.use(notFoundHandler);
app.use(errorHandler);

// Verificar conexión a Supabase (sin bloquear el inicio)
connectDatabase();

// Iniciar servidor solo en desarrollo
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
}

export default app;
