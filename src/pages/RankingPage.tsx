import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTopAnimes } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { RankingRow } from './Home'; // Reutilizamos el diseño de fila para consistencia

export const RankingPage = () => {
  const { filter } = useParams();
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isPopular = filter === 'popular';
  const jikanFilter = isPopular ? 'bypopularity' : '';
  const title = isPopular ? 'Más Populares' : 'Mejor Valoradas';
  const emoji = isPopular ? '🔥' : '★';

  const fetchRankings = useCallback(async (page: number, append: boolean = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await getTopAnimes(25, jikanFilter, page);
      const newAnimes = res?.data || [];
      setAnimes(prev => append ? [...prev, ...newAnimes] : newAnimes);
    } catch (error) {
      console.error("Error cargando ranking:", error);
      setAnimes([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [jikanFilter]);

  useEffect(() => {
    setCurrentPage(1);
    fetchRankings(1, false);
    window.scrollTo(0, 0);
  }, [filter, jikanFilter, fetchRankings]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchRankings(nextPage, true);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-[#D6685A] animate-spin" size={40} />
        <span className="text-white font-mono text-xs uppercase tracking-[0.4em]">Sincronizando Base de Datos</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-[900px]">
        <Link to="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#D6685A] mb-12 transition-colors uppercase text-[10px] font-bold tracking-[0.2em]">
          <ArrowLeft size={14} /> Volver al Inicio
        </Link>
        
        {/* Título estático como pediste */}
        <h1 className="text-4xl md:text-6xl font-black text-white mb-16 border-b border-neutral-800 pb-8 leading-tight">
          Top 100 <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D6685A] to-orange-500 uppercase tracking-tighter">
            {title}
          </span> {emoji}
        </h1>
        
        <div className="flex flex-col gap-6">
          {animes?.map((anime, index) => (
            <RankingRow key={`${anime.mal_id}-${index}`} anime={anime} index={index} />
          ))}
        </div>

        {animes.length < 100 && (
          <div className="mt-20 flex justify-center">
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="group flex items-center gap-4 px-12 py-5 rounded-full border border-white/10 bg-white/5 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#D6685A] hover:border-[#D6685A] transition-all disabled:opacity-50"
            >
              {loadingMore ? <Loader2 size={16} className="animate-spin" /> : 'Cargar más resultados'}
              {!loadingMore && <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};