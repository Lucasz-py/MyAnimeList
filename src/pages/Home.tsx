import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingAnimes } from '../services/jikanApi';
import type{ Anime } from '../types/anime';
import gsap from 'gsap';

export const Home = () => {
  const [upcoming, setUpcoming] = useState<Anime[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const response = await getUpcomingAnimes();
        // Filtramos: Animes que se estrenan en Abril 2026 (2026-04)
        // Y que tengan estado "Not yet aired" o fecha de hoy en adelante
        const currentMonth = response.data.filter(anime => 
          anime.aired?.from?.startsWith('2026-04')
        );
        setUpcoming(currentMonth);
      } catch (error) {
        console.error("Error cargando estrenos:", error);
      }
    };
    fetchUpcoming();
  }, []);

  // Animación GSAP para el scroll infinito
  useEffect(() => {
    if (upcoming.length > 0 && scrollRef.current) {
      const element = scrollRef.current;
      // Calculamos la mitad exacta porque duplicamos los elementos en el render
      const totalWidth = element.scrollWidth / 2;

      const animation = gsap.to(element, {
        x: -totalWidth,
        duration: 50, // Aumentamos de 20 a 50 para que vaya mucho más lento
        ease: "none",
        repeat: -1,
      });

      // Agregamos llaves para que la función retorne 'void' y TypeScript no se queje
      return () => {
        animation.kill();
      };
    }
  }, [upcoming]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-20 text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://cdn.pixabay.com/photo/2021/11/04/06/27/binary-code-6767511_1280.jpg')] bg-cover bg-center"></div>

        <div className="z-10 bg-slate-950/80 p-10 rounded-lg border border-cyan-900 backdrop-blur-sm">
          <h1 className="text-4xl font-bold mb-4 text-cyan-50 text-neon-cyan">
            MY::A.T. DATACENTER
          </h1>
          <p className="text-md text-slate-400 mb-10 max-w-xl font-mono">
            {"[root@tracker] > GESTIONA TU COLECCIÓN_"}
            <br />
            {"[root@tracker] > CALCULA TIEMPO INVERTIDO_"}
          </p>
          
          <Link 
            to="/search" 
            className="px-8 py-3 bg-fuchsia-600 text-cyan-50 font-semibold rounded-lg hover:bg-fuchsia-800 transition-colors border border-fuchsia-400 tracking-wider"
          >
            {"// COMENZAR_REGISTRO.EXE"}
          </Link>
        </div>
      </section>

      {/* Sección Animes por Estrenar (Marquee) */}
      <section className="py-12 bg-slate-900/50 border-y border-cyan-900 overflow-hidden">
        <h2 className="container mx-auto px-4 text-xl font-bold mb-6 text-fuchsia-400 flex items-center gap-2">
          <span className="animate-pulse">●</span> ANIMES_POR_ESTRENAR :: ABRIL_2026
        </h2>

        <div className="relative flex overflow-hidden group">
          {/* Contenedor que animamos con GSAP */}
          <div ref={scrollRef} className="flex gap-6 whitespace-nowrap">
            {/* Renderizamos la lista dos veces para el efecto infinito */}
            {[...upcoming, ...upcoming].map((anime, index) => (
              <div 
                key={`${anime.mal_id}-${index}`} 
                className="inline-block w-48 border border-cyan-900 bg-slate-950 rounded-md overflow-hidden hover:border-fuchsia-500 transition-colors"
              >
                <img 
                  src={anime.images.jpg.image_url} 
                  alt={anime.title} 
                  className="w-full h-60 object-cover grayscale hover:grayscale-0 transition-all"
                />
                <div className="p-2">
                  <p className="text-[10px] text-cyan-400 truncate font-bold">{anime.title}</p>
                  <p className="text-[9px] text-slate-500 font-mono">ESTRENO: {anime.aired?.from?.split('T')[0] || 'TBA'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};