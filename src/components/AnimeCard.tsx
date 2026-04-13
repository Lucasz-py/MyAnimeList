import { Link } from 'react-router-dom';
import type { Anime } from '../types/anime';
import { Calendar } from 'lucide-react';

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard = ({ anime }: AnimeCardProps) => {
  // Función para formatear la fecha de ISO (2026-04-12T...) a texto legible ("12 abr 2026")
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // Verificamos si la fecha es válida
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
      {/* Contenedor de la Imagen con Hover Premium */}
      <div className='relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 group-hover:border-[#D6685A]/50 transition-all duration-500 shadow-lg group-hover:shadow-[0_8px_30px_rgba(214,104,90,0.15)]'>
        <img 
          src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} 
          alt={anime.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay oscuro al pasar el mouse */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center p-4">
           <span className="text-white text-xs font-bold uppercase tracking-widest bg-[#D6685A] px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
             Ver Detalles
           </span>
        </div>
      </div>
      
      {/* Información del Anime (Sin bordes de caja) */}
      <div className="pt-4 flex flex-col flex-1">
        <h3 className="font-bold text-white text-sm md:text-base line-clamp-2 leading-tight group-hover:text-[#D6685A] transition-colors" title={anime.title}>
          {anime.title}
        </h3>
        
        <div className="mt-2 flex flex-col gap-1.5">
            {/* Fecha de Estreno (Si existe) */}
            {releaseDate && (
              <p className="text-[10px] md:text-[11px] text-[#D6685A] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} /> Estreno: {releaseDate}
              </p>
            )}
            
            {/* Cantidad de Episodios */}
            <p className="text-xs text-neutral-400 font-medium">
              {anime.episodes ? `${anime.episodes} episodios` : 'En emisión'}
            </p>
        </div>
      </div>
    </Link>
  );
};