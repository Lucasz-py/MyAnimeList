import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchAnime } from '../services/jikanApi';
import type { Anime } from '../types/anime';

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
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Buscar Animes</h2>
      
      <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: Cyberpunk Edgerunners, Naruto..."
          className="border border-slate-300 p-2 rounded flex-1 max-w-md"
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Buscar
        </button>
      </form>

      {loading && <p>Cargando resultados de Jikan API...</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((anime) => (
          <div key={anime.mal_id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <img 
              src={anime.images.jpg.image_url} 
              alt={anime.title} 
              className="w-full h-64 object-cover"
            />
            <div className="p-3">
              <h3 className="font-semibold text-sm line-clamp-2" title={anime.title}>
                {anime.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {anime.episodes ? `${anime.episodes} episodios` : 'Emisión'}
              </p>
              <button className="w-full mt-3 bg-slate-100 text-slate-800 text-sm py-1 rounded hover:bg-slate-200">
                + Agregar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};