import { Link } from 'react-router-dom';
import type { Anime } from '../types/anime';

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard = ({ anime }: AnimeCardProps) => {
  const handleAddToList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Agregando a lista: ${anime.title}`);
  };

  return (
    <Link 
      to={`/anime/${anime.mal_id}`} 
      className="flex flex-col bg-[#1C1C1C] border border-neutral-800/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#D6685A]/30 transition-all duration-300 hover:-translate-y-1 group font-sans h-full"
    >
      <div className='relative aspect-[3/4] overflow-hidden bg-neutral-900'>
        <img 
          src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} 
          alt={anime.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight" title={anime.title}>
            {anime.title}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 font-medium">
            {anime.episodes ? `${anime.episodes} episodios` : 'En emisión'}
          </p>
        </div>
        
        <div className="flex justify-end mt-4">
          <button 
            onClick={handleAddToList}
            className="w-full flex items-center justify-center bg-neutral-800 hover:bg-[#D6685A] text-white text-xs font-bold py-2 rounded-xl transition-colors"
          >
            + Agregar
          </button>
        </div>
      </div>
    </Link>
  );
};