import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  // Extraemos la ruta actual (ej: '/profile', '/search')
  const { pathname } = useLocation();

  useEffect(() => {
    // Cada vez que 'pathname' cambie, ejecutamos esto:
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // Le da un toque suave y premium al subir
    });
  }, [pathname]);

  // Este componente es puramente lógico, no renderiza nada visual en el HTML
  return null;
};