import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Usamos la Service Role Key para tener acceso de escritura total en el backend
const supabaseKey = process.env.SUPABASE_KEY;

// Cliente Axios para PostgREST (Base de Datos)
export const supabaseAxios = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Función para conectar a la base de datos (verificación)
export const connectDatabase = async () => {
  try {
    // Hacer una petición simple para verificar la conexión
    const response = await supabaseAxios.get("/");
    console.log("✅ Conexión a Supabase exitosa");
    console.log(`📍 URL: ${supabaseUrl}`);
  } catch (err) {
    console.error("❌ Error de conexión a Supabase:", err.message);
    console.error("Verifica las credenciales de Supabase en el archivo .env");
    // No hacemos process.exit(1) para que Vercel no falle en el despliegue
  }
};
