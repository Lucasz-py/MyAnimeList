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
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [upcomingRes, topRatedRes, topPopularRes] = await Promise.all([
          getUpcomingAnimes(),
          getTopAnimes(10), // Limitado a 10 para una Home más ligera
          getTopAnimes(10, 'bypopularity')
        ]);

        const currentMonth = upcomingRes.data.filter(anime => 
          anime.aired?.from?.startsWith('2026-04')
        );
        setUpcoming(currentMonth);
        setTopRated(topRatedRes.data);
        setTopPopular(topPopularRes.data);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchHomeData();
  }, []);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      // 1. Marquesina infinita de estrenos
      if (marqueeRef.current && upcoming.length > 0) {
        const totalWidth = marqueeRef.current.scrollWidth / 2;
        gsap.to(marqueeRef.current, {
          x: -totalWidth,
          duration: 70, 
          ease: "none",
          repeat: -1,
        });
      }

      // 2. Animación de revelado para el contenido interno
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

      // 3. COREOGRAFÍA DE OLAS CURVAS (Transiciones entre secciones)
      // Aplicamos el efecto a las 3 secciones principales para que se "devoren" entre sí
      ['.estrenos-section', '.top-rated-section', '.top-popular-section'].forEach((selector) => {
        gsap.fromTo(selector,
          { 
            borderTopLeftRadius: '50% 150px', 
            borderTopRightRadius: '50% 150px',
            y: 150, 
          },
          {
            borderTopLeftRadius: '0% 0px', 
            borderTopRightRadius: '0% 0px',
            y: 0,   
            scrollTrigger: {
              trigger: selector,
              start: 'top 95%', 
              end: 'top 10%',   
              scrub: 1,         
            }
          }
        );
      });

    }, mainRef);

    return () => ctx.revert();
  }, [upcoming, topRated, topPopular]);

  return (
    <div ref={mainRef} className="block font-sans bg-[#1C1C1C] overflow-hidden relative w-full">
      
      {/* 1. HERO: CANVAS + TÍTULO DESPLAZADO */}
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
                HARMONIA
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

      {/* 2. SECCIÓN: ESTRENOS DE TEMPORADA */}
      <section className="estrenos-section reveal-section pt-32 pb-48 relative z-20 bg-[#1C1C1C] -mt-[150px]">
        <div className="section-content">
          <div className="container mx-auto px-4 mb-10">
            <h2 className="text-3xl font-black text-white flex items-center gap-4">
              Estrenos de Temporada
              <span className="bg-[#D6685A] text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-[0_0_15px_rgba(214,104,90,0.5)]">Abril 2026</span>
            </h2>
          </div>

          {upcoming.length > 0 && (
            <div className="relative flex overflow-hidden">
              <div ref={marqueeRef} className="flex gap-6 whitespace-nowrap pl-6">
                {[...upcoming, ...upcoming].map((anime, index) => (
                  <div key={`${anime.mal_id}-${index}`} className="inline-block w-64 whitespace-normal shrink-0">
                    <AnimeCard anime={anime} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. SECCIÓN: TOP 10 SERIES (Mejor Valoradas) */}
      <section className="top-rated-section pt-32 pb-32 px-4 relative z-30 bg-[#0a0a0a] -mt-[120px]">
        <div className="container mx-auto max-w-[900px]">
          <h2 className="text-4xl font-black text-white mb-16 border-b border-neutral-800 pb-6">
            Top 10 Series <span className="text-[#D6685A]">★</span>
          </h2>
          
          <div className="flex flex-col gap-6">
            {topRated.map((anime, index) => (
              <RankingRow key={anime.mal_id} anime={anime} index={index} />
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Link 
              to="/top/rated" 
              className="px-10 py-4 rounded-full border border-white/10 bg-white/5 text-white font-bold uppercase tracking-widest text-xs hover:bg-[#D6685A] hover:border-[#D6685A] transition-all"
            >
              Explorar Ranking Completo
            </Link>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN: MÁS POPULARES */}
      <section className="top-popular-section pt-32 pb-32 px-4 relative z-40 bg-[#141414] -mt-[120px]">
        <div className="container mx-auto max-w-[900px]">
          <h2 className="text-4xl font-black text-white mb-16 border-b border-neutral-800 pb-6">
            Más Populares <span className="text-[#D6685A]">🔥</span>
          </h2>
          
          <div className="flex flex-col gap-6">
            {topPopular.map((anime, index) => (
              <RankingRow key={anime.mal_id} anime={anime} index={index} />
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Link 
              to="/top/popular" 
              className="px-10 py-4 rounded-full border border-white/10 bg-white/5 text-white font-bold uppercase tracking-widest text-xs hover:bg-[#D6685A] hover:border-[#D6685A] transition-all"
            >
              Explorar Ranking Completo
            </Link>
          </div>
        </div>
      </section>
      
    </div>
  );
};

// COMPONENTE DE FILA (RankingRow) - Única Columna y Portadas Grandes
export const RankingRow = ({ anime, index }: { anime: Anime, index: number }) => (
  <Link
    to={`/anime/${anime.mal_id}`}
    className="group flex bg-neutral-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-[#D6685A]/40 hover:shadow-[0_0_40px_rgba(214,104,90,0.1)] transition-all duration-500 h-auto"
  >
    {/* Número de Ranking */}
    <div className="w-16 md:w-24 flex items-center justify-center bg-black/20 text-neutral-700 font-black text-2xl md:text-4xl group-hover:text-[#D6685A] transition-colors border-r border-white/5">
      {index + 1}
    </div>
    
    {/* Portada Grande */}
    <div className="w-32 md:w-44 h-48 md:h-60 overflow-hidden shrink-0">
      <img 
        src={anime.images.jpg.image_url} 
        alt={anime.title} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
      />
    </div>
    
    {/* Info del Anime */}
    <div className="p-6 md:p-8 flex flex-col justify-center flex-1 min-w-0">
      <h3 className="text-white text-xl md:text-2xl font-bold truncate mb-3 group-hover:text-[#D6685A] transition-colors">
        {anime.title}
      </h3>

      {/* Géneros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {anime.genres?.slice(0, 3).map(genre => (
          <span 
            key={genre.mal_id} 
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-white/5 text-neutral-400 rounded-md border border-white/5"
          >
            {genre.name}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <span className="text-neutral-500 text-xs font-bold uppercase tracking-[0.1em]">
          {anime.episodes ? `${anime.episodes} Episodios` : 'En Emisión'}
        </span>
        
        {/* Rating Badge */}
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
          <span className="text-[#D6685A] text-sm">★</span>
          <span className="text-white font-black text-sm">{anime.score}</span>
        </div>
      </div>
    </div>
  </Link>
);