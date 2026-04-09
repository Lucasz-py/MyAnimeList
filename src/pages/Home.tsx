import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingAnimes, getTopAnimes } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import { AnimeCard } from '../components/AnimeCard'; 
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimeScrollCanvas } from '../ui/AnimeScrollCanvas';

gsap.registerPlugin(ScrollTrigger);

export const Home = () => {
  const [upcoming, setUpcoming] = useState<Anime[]>([]);
  const [topAnimes, setTopAnimes] = useState<Anime[]>([]);
  
  const mainRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [upcomingRes, topRes] = await Promise.all([
          getUpcomingAnimes(),
          getTopAnimes(20)
        ]);

        const currentMonth = upcomingRes.data.filter(anime => 
          anime.aired?.from?.startsWith('2026-04')
        );
        setUpcoming(currentMonth);
        setTopAnimes(topRes.data);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      if (marqueeRef.current && upcoming.length > 0) {
        const totalWidth = marqueeRef.current.scrollWidth / 2;
        gsap.to(marqueeRef.current, {
          x: -totalWidth,
          duration: 70, 
          ease: "none",
          repeat: -1,
        });
      }

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

      // Animación de la onda negra sólida del Top 20
      gsap.fromTo('.top20-section',
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
            trigger: '.top20-section',
            start: 'top 95%', 
            end: 'top 10%',   
            scrub: 1,         
          }
        }
      );

      gsap.fromTo('.top20-content-header', 
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0,
          scrollTrigger: {
            trigger: '.top20-section',
            start: 'top 60%', 
            end: 'top 30%',
            scrub: 1,
          }
        }
      );

    }, mainRef);

    return () => ctx.revert();
  }, [upcoming, topAnimes]);

  const firstCol = topAnimes.slice(0, 10);
  const secondCol = topAnimes.slice(10, 20);

  return (
    <div ref={mainRef} className="block font-sans bg-[#1C1C1C] overflow-hidden relative w-full">
      
      {/* 1. SECUENCIA CANVAS (Actualizada a 400vh) */}
      <AnimeScrollCanvas 
        totalFrames={89} 
        baseUrl="/sequence/" 
        framePrefix="frame_"
        fileExtension=".webp" 
        padLength={4} 
        scrollDistance="400vh" 
      />

      {/* 2. SECCIÓN: ESTRENOS DE TEMPORADA */}
      <section className="reveal-section pt-24 pb-48 relative z-10 bg-[#1C1C1C] border-t border-neutral-800">
        <div className="section-content">
          <div className="container mx-auto px-4 mb-10 mt-10">
            <h2 className="text-3xl font-black text-white flex items-center gap-4">
              Estrenos de Temporada
              <span className="bg-[#D6685A] text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-[0_0_15px_rgba(214,104,90,0.5)]">Abril 2026</span>
            </h2>
          </div>

          {upcoming.length > 0 && (
            <div className="relative flex overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#1C1C1C] to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#1C1C1C] to-transparent z-10 pointer-events-none"></div>

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

      {/* 3. SECCIÓN: TOP 20 GLOBAL (LA OLA SÓLIDA NEGRA) */}
      <section className="top20-section pt-32 pb-20 px-4 relative z-20 bg-[#0a0a0a] -mt-32">
        <div className="container mx-auto max-w-[1350px]">
          
          <div className="top20-content-header flex items-center justify-between mb-16 border-b border-neutral-800 pb-6">
            <h2 className="text-4xl font-black text-white">Top 20 Global</h2>
            <p className="text-neutral-500 font-medium hidden sm:block">Las obras maestras mejor valoradas</p>
          </div>
          
          {topAnimes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-5">
              <div className="flex flex-col gap-5">
                {firstCol.map((anime, index) => (
                  <RankingItem key={anime.mal_id} anime={anime} index={index} />
                ))}
              </div>
              <div className="flex flex-col gap-5">
                {secondCol.map((anime, index) => (
                  <RankingItem key={anime.mal_id} anime={anime} index={index + 10} />
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
      
    </div>
  );
};

// Subcomponente RankingItem...
const RankingItem = ({ anime, index }: { anime: Anime, index: number }) => (
  <Link
    to={`/anime/${anime.mal_id}`}
    className="ranking-item flex bg-[#1C1C1C] border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-[#D6685A]/50 hover:shadow-[0_0_30px_rgba(214,104,90,0.2)] transition-all h-32 group"
  >
    <div className="w-20 bg-neutral-900/80 flex flex-col items-center justify-center font-black text-neutral-600 group-hover:text-[#D6685A] group-hover:bg-[#D6685A]/10 border-r border-neutral-800 transition-colors">
      <span className="text-3xl">{index + 1}</span>
    </div>
    
    <div className="w-24 relative overflow-hidden">
      <img 
        src={anime.images.jpg.image_url} 
        alt={anime.title} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
      />
    </div>
    
    <div className="p-5 flex flex-col justify-center flex-1 min-w-0">
      <h4 className="text-white text-lg font-bold truncate group-hover:text-[#D6685A] transition-colors">
        {anime.title}
      </h4>
      <div className="flex justify-between items-center mt-3">
        <span className="text-neutral-400 text-sm font-medium">
          {anime.episodes ? `${anime.episodes} episodios` : 'En emisión'}
        </span>
        <span className="text-white font-bold flex items-center gap-1.5 text-sm bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/50">
          <span className="text-[#D6685A]">★</span> {anime.score}
        </span>
      </div>
    </div>
  </Link>
);