import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAnime, getRandomAnime, getRecommendedAnimes } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import { AnimeCard } from '../components/AnimeCard'; 
import debounce from 'lodash.debounce';
import { Dices, RefreshCw, Loader2 } from 'lucide-react';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  // Estados de Búsqueda
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<Anime[]>([]);
  const [instantResults, setInstantResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de Descubrimiento (NUEVO)
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [randomAnime, setRandomAnime] = useState<Anime | null>(null);
  const [loadingRandom, setLoadingRandom] = useState(false);

  // 1. Cargar Recomendaciones Iniciales
  useEffect(() => {
    handleLoadRecommendations();
  }, []);

  const handleLoadRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const response = await getRecommendedAnimes();
      setRecommendations(response.data);
    } catch (error) {
      console.error("Error cargando recomendaciones:", error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handlePickRandomAnime = async () => {
    setLoadingRandom(true);
    setRandomAnime(null); // Oculta el actual mientras carga
    try {
      const response = await getRandomAnime();
      setRandomAnime(response.data);
    } catch (error) {
      console.error("Error cargando anime aleatorio:", error);
    } finally {
      setLoadingRandom(false);
    }
  };

  // 2. Lógica de Búsqueda Instantánea
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
    } else {
      setResults([]); // Limpiar resultados si se borra la búsqueda
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
    if (query.trim()) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({}); // Quita el parámetro de la URL si está vacío
    }
  };

  const isDiscoverMode = !queryParam && results.length === 0 && !loading;

  return (
    <div className="container mx-auto p-4 md:p-8 font-sans max-w-[1400px]">
      
      {/* BARRA DE BÚSQUEDA CENTRAL */}
      <div className={`max-w-3xl mx-auto transition-all duration-500 ${isDiscoverMode ? 'mt-8 mb-16' : 'mt-0 mb-10'}`}>
        {isDiscoverMode && (
          <h2 className="text-4xl font-black mb-8 text-white text-center">Encuentra tu próximo anime</h2>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-3 relative z-20">
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

          {/* Resultados Instantáneos Desplegables */}
          {instantResults.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-[#1C1C1C] mt-2 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-left">
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
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-[#D6685A] mb-4" size={40} />
        </div>
      )}

      {/* RESULTADOS DE BÚSQUEDA NORMALES */}
      {!loading && results.length > 0 && (
        <div className="animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-4">
            <h3 className="text-2xl font-bold text-white">Resultados para "{queryParam}"</h3>
            <Link to="/search" onClick={() => { setQuery(''); setResults([]); }} className="text-neutral-400 hover:text-[#D6685A] transition-colors text-sm font-medium">
              Limpiar búsqueda
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((anime) => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && queryParam && (
        <div className="text-center py-20 bg-[#1C1C1C] rounded-3xl border border-neutral-800 animate-in fade-in">
          <p className='text-neutral-300 text-xl font-bold mb-2'>No encontramos resultados para "{queryParam}".</p>
          <p className='text-neutral-500'>Revisa la ortografía o prueba con un título diferente (ej: japonés en lugar de inglés).</p>
          <Link to="/search" onClick={() => setQuery('')} className="inline-block mt-6 px-6 py-2 border border-neutral-700 text-neutral-300 rounded-full hover:bg-neutral-800 transition-colors">
            Volver a explorar
          </Link>
        </div>
      )}

      {/* --- MODO DESCUBRIMIENTO (Se muestra solo si no hay búsqueda activa) --- */}
      {isDiscoverMode && (
        <div className="flex flex-col gap-12 animate-in fade-in duration-700">
          
          {/* SECCIÓN 1: Ruleta de Anime al Azar */}
          <section className="bg-gradient-to-br from-[#1C1C1C] to-neutral-900 rounded-3xl p-8 border border-neutral-800 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-black text-white mb-3">¿No sabes qué ver?</h3>
                <p className="text-neutral-400 mb-8 max-w-md text-lg">
                  Deja que el destino elija tu próxima aventura. Nuestra base de datos elegirá una serie o película completamente al azar para ti.
                </p>
                <button 
                  onClick={handlePickRandomAnime}
                  disabled={loadingRandom}
                  className="bg-[#D6685A] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#c25a4d] transition-all shadow-lg shadow-[#D6685A]/20 flex items-center gap-3 mx-auto md:mx-0 disabled:opacity-70 disabled:scale-95"
                >
                  {loadingRandom ? <Loader2 size={24} className="animate-spin" /> : <Dices size={24} />}
                  {loadingRandom ? 'Buscando...' : 'Generar Anime al Azar'}
                </button>
              </div>

              {/* Contenedor del Anime Generado */}
              <div className="w-full md:w-64 min-h-[350px] flex items-center justify-center bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
                {randomAnime ? (
                  <div className="w-full h-full animate-in zoom-in duration-500">
                    <AnimeCard anime={randomAnime} />
                  </div>
                ) : (
                  <div className="text-neutral-600 flex flex-col items-center gap-3">
                    <Dices size={40} className="opacity-50" />
                    <span className="text-sm font-medium">El resultado aparecerá aquí</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: Recomendaciones Dinámicas */}
          <section>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-neutral-800 pb-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                Recomendados para ti
              </h3>
              <button 
                onClick={handleLoadRecommendations}
                disabled={loadingRecs}
                className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-[#D6685A] bg-[#1C1C1C] px-4 py-2 rounded-full border border-neutral-800 hover:border-[#D6685A]/50 transition-all disabled:opacity-50"
              >
                <RefreshCw size={16} className={loadingRecs ? "animate-spin" : ""} />
                Actualizar lista
              </button>
            </div>

            {loadingRecs ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#1C1C1C] aspect-[3/4] rounded-2xl border border-neutral-800 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {recommendations.map((anime) => (
                  <AnimeCard key={anime.mal_id} anime={anime} />
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
};