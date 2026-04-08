import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingAnimes, getTopAnimes } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import { AnimeCard } from '../components/AnimeCard'; 
import gsap from 'gsap';

export const Home = () => {
  const [upcoming, setUpcoming] = useState<Anime[]>([]);
  const [topAnimes, setTopAnimes] = useState<Anime[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (upcoming.length > 0 && scrollRef.current) {
      const element = scrollRef.current;
      const totalWidth = element.scrollWidth / 2;

      const animation = gsap.to(element, {
        x: -totalWidth,
        duration: 70, 
        ease: "none",
        repeat: -1,
      });

      return () => animation.kill();
    }
  }, [upcoming]);

  const firstCol = topAnimes.slice(0, 10);
  const secondCol = topAnimes.slice(10, 20);

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-28 text-center px-4">
        <div className="z-10 max-w-3xl mx-auto flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6 text-white tracking-tight leading-tight">
            Descubre y organiza tu <span className="text-[#D6685A]">colección</span>
          </h1>
          <p className="text-lg text-neutral-400 mb-10 max-w-xl font-medium">
            Explora miles de series, lleva el control de lo que ves y descubre tu próximo anime favorito en un solo lugar.
          </p>
          
          <Link 
            to="/search" 
            className="px-8 py-4 bg-[#D6685A] text-white font-bold rounded-full hover:bg-[#c25a4d] transition-all shadow-lg shadow-[#D6685A]/20 text-lg hover:-translate-y-1"
          >
            Comenzar a explorar
          </Link>
        </div>
      </section>

      {/* Estrenos */}
      <section className="py-16 overflow-hidden relative z-0">
        <div className="container mx-auto px-4 mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Estrenos de Temporada
            <span className="bg-[#D6685A]/10 text-[#D6685A] text-xs px-2 py-1 rounded-full font-bold">Abril 2026</span>
          </h2>
        </div>

        <div className="relative flex overflow-hidden">
          <div ref={scrollRef} className="flex gap-6 whitespace-nowrap pl-6">
            {[...upcoming, ...upcoming].map((anime, index) => (
              <div key={`${anime.mal_id}-${index}`} className="inline-block w-56 whitespace-normal">
                 <AnimeCard anime={anime} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top 20 */}
      <section className="py-20 px-4 container mx-auto max-w-[1350px]">
        <div className="flex items-center justify-between mb-10 border-b border-neutral-800 pb-4">
          <h2 className="text-3xl font-bold text-white">Top 20 Global</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex flex-col gap-4">
            {firstCol.map((anime, index) => (
              <RankingItem key={anime.mal_id} anime={anime} index={index} />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {secondCol.map((anime, index) => (
              <RankingItem key={anime.mal_id} anime={anime} index={index + 10} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const RankingItem = ({ anime, index }: { anime: Anime, index: number }) => (
  <Link
    to={`/anime/${anime.mal_id}`}
    className="flex bg-[#1C1C1C] border border-neutral-800/50 rounded-2xl overflow-hidden hover:border-[#D6685A]/50 hover:shadow-lg transition-all h-28 group"
  >
    <div className="w-16 bg-neutral-900/50 flex flex-col items-center justify-center font-black text-neutral-500 group-hover:text-[#D6685A] border-r border-neutral-800 transition-colors">
      <span className="text-2xl">{index + 1}</span>
    </div>
    
    <div className="w-20 relative overflow-hidden">
      <img 
        src={anime.images.jpg.image_url} 
        alt={anime.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
    </div>
    
    <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
      <h4 className="text-white text-base font-bold truncate group-hover:text-[#D6685A] transition-colors">
        {anime.title}
      </h4>
      <div className="flex justify-between items-center mt-2">
        <span className="text-neutral-400 text-xs font-medium">
          {anime.episodes ? `${anime.episodes} episodios` : 'En emisión'}
        </span>
        <span className="text-white font-bold flex items-center gap-1.5 text-sm bg-neutral-800 px-2 py-1 rounded-lg">
          <span className="text-[#D6685A]">★</span> {anime.score}
        </span>
      </div>
    </div>
  </Link>
);