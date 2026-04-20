import { Link } from 'react-router-dom';
import type { Anime } from '../types/anime';
import { Calendar } from 'lucide-react';

const cyberClipCard = { clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' };

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard = ({ anime }: AnimeCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };

  const releaseDate = formatDate(anime.aired?.from);

  return (
    <Link 
      to={`/anime/${anime.mal_id}`} 
      className="flex flex-col bg-transparent group font-sans h-full cursor-pointer"
    >
      <div 
        className='relative w-full aspect-[3/4] overflow-hidden bg-slate-950 border border-slate-800 group-hover:border-cyan-500/50 transition-all duration-500 shadow-sm group-hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]'
        style={cyberClipCard}
      >
        <img 
          src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} 
          alt={anime.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center p-4">
           <span 
             className="text-cyan-50 text-[10px] font-bold uppercase tracking-widest bg-slate-950/90 backdrop-blur-md border border-cyan-400 px-6 py-2.5 shadow-[0_0_15px_rgba(6,182,212,0.5)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
             style={cyberClipCard}
           >
             Ver Detalles
           </span>
        </div>
      </div>
      
      <div className="pt-4 flex flex-col flex-1">
        <h3 className="font-bold text-white text-sm md:text-base line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors drop-shadow-sm" title={anime.title}>
          {anime.title}
        </h3>
        
        <div className="mt-2 flex flex-col gap-1.5">
            {releaseDate && (
              <p className="text-[9px] md:text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5 drop-shadow-[0_0_2px_rgba(34,211,238,0.5)]">
                <Calendar size={12} className="text-cyan-500" /> Estreno: {releaseDate}
              </p>
            )}
            <p className="text-[11px] text-slate-500 font-bold">
              {anime.episodes ? `${anime.episodes} episodios` : 'En emisión'}
            </p>
        </div>
      </div>
    </Link>
  );
};