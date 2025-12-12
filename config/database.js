import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan credenciales de Supabase en .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const connectDatabase = async () => {
  try {
    const { data, error } = await supabase
      .from("promociones")
      .select("count", { count: "exact", head: true });
    if (error) throw error;
    console.log("✅ Conexión a Supabase exitosa");
  } catch (err) {
    console.error("❌ Error de conexión a Supabase:", err.message);
  }
};
