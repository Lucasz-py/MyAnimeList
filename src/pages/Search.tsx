import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchAnime } from '../services/jikanApi';
import type{ Anime } from '../types/anime';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queryParam) {
      handleFetchAnimes(queryParam);
    }
  }, [queryParam]);

  const handleFetchAnimes = async (searchTerm: string) => {
    if (!searchTerm) return;
    setLoading(true);
    try {
      const response = await searchAnime(searchTerm);
      setResults(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h2 className="text-3xl font-bold mb-8 text-fuchsia-400 text-neon-fuchsia">BUSCAR_DATA::sujetos</h2>
      
      <form onSubmit={handleSubmit} className="mb-12 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="buscar::ej::naruto, edgerunners..."
          className="border border-cyan-400 p-3 rounded flex-1 max-w-xl bg-slate-900 text-cyan-50 focus:border-fuchsia-400 focus:outline-none"
        />
        <button 
          type="submit" 
          className="bg-cyan-600 text-cyan-50 px-6 py-2 rounded font-semibold hover:bg-cyan-800 transition-colors border border-cyan-400"
        >
          EJECUTAR_QUERY
        </button>
      </form>

      {loading && <p className='text-cyan-400 animate-pulse'>...CARGANDO_DATA_JIKAN...V4...</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {results.map((anime) => (
          <div key={anime.mal_id} className="border border-cyan-900 bg-slate-900 rounded-md overflow-hidden shadow-md hover:border-cyan-400 hover:shadow-cyan-900/50 transition-all hover:-translate-y-1">
            <div className='relative'>
                <img 
                    src={anime.images.jpg.image_url} 
                    alt={anime.title} 
                    className="w-full h-72 object-cover border-b border-cyan-900"
                />
                <div className='absolute top-2 right-2 bg-slate-950/80 p-1 border border-teal-400 rounded-full text-xs text-teal-400'>
                    ID:{anime.mal_id}
                </div>
            </div>
            
            <div className="p-3">
              <h3 className="font-semibold text-cyan-50 text-xs line-clamp-2 h-8" title={anime.title}>
                {anime.title}
              </h3>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">
                {anime.episodes ? `${anime.episodes} eps` : 'Status: AIRING'}
              </p>
              <button className="w-full mt-4 bg-fuchsia-950 text-fuchsia-300 text-[11px] py-1 border border-fuchsia-600 rounded-sm hover:bg-fuchsia-800 transition-colors">
                [+] AGREGAR_A_LISTA
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};