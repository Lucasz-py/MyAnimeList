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

export const Home = () => {
  const [upcoming, setUpcoming] = useState<Anime[]>([]);
  const [topRated, setTopRated] = useState<Anime[]>([]);
  const [topPopular, setTopPopular] = useState<Anime[]>([]);
  
  const mainRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const isHovered = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);
  
  // Estado para bloquear clics solo cuando realmente se arrastra
  const [isDraggingUI, setIsDraggingUI] = useState(false);

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
      }
    };
    fetchHomeData();
  }, []);

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

    if (upcoming.length > 0) {
      animationId = requestAnimationFrame(scrollStep);
    }

    return () => cancelAnimationFrame(animationId);
  }, [upcoming]);

  useGSAP(() => {
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
  }, [upcoming, topRated, topPopular]);

  // --- CONTROLADORES DEL MOUSE CORREGIDOS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    // Solo iniciamos el rastreo, pero NO marcamos como "arrastrando" todavía
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeftPos.current = carouselRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current);

    // SOLUCIÓN: Solo activamos el bloqueo visual y de clics si se mueve más de 5px
    if (Math.abs(walk) > 5) {
      if (!isDraggingUI) setIsDraggingUI(true);
      e.preventDefault(); 
      carouselRef.current.scrollLeft = scrollLeftPos.current - (walk * 2);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    // Agregamos un pequeño delay para permitir que el evento de clic se complete
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
    <div ref={mainRef} className="block font-sans bg-[#1C1C1C] overflow-hidden relative w-full">
      
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
              <span className="w-10 h-[2px] bg-[#D6685A]"></span>
              <span className="text-[10px] md:text-xs font-mono text-[#D6685A] uppercase tracking-[0.3em]">
                System Override // v2.0
              </span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-black text-white tracking-tighter leading-[0.85] mb-10">
              WELCOME TO <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-500">
                KIROKU
              </span>
            </h1>
            
            <Link 
              to="/search" 
              className="group relative inline-flex items-center gap-6 px-1.5 py-1.5 pr-8 bg-white/5 border border-white/10 backdrop-blur-lg rounded-full overflow-hidden transition-all duration-500 hover:bg-white/10"
            >
              <div className="flex items-center justify-center w-12 h-12 md:w-14 h-14 rounded-full bg-gradient-to-br from-[#D6685A] to-[#b04d41] transition-transform duration-500 group-hover:scale-105 shadow-inner">
                <svg className="w-5 h-5 text-white transform transition-transform duration-500 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <span className="text-white font-bold tracking-[0.2em] text-xs md:text-sm uppercase transition-colors duration-300 group-hover:text-[#D6685A]">
                Iniciar Búsqueda
              </span>
            </Link>
          </div>
        </div>
      </AnimeScrollCanvas>

      <section className="estrenos-section reveal-section pt-32 pb-48 relative z-20 bg-[#1C1C1C] -mt-[150px]">
        <div className="section-content">
          <div className="container mx-auto px-4 mb-10">
            <h2 className="text-3xl font-black text-white flex items-center gap-4">
              Estrenos de Temporada
              <span className="bg-[#D6685A] text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-[0_0_15px_rgba(214,104,90,0.5)]">Primavera 2026</span>
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

      <section className="rankings-section pt-32 pb-32 px-4 relative z-30 bg-[#0a0a0a] -mt-[120px]">
        <div className="container mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-12 border-b border-neutral-800 pb-6">
                Top 10 Series <span className="text-[#D6685A]">★</span>
              </h2>
              <div className="flex flex-col gap-6">
                {topRated.map((anime, index) => (
                  <RankingRow key={anime.mal_id} anime={anime} index={index} />
                ))}
              </div>
              <div className="mt-12 flex justify-center">
                <Link to="/top/rated" className="px-8 py-4 rounded-full border border-white/10 bg-white/5 text-white font-bold uppercase tracking-widest text-xs hover:bg-[#D6685A] hover:border-[#D6685A] transition-all">
                  Explorar Ranking Completo
                </Link>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-12 border-b border-neutral-800 pb-6">
                Más Populares <span className="text-[#D6685A]">🔥</span>
              </h2>
              <div className="flex flex-col gap-6">
                {topPopular.map((anime, index) => (
                  <RankingRow key={anime.mal_id} anime={anime} index={index} />
                ))}
              </div>
              <div className="mt-12 flex justify-center">
                <Link to="/top/popular" className="px-8 py-4 rounded-full border border-white/10 bg-white/5 text-white font-bold uppercase tracking-widest text-xs hover:bg-[#D6685A] hover:border-[#D6685A] transition-all">
                  Explorar Ranking Completo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const RankingRow = ({ anime, index }: { anime: Anime, index: number }) => (
  <Link
    to={`/anime/${anime.mal_id}`}
    className="group flex bg-neutral-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-[#D6685A]/40 hover:shadow-[0_0_40px_rgba(214,104,90,0.1)] transition-all duration-500 h-auto"
  >
    <div className="w-16 md:w-20 flex items-center justify-center bg-black/20 text-neutral-700 font-black text-xl md:text-3xl group-hover:text-[#D6685A] transition-colors border-r border-white/5 shrink-0">
      {index + 1}
    </div>
    <div className="w-28 md:w-36 h-40 md:h-48 overflow-hidden shrink-0">
      <img src={anime.images.jpg.image_url} alt={anime.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
    </div>
    <div className="p-5 md:p-6 flex flex-col justify-center flex-1 min-w-0">
      <h3 className="text-white text-lg md:text-xl font-bold truncate mb-2 group-hover:text-[#D6685A] transition-colors">{anime.title}</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {anime.genres?.slice(0, 2).map(genre => (
          <span key={genre.mal_id} className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/5 text-neutral-400 rounded-md border border-white/5">{genre.name}</span>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-auto">
        <span className="text-neutral-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.1em]">{anime.episodes ? `${anime.episodes} Episodios` : 'En Emisión'}</span>
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5 shadow-inner w-fit">
          <span className="text-[#D6685A] text-xs">★</span>
          <span className="text-white font-black text-xs md:text-sm">{anime.score}</span>
        </div>
      </div>
    </div>
  </Link>
);