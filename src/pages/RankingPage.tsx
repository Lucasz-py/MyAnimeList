import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTopAnimes } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { RankingRow } from './Home'; 

const cyberClipCard = { clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' };

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
    if (page === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await getTopAnimes(25, jikanFilter, page);
      const newAnimes = res?.data || [];
      setAnimes(prev => append ? [...prev, ...newAnimes] : newAnimes);
    } catch (error) { console.error(error); setAnimes([]); } finally { setLoading(false); setLoadingMore(false); }
  }, [jikanFilter]);

  useEffect(() => { setCurrentPage(1); fetchRankings(1, false); window.scrollTo(0, 0); }, [filter, jikanFilter, fetchRankings]);

  const handleLoadMore = () => { const nextPage = currentPage + 1; setCurrentPage(nextPage); fetchRankings(nextPage, true); };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-cyan-400 animate-spin" size={40} />
        <span className="text-white font-mono text-xs uppercase tracking-[0.4em] drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Loading</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 pt-32 pb-20 px-4 font-sans">
      <div className="container mx-auto max-w-[900px]">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 mb-12 transition-colors uppercase text-[10px] font-bold tracking-[0.2em] px-4 py-2 border border-slate-800 bg-slate-900" style={cyberClipCard}>
          <ArrowLeft size={14} /> Volver
        </Link>
        
        <h1 className="text-4xl md:text-6xl font-black text-white mb-16 border-b-2 border-cyan-500/30 pb-8 leading-tight">
          Top 100 <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-tighter">
            {title}
          </span> {emoji}
        </h1>
        
        <div className="flex flex-col gap-4">
          {animes?.map((anime, index) => (
            <RankingRow key={`${anime.mal_id}-${index}`} anime={anime} index={index} />
          ))}
        </div>

        {animes.length < 100 && (
          <div className="mt-16 flex justify-center">
            <button 
              onClick={handleLoadMore} disabled={loadingMore}
              className="group flex items-center gap-4 px-10 py-4 bg-slate-900 border border-slate-700 text-slate-300 font-bold uppercase tracking-[0.2em] text-[10px] hover:border-cyan-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
              style={cyberClipCard}
            >
              {loadingMore ? <Loader2 size={16} className="animate-spin text-cyan-400" /> : 'Cargar más registros'}
              {!loadingMore && <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};