import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaSpinner } from "react-icons/fa";
import { ActivityTracker } from "./ActivityTracker"; // 🛑 AÑADIR ESTA LÍNEA

const RutaProtegida = () => {
  const [autorizado, setAutorizado] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const verificarSesion = async () => {
      setLoading(true); // Verifica la existencia del token en localStorage

      const token = localStorage.getItem("token");
      const expiration = localStorage.getItem("session_expiration");
      
      // Bloque que detecta sesión inválida/expirada, limpia todo y cierra la sesión de Supabase
      if (!token || !expiration || Date.now() >= Number(expiration)) {
        console.log("Sesión no válida o expirada. Redirigiendo a login.");
        localStorage.clear();
        sessionStorage.clear();
        await supabase.auth.signOut(); // Esto dispara el evento SIGNED_OUT
        setAutorizado(false);
        setLoading(false);
        return;
      } 
      
      // Verificaciones de autorización (sin cambios, ya que estaban bien)
      const rutas = JSON.parse(
        localStorage.getItem("rutas_permitidas") || "[]"
      );
      const redirect = localStorage.getItem("redirect_usuario");
      const dashboardRoutes = [
        "/dashboard",
        "/dashboardgastos",
        "/dashboardpostulaciones",
        "/dashboardtransporte",
        "/dashboardFruver",
        "/mantenimiento",
        "/historial-general",
        "/observacionesph",
        "/programador-horarios",
      ];

      let esRutaPermitida = currentPath === redirect;
      if (!esRutaPermitida) {
        esRutaPermitida = dashboardRoutes.some((rutaBase) =>
          currentPath.startsWith(rutaBase)
        );
      }
      if (!esRutaPermitida) {
        esRutaPermitida = rutas.some((r) => currentPath.startsWith(r.path));
      }

      setAutorizado(esRutaPermitida);
      setLoading(false);
    };
    
    verificarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // 🐛 SOLUCIÓN AL BUCLE: 
      // Si se dispara SIGNED_OUT (porque verificarSesion lo llamó), 
      // simplemente forzamos la no autorización. 
      // El componente ya se encargará de la redirección con <Navigate to="/login" />
      if (event === "SIGNED_OUT") {
        setAutorizado(false);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED") {
        // En caso de refresh de token, aún queremos re-verificar permisos por seguridad
        verificarSesion();
      }
    });

    return () => subscription?.unsubscribe();
  }, [location.pathname]); 

  if (loading) {
    return (
      <div className="adm-maint-loading-overlay">
        <FaSpinner className="adm-maint-spinner" />      
        <p style={{ color: "#333", marginTop: "10px" }}>
          Verificando autenticación...
        </p>
      </div>
    );
  }

  if (!autorizado) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <ActivityTracker /> {/* 🛑 AÑADIR ESTA LÍNEA */}
      <Outlet />
    </>
  );
};

export default RutaProtegida;