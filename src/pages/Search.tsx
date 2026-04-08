import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAnime } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import { AnimeCard } from '../components/AnimeCard'; 
import debounce from 'lodash.debounce';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<Anime[]>([]);
  const [instantResults, setInstantResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedFetchInstantResults = useMemo(
    () =>
      debounce(async (searchTerm: string) => {
        if (searchTerm.trim()) {
          try {
            const response = await searchAnime(searchTerm, 5);
            setInstantResults(response.data);
          } catch (error) {
            console.error("Error en búsqueda instantánea:", error);
          }
        } else {
          setInstantResults([]);
        }
      }, 300),
    []
  );

  useEffect(() => {
    return () => debouncedFetchInstantResults.cancel();
  }, [debouncedFetchInstantResults]);

  const handleFetchResults = async (searchTerm: string) => {
    if (!searchTerm) return;
    setLoading(true);
    try {
      setInstantResults([]); 
      const response = await searchAnime(searchTerm);
      setResults(response.data);
    } catch (error) {
      console.error("Error en la búsqueda principal:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      handleFetchResults(queryParam);
    }
  }, [queryParam]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetchInstantResults(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInstantResults([]); 
    setSearchParams({ q: query });
  };

  return (
    <div className="container mx-auto p-4 md:p-8 font-sans max-w-[1400px]">
      <div className="max-w-3xl mx-auto mb-16 mt-8 text-center">
        <h2 className="text-4xl font-black mb-8 text-white">Encuentra tu próximo anime</h2>
        
        <form onSubmit={handleSubmit} className="flex gap-3 relative z-10">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Ej: Naruto, Cyberpunk, Jujutsu Kaisen..."
            className="w-full p-4 pl-6 text-white bg-[#1C1C1C] border border-neutral-800 rounded-full focus:border-[#D6685A] focus:outline-none focus:ring-2 focus:ring-[#D6685A]/20 transition-all shadow-sm text-lg"
          />
          <button 
            type="submit" 
            className="bg-[#D6685A] text-white px-8 py-4 rounded-full font-bold hover:bg-[#c25a4d] transition-all shadow-lg shadow-[#D6685A]/20"
          >
            Buscar
          </button>

          {/* Menú Desplegable (Debajo de la barra central) */}
          {instantResults.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-[#1C1C1C] mt-2 border border-neutral-800 rounded-2xl shadow-2xl z-20 overflow-hidden text-left">
              {instantResults.map((anime) => (
                <Link 
                  key={anime.mal_id} 
                  to={`/anime/${anime.mal_id}`}
                  className="flex items-center gap-4 p-3 border-b border-neutral-800/50 hover:bg-neutral-900 transition-colors last:border-0"
                >
                  <img src={anime.images.jpg.image_url} alt={anime.title} className="w-12 h-16 object-cover rounded-lg" />
                  <div>
                    <p className="text-white font-bold">{anime.title}</p>
                    <p className="text-sm text-neutral-400">{anime.episodes ? `${anime.episodes} episodios` : 'En emisión'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </form>
      </div>

      {loading && (
        <div className="text-center py-10">
          <p className='text-[#D6685A] text-xl font-medium animate-pulse'>Buscando resultados...</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-neutral-400 mb-6 font-medium">Resultados para "{queryParam}"</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((anime) => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))}
          </div>
        </>
      )}

      {!loading && results.length === 0 && queryParam && (
        <div className="text-center py-20 bg-[#1C1C1C] rounded-3xl border border-neutral-800">
          <p className='text-neutral-400 text-lg'>No encontramos resultados para "{queryParam}".</p>
          <p className='text-neutral-500 mt-2'>Prueba con otros términos de búsqueda.</p>
        </div>
      )}
    </div>
  );
};