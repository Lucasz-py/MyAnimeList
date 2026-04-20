import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingAnimes, getTopAnimes } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import { AnimeCard } from '../components/AnimeCard'; 
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AnimeScrollCanvas } from '../ui/AnimeScrollCanvas';

gsap.registerPlugin(ScrollTrigger);

const cyberClipCard = { clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' };

export const Home = () => {
  const [upcoming, setUpcoming] = useState<Anime[]>([]);
  const [topRated, setTopRated] = useState<Anime[]>([]);
  const [topPopular, setTopPopular] = useState<Anime[]>([]);
  
  // --- ESTADOS DE PANTALLA DE CARGA ---
  const [apiLoaded, setApiLoaded] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  
  const mainRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const isHovered = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);
  
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  // 1. Cargar Datos de la API
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [upcomingRes, topRatedRes, topPopularRes] = await Promise.all([
          getUpcomingAnimes(),
          getTopAnimes(10),
          getTopAnimes(10, 'bypopularity')
        ]);

        setUpcoming(upcomingRes.data);
        setTopRated(topRatedRes.data);
        setTopPopular(topPopularRes.data);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setApiLoaded(true); // API Lista
      }
    };
    fetchHomeData();

    // 2. Pre-cargar el primer frame del fondo para asegurar que el canvas no se vea en negro
    const firstFrame = new Image();
    firstFrame.src = '/sequence/frame_0001.webp'; // Asegúrate de que este nombre coincida con tu primer frame
    firstFrame.onload = () => setBgLoaded(true);  // Imagen Lista
    firstFrame.onerror = () => setBgLoaded(true); // Fallback de seguridad
  }, []);

  // Animación del Loader cuando todo está listo
  useGSAP(() => {
    if (apiLoaded && bgLoaded) {
      gsap.to('.cyber-loader', {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        delay: 0.6, // Pequeña pausa para que el usuario lea "SYSTEM_READY"
        onComplete: () => setIsBooting(false)
      });
    }
  }, [apiLoaded, bgLoaded]);

  // Animaciones de las secciones (solo inician si ya terminó el loader)
  useGSAP(() => {
    if (isBooting) return; // No animar contenido oculto

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('.reveal-section');
      sections.forEach((section) => {
        const content = section.querySelector('.section-content');
        if (content) {
          gsap.fromTo(content,
            { y: 80, opacity: 0, filter: 'blur(15px)' },
            {
              y: 0, opacity: 1, filter: 'blur(0px)',
              scrollTrigger: {
                trigger: section,
                start: 'top 85%', 
                end: 'top 40%',
                scrub: 1,
              },
              ease: 'power2.out'
            }
          );
        }
      });

      ['.estrenos-section', '.rankings-section'].forEach((selector) => {
        gsap.fromTo(selector,
          { borderTopLeftRadius: '50% 150px', borderTopRightRadius: '50% 150px', y: 150 },
          { borderTopLeftRadius: '0% 0px', borderTopRightRadius: '0% 0px', y: 0,   
            scrollTrigger: { trigger: selector, start: 'top 95%', end: 'top 10%', scrub: 1 }
          }
        );
      });

    }, mainRef);

    return () => ctx.revert();
  }, [upcoming, topRated, topPopular, isBooting]);

  useEffect(() => {
    let animationId: number;
    
    const scrollStep = () => {
      if (carouselRef.current && !isDragging.current && !isHovered.current) {
         carouselRef.current.scrollLeft += 1; 
         
         if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2) {
           carouselRef.current.scrollLeft = 0;
         }
      }
      animationId = requestAnimationFrame(scrollStep);
    };

    if (upcoming.length > 0 && !isBooting) {
      animationId = requestAnimationFrame(scrollStep);
    }

    return () => cancelAnimationFrame(animationId);
  }, [upcoming, isBooting]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeftPos.current = carouselRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current);

    if (Math.abs(walk) > 5) {
      if (!isDraggingUI) setIsDraggingUI(true);
      e.preventDefault(); 
      carouselRef.current.scrollLeft = scrollLeftPos.current - (walk * 2);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setTimeout(() => setIsDraggingUI(false), 50);
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    setIsDraggingUI(false);
    isHovered.current = false; 
  };

  const handleMouseEnter = () => {
    isHovered.current = true; 
  };

  return (
    <>
      {/* PANTALLA DE CARGA (BOOT SEQUENCE) */}
      {isBooting && (
        <div className="cyber-loader fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center font-mono">
          
          {/* Esquinas decorativas Cyber */}
          <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50"></div>
          <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50"></div>
          <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50"></div>
          <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50"></div>
          
          <div className="flex flex-col items-center gap-8 z-10">
            {/* Círculo Animado de Carga */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-cyan-400 animate-[spin_1.5s_linear_infinite] shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
              <div className="absolute inset-3 rounded-full border-l-2 border-r-2 border-blue-500 animate-[spin_2s_linear_infinite_reverse]"></div>
              <div className="text-cyan-400 font-black text-2xl animate-pulse drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                {apiLoaded && bgLoaded ? '100%' : '...'}
              </div>
            </div>
            
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-cyan-400 text-3xl md:text-4xl font-black tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                KIROKU
              </h2>
              
              {/* Textos de estado */}
              <p className="text-slate-400 text-xs md:text-sm tracking-[0.2em] uppercase h-4 font-bold">
                {!apiLoaded 
                  ? '> LOANDING...' 
                  : !bgLoaded 
                  ? '> LOADING...' 
                  : '> SYSTEM_READY'}
              </p>
              
              {/* Barra de progreso */}
              <div className="w-64 md:w-80 h-1.5 bg-slate-900 mt-6 overflow-hidden mx-auto" style={cyberClipCard}>
                <div 
                  className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" 
                  style={{ width: `${(apiLoaded ? 50 : 0) + (bgLoaded ? 50 : 0)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL DE LA PÁGINA */}
      <div ref={mainRef} className="block font-sans bg-slate-950 overflow-hidden relative w-full">
        
        <AnimeScrollCanvas 
          totalFrames={89} 
          baseUrl="/sequence/" 
          framePrefix="frame_"
          fileExtension=".webp" 
          padLength={4} 
          scrollDistance="400vh" 
        >
          <div className="w-full h-full flex flex-col justify-center items-start pl-6 md:pl-16 lg:pl-[8vw] relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6 opacity-90">
                <span className="w-10 h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
              </div>
              
              <h1 className="flex flex-col gap-2 mb-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <span className="text-3xl md:text-4xl lg:text-5xl font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                  Welcome To
                </span>
                <span className="text-6xl md:text-8xl lg:text-[8.5rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 tracking-tighter leading-[0.85] uppercase mt-1">
                  KIROKU
                </span>
              </h1>
              
              <Link 
                to="/search" 
                className="group relative inline-flex items-center gap-6 px-4 py-3 bg-slate-900 border border-cyan-500/50 hover:bg-cyan-500 transition-colors duration-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                style={cyberClipCard}
              >
                <div className="flex items-center justify-center w-10 h-10 bg-slate-950 transition-colors duration-500 group-hover:bg-slate-900 shadow-inner" style={cyberClipCard}>
                  <svg className="w-5 h-5 text-cyan-400 transform transition-transform duration-500 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <span className="text-white font-bold tracking-[0.2em] text-xs md:text-sm uppercase transition-colors duration-300 group-hover:text-slate-950 pr-4">
                  Iniciar Búsqueda
                </span>
              </Link>
            </div>
          </div>
        </AnimeScrollCanvas>

        <section className="estrenos-section reveal-section pt-32 pb-48 relative z-20 bg-slate-900 -mt-[150px]">
          <div className="section-content">
            <div className="container mx-auto px-4 mb-10">
              <h2 className="text-3xl font-black text-white flex items-center gap-4">
                Estrenos de Temporada
                <span className="bg-cyan-500 text-slate-950 text-xs px-4 py-1.5 font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]" style={cyberClipCard}>Primavera 2026</span>
              </h2>
            </div>

            {upcoming.length > 0 && (
              <div className="relative w-full">
                <div 
                  ref={carouselRef}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseEnter={handleMouseEnter}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  className={`flex gap-6 overflow-x-auto px-6 pb-8 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transition-all ${isDraggingUI ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                  {[...upcoming, ...upcoming].map((anime, index) => (
                    <div 
                      key={`${anime.mal_id}-${index}`} 
                      className={`inline-block w-64 shrink-0 transition-transform duration-300 ${isDraggingUI ? 'pointer-events-none scale-[0.98] opacity-80' : ''}`}
                    >
                      <AnimeCard anime={anime} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rankings-section pt-32 pb-32 px-4 relative z-30 bg-slate-950 -mt-[120px]">
          <div className="container mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-20">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-12 border-b border-slate-800 pb-6">
                  Top 10 Series <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">★</span>
                </h2>
                <div className="flex flex-col gap-6">
                  {topRated.map((anime, index) => (
                    <RankingRow key={anime.mal_id} anime={anime} index={index} />
                  ))}
                </div>
                <div className="mt-12 flex justify-center">
                  <Link to="/top/rated" className="px-8 py-4 border border-cyan-500/30 bg-slate-900 text-cyan-50 font-bold uppercase tracking-widest text-xs hover:bg-cyan-500 hover:text-slate-950 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all" style={cyberClipCard}>
                    Explorar Ranking Completo
                  </Link>
                </div>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-12 border-b border-slate-800 pb-6">
                  Más Populares <span className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">🔥</span>
                </h2>
                <div className="flex flex-col gap-6">
                  {topPopular.map((anime, index) => (
                    <RankingRow key={anime.mal_id} anime={anime} index={index} />
                  ))}
                </div>
                <div className="mt-12 flex justify-center">
                  <Link to="/top/popular" className="px-8 py-4 border border-cyan-500/30 bg-slate-900 text-cyan-50 font-bold uppercase tracking-widest text-xs hover:bg-cyan-500 hover:text-slate-950 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all" style={cyberClipCard}>
                    Explorar Ranking Completo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

const getRankContainerStyle = (index: number) => {
  switch (index) {
    case 0: return "bg-gradient-to-br from-cyan-900 to-slate-950 text-cyan-400 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]";
    case 1: return "bg-gradient-to-br from-slate-800 to-slate-950 text-slate-300 border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.4)]";
    case 2: return "bg-gradient-to-br from-amber-900 to-slate-950 text-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]";
    case 3: return "bg-slate-950 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]";
    case 4: return "bg-slate-950 text-teal-400 border-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.2)]";
    default: return "bg-slate-950 text-slate-500 border-slate-800";
  }
};

export const RankingRow = ({ anime, index }: { anime: Anime, index: number }) => (
  <Link
    to={`/anime/${anime.mal_id}`}
    className="group flex bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 h-auto shadow-sm"
    style={cyberClipCard}
  >
    <div className={`w-14 md:w-20 flex items-center justify-center font-black text-xl md:text-2xl border-r transition-all shrink-0 ${getRankContainerStyle(index)}`}>
      {index + 1}
    </div>
    <div className="w-24 md:w-36 h-36 md:h-48 overflow-hidden shrink-0 bg-slate-900 border-r border-slate-800 relative">
      <img src={anime.images.jpg.image_url} alt={anime.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-950/50"></div>
    </div>
    <div className="p-4 md:p-6 flex flex-col justify-center flex-1 min-w-0 bg-slate-900/40">
      <h3 className="text-white text-lg md:text-xl font-bold truncate mb-2 group-hover:text-cyan-400 transition-colors">{anime.title}</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {anime.genres?.slice(0, 2).map(genre => (
          <span key={genre.mal_id} className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-950 text-slate-400 border border-slate-700/50" style={cyberClipCard}>
            {genre.name}
          </span>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-auto">
        <span className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.1em]">
          {anime.episodes ? `${anime.episodes} Episodios` : 'En Emisión'}
        </span>
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 border border-slate-800 w-fit group-hover:border-cyan-500/30 transition-colors" style={cyberClipCard}>
          <span className="text-cyan-400 text-[10px]">★</span>
          <span className="text-white font-black text-[11px] md:text-sm">{anime.score || 'N/A'}</span>
        </div>
      </div>
    </div>
  </Link>
);