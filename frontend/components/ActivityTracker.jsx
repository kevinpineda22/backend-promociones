import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, supabaseQuery } from '../supabaseClient';

const HEARTBEAT_INTERVAL = 30000;

export const ActivityTracker = () => {
  const location = useLocation();
  const lastSentRoute = useRef(null);
  const isOffline = useRef(false);

  const sendActivityState = useCallback(async (isActive, currentPath) => {
    try {
      const { data: authData } = await supabaseQuery(() => supabase.auth.getUser());
      const userId = authData?.user?.id;
      const userName = JSON.parse(localStorage.getItem('empleado_info') || '{}').nombre;
      
      if (!userId || !userName) return;

      // 🚀 OPTIMIZACIÓN: Solo enviar si la ruta cambió o cada 5 minutos
      const now = Date.now();
      const shouldSend = 
        lastSentRoute.current !== currentPath || 
        (now - (lastSentRoute.current?.timestamp || 0)) > 300000; // 5 min

      if (!shouldSend && isActive) return;

      const payload = {
        user_id: userId,
        user_name: userName,
        current_route: currentPath,
        is_active: isActive,
        last_active_at: new Date().toISOString(),
      };

      await supabase.from('user_activity').upsert(payload);
      
      lastSentRoute.current = { path: currentPath, timestamp: now };
      isOffline.current = false;
      
    } catch (error) {
      console.warn('ActivityTracker: Error de red, reintentará después', error);
      isOffline.current = true;
    }
  }, []);

  useEffect(() => {
    const sendHeartbeat = () => {
      if (document.visibilityState === 'visible') {
        sendActivityState(true, location.pathname);
      }
    };

    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendActivityState(false, location.pathname);
      } else {
        sendActivityState(true, location.pathname);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    sendActivityState(true, location.pathname);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setTimeout(() => {
        sendActivityState(false, location.pathname);
      }, 100);
    };
  }, [location.pathname, sendActivityState]);

  return null; // No renderiza nada
};
