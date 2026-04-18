import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { advancedSearchAnime, getRandomAnime, getRecommendedAnimes, type AdvancedSearchFilters } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import { AnimeCard } from '../components/AnimeCard'; 
import debounce from 'lodash.debounce';
import { Dices, RefreshCw, Loader2, FilterX, Filter, X, ChevronDown, Plus } from 'lucide-react';

const ANIME_TYPES = [
  { value: 'tv', label: 'TV (Serie)' },
  { value: 'movie', label: 'Película (Cine)' },
  { value: 'ova', label: 'OVA (Físico)' },
  { value: 'special', label: 'Especial' },
  { value: 'ona', label: 'ONA (Web / Netflix)' },
];

const ANIME_STATUS = [
  { value: 'airing', label: 'En Emisión' },
  { value: 'complete', label: 'Finalizado' },
  { value: 'upcoming', label: 'Por Estrenar' },
];

const SEASONS = [
  { value: 'winter', label: '❄️ Invierno (Ene-Mar)' },
  { value: 'spring', label: '🌸 Primavera (Abr-Jun)' },
  { value: 'summer', label: '☀️ Verano (Jul-Sep)' },
  { value: 'fall', label: '🍂 Otoño (Oct-Dic)' },
];

const TOP_STUDIOS = [
  { value: '2', label: 'Kyoto Animation' },
  { value: '4', label: 'Bones' },
  { value: '10', label: 'Production I.G' },
  { value: '11', label: 'Madhouse' },
  { value: '14', label: 'Sunrise' },
  { value: '43', label: 'ufotable' },
  { value: '56', label: 'A-1 Pictures' },
  { value: '569', label: 'MAPPA' },
  { value: '858', label: 'Wit Studio' },
  { value: '1835', label: 'CloverWorks' },
];

const GENRES = [
  { id: 1, name: 'Acción' }, { id: 2, name: 'Aventura' }, { id: 4, name: 'Comedia' },
  { id: 8, name: 'Drama' }, { id: 10, name: 'Fantasía' }, { id: 14, name: 'Terror' },
  { id: 7, name: 'Misterio' }, { id: 22, name: 'Romance' }, { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' }, { id: 30, name: 'Deportes' }, { id: 37, name: 'Sobrenatural' },
  { id: 41, name: 'Suspenso' }, { id: 62, name: 'Isekai' }, { id: 9, name: 'Ecchi' }
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({length: currentYear - 1970 + 2}, (_, i) => currentYear + 1 - i);

interface Option { value: string; label: string }
interface CustomDropdownProps {
  label: string; value: string; options: Option[]; onChange: (val: string) => void; disabled?: boolean; placeholder?: string;
}

const CustomDropdown = ({ label, value, options, onChange, disabled = false, placeholder }: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      <label className={`text-xs font-bold uppercase tracking-wider ${disabled ? 'text-neutral-700' : 'text-neutral-500'}`}>{label}</label>
      <button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)} className={`w-full bg-[#1C1C1C] text-white border border-white/5 rounded-xl p-3.5 flex justify-between items-center transition-colors text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#D6685A]/50'}`}>
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} className={`text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-[80px] left-0 w-full bg-[#1C1C1C] border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-track]:bg-transparent">
          <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-neutral-800 ${value === '' ? 'text-[#D6685A] font-bold bg-neutral-800/50' : 'text-neutral-300'}`}>{placeholder}</button>
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-neutral-800 ${value === opt.value ? 'text-[#D6685A] font-bold bg-neutral-800/50' : 'text-neutral-300'}`}>{opt.label}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [results, setResults] = useState<Anime[]>([]);
  const [instantResults, setInstantResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // --- NUEVOS ESTADOS DE PAGINACIÓN ---
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [randomAnime, setRandomAnime] = useState<Anime | null>(null);
  const [loadingRandom, setLoadingRandom] = useState(false);

  const [query, setQuery] = useState('');
  const [localFilters, setLocalFilters] = useState({
    type: '', status: '', year: '', season: '', studioId: '', studioName: '', genres: [] as string[]
  });

  useEffect(() => { handleLoadRecommendations(); }, []);

  const handleLoadRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const response = await getRecommendedAnimes();
      setRecommendations(response.data);
    } catch (error) { console.error(error); } finally { setLoadingRecs(false); }
  };

  const handlePickRandomAnime = async () => {
    setLoadingRandom(true);
    setRandomAnime(null); 
    try {
      const response = await getRandomAnime();
      setRandomAnime(response.data);
    } catch (error) { console.error(error); } finally { setLoadingRandom(false); }
  };

  const debouncedFetchInstantResults = useMemo(() =>
    debounce(async (searchTerm: string) => {
      if (searchTerm.trim()) {
        try {
          const response = await advancedSearchAnime({ q: searchTerm, limit: 5 });
          setInstantResults(response.data);
        } catch (error) { console.error(error); }
      } else { setInstantResults([]); }
    }, 300), []);

  useEffect(() => { return () => debouncedFetchInstantResults.cancel(); }, [debouncedFetchInstantResults]);

  // Al cambiar los parámetros de la URL, reseteamos a la página 1
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    setQuery(qParam);
    
    setLocalFilters({
      type: searchParams.get('type') || '',
      status: searchParams.get('status') || '',
      year: searchParams.get('year') || '',
      season: searchParams.get('season') || '',
      studioId: searchParams.get('studioId') || '',
      studioName: searchParams.get('studioName') || '',
      genres: searchParams.get('genres') ? searchParams.get('genres')!.split(',') : []
    });

    const hasAnyParam = Array.from(searchParams.keys()).length > 0;
    if (hasAnyParam) {
      executeAdvancedSearch(searchParams, 1);
    } else {
      setResults([]);
      setHasNextPage(false);
    }
  }, [searchParams]);

  // Lógica principal actualizada con Paginación
  const executeAdvancedSearch = async (params: URLSearchParams, pageNumber: number = 1) => {
    if (pageNumber === 1) {
      setLoading(true);
      setInstantResults([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const apiFilters: AdvancedSearchFilters = { page: pageNumber };
      
      if (params.get('q')) apiFilters.q = params.get('q')!;
      if (params.get('type')) apiFilters.type = params.get('type')!;
      if (params.get('status')) apiFilters.status = params.get('status')!;
      if (params.get('genres')) apiFilters.genres = params.get('genres')!;
      if (params.get('studioId')) apiFilters.producers = params.get('studioId')!;
      
      const year = params.get('year');
      const season = params.get('season');
      
      let targetYear = year;
      if (season && !year) targetYear = currentYear.toString();

      if (targetYear) {
        if (season === 'winter') { apiFilters.start_date = `${targetYear}-01-01`; apiFilters.end_date = `${targetYear}-03-31`; }
        else if (season === 'spring') { apiFilters.start_date = `${targetYear}-04-01`; apiFilters.end_date = `${targetYear}-06-30`; }
        else if (season === 'summer') { apiFilters.start_date = `${targetYear}-07-01`; apiFilters.end_date = `${targetYear}-09-30`; }
        else if (season === 'fall') { apiFilters.start_date = `${targetYear}-10-01`; apiFilters.end_date = `${targetYear}-12-31`; }
        else { apiFilters.start_date = `${targetYear}-01-01`; apiFilters.end_date = `${targetYear}-12-31`; }
      }

      const response = await advancedSearchAnime(apiFilters);
      
      if (pageNumber === 1) {
        setResults(response.data);
      } else {
        // Añadimos los nuevos resultados previniendo duplicados por seguridad
        setResults(prev => {
          const existingIds = new Set(prev.map(a => a.mal_id));
          const uniqueNew = response.data.filter((a: Anime) => !existingIds.has(a.mal_id));
          return [...prev, ...uniqueNew];
        });
      }
      
      // Actualizamos estado de paginación con el objeto de Jikan
      setHasNextPage(response.pagination?.has_next_page || false);
      setPage(pageNumber);

    } catch (error) {
      console.error("Error en la búsqueda principal:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetchInstantResults(value);
  };

  const toggleGenre = (id: number) => {
    setLocalFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(id.toString()) 
        ? prev.genres.filter(g => g !== id.toString())
        : [...prev.genres, id.toString()]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInstantResults([]); 
    
    const newParams = new URLSearchParams();
    if (query.trim()) newParams.set('q', query);
    if (localFilters.type) newParams.set('type', localFilters.type);
    if (localFilters.status) newParams.set('status', localFilters.status);
    if (localFilters.year) newParams.set('year', localFilters.year);
    if (localFilters.season) newParams.set('season', localFilters.season);
    if (localFilters.studioId) newParams.set('studioId', localFilters.studioId);
    if (localFilters.studioName) newParams.set('studioName', localFilters.studioName);
    if (localFilters.genres.length > 0) newParams.set('genres', localFilters.genres.join(','));
    
    setSearchParams(newParams);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setQuery('');
    setLocalFilters({ type: '', status: '', year: '', season: '', studioId: '', studioName: '', genres: [] });
    setSearchParams({});
    setPage(1);
    setHasNextPage(false);
  };

  const hasActiveFilters = Array.from(searchParams.keys()).length > 0;
  const isDiscoverMode = !hasActiveFilters && results.length === 0 && !loading;

  const getActiveFilterTags = () => {
    const tags = [];
    if (searchParams.get('q')) tags.push(`Texto: "${searchParams.get('q')}"`);
    if (searchParams.get('type')) tags.push(`Formato: ${ANIME_TYPES.find(t => t.value === searchParams.get('type'))?.label || searchParams.get('type')}`);
    if (searchParams.get('status')) tags.push(`Estado: ${ANIME_STATUS.find(s => s.value === searchParams.get('status'))?.label || searchParams.get('status')}`);
    if (searchParams.get('year')) tags.push(`Año: ${searchParams.get('year')}`);
    if (searchParams.get('season')) {
      const s = SEASONS.find(s => s.value === searchParams.get('season'))?.label || searchParams.get('season');
      tags.push(`Temp: ${s!.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '').trim()}`);
    }
    if (searchParams.get('studioName')) tags.push(`Estudio: ${searchParams.get('studioName')}`);
    if (searchParams.get('genres')) {
      searchParams.get('genres')!.split(',').forEach(id => {
        const genre = GENRES.find(g => g.id.toString() === id);
        if (genre) tags.push(`Género: ${genre.name}`);
      });
    }
    return tags;
  };
  const activeTags = getActiveFilterTags();

  return (
    <div className="container mx-auto p-4 md:p-8 pt-32 md:pt-36 font-sans max-w-[1400px] min-h-screen">
      
      {/* BUSCADOR Y FILTROS */}
      <div className={`max-w-4xl mx-auto transition-all duration-500 ${isDiscoverMode ? 'mt-8 mb-16' : 'mt-0 mb-6'}`}>
        {isDiscoverMode && (
          <h2 className="text-4xl font-black mb-8 text-white text-center">Encuentra tu próximo anime</h2>
        )}
        
        <form onSubmit={handleSubmit} className="relative z-20">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="..."
              className="flex-1 p-4 pl-6 text-white bg-[#1C1C1C] border border-neutral-800 rounded-full focus:border-[#D6685A] focus:outline-none focus:ring-2 focus:ring-[#D6685A]/20 transition-all shadow-sm text-lg"
            />
            
            <button 
              type="button" 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 rounded-full font-bold transition-all shadow-sm border flex items-center gap-2 ${showFilters ? 'bg-[#D6685A]/20 border-[#D6685A] text-[#D6685A]' : 'bg-[#1C1C1C] border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600'}`}
              title="Filtros Avanzados"
            >
              <Filter size={20} />
            </button>

            <button 
              type="submit" 
              className="bg-[#D6685A] text-white px-8 py-4 rounded-full font-bold hover:bg-[#c25a4d] transition-all shadow-lg shadow-[#D6685A]/20 shrink-0"
            >
              Buscar
            </button>
          </div>

          {instantResults.length > 0 && !showFilters && (
            <div className="absolute top-full left-0 w-[calc(100%-140px)] bg-[#1C1C1C] mt-2 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-left">
              {instantResults.map((anime) => (
                <Link key={anime.mal_id} to={`/anime/${anime.mal_id}`} className="flex items-center gap-4 p-3 border-b border-neutral-800/50 hover:bg-neutral-900 transition-colors last:border-0">
                  <img src={anime.images.jpg.image_url} alt={anime.title} className="w-12 h-16 object-cover rounded-lg" />
                  <div>
                    <p className="text-white font-bold">{anime.title}</p>
                    <p className="text-sm text-neutral-400">{anime.episodes ? `${anime.episodes} episodios` : 'En emisión'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {showFilters && (
            <div className="mt-4 bg-[#141414]/95 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Filter size={18} className="text-[#D6685A]"/> Filtros de Búsqueda</h3>
                <button type="button" onClick={() => setShowFilters(false)} className="text-neutral-500 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <CustomDropdown label="Formato" placeholder="Cualquier Formato" value={localFilters.type} options={ANIME_TYPES} onChange={(v) => setLocalFilters({...localFilters, type: v})} />
                <CustomDropdown label="Estado" placeholder="Cualquier Estado" value={localFilters.status} options={ANIME_STATUS} onChange={(v) => setLocalFilters({...localFilters, status: v})} />
                <CustomDropdown label="Año" placeholder="Cualquier Año" value={localFilters.year} options={YEARS.map(y=>({value: y.toString(), label: y.toString()}))} onChange={(v) => setLocalFilters({...localFilters, year: v})} />
                <CustomDropdown label="Temporada" placeholder={localFilters.year ? 'Toda la temporada' : 'Selecciona un año'} disabled={!localFilters.year} value={localFilters.season} options={SEASONS} onChange={(v) => setLocalFilters({...localFilters, season: v})} />
              </div>

              <div className="mb-8">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-3">Géneros</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => {
                    const isSelected = localFilters.genres.includes(genre.id.toString());
                    return (
                      <button key={genre.id} type="button" onClick={() => toggleGenre(genre.id)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${isSelected ? 'bg-[#D6685A]/20 border-[#D6685A] text-[#D6685A] shadow-[0_0_10px_rgba(214,104,90,0.2)]' : 'bg-[#1C1C1C] border-white/5 text-neutral-400 hover:border-neutral-500 hover:text-white'}`}>
                        {genre.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-3">Estudios Populares</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setLocalFilters({...localFilters, studioId: '', studioName: ''})} className={`px-4 py-2 rounded-full border text-xs font-bold transition-colors ${!localFilters.studioId ? 'bg-[#D6685A]/20 border-[#D6685A] text-[#D6685A]' : 'bg-[#1C1C1C] border-white/5 text-neutral-400 hover:text-white'}`}>Todos</button>
                  {TOP_STUDIOS.map(studio => (
                    <button key={studio.value} type="button" onClick={() => setLocalFilters({...localFilters, studioId: studio.value, studioName: studio.label})} className={`px-4 py-2 rounded-full border text-xs font-bold transition-colors ${localFilters.studioId === studio.value ? 'bg-[#D6685A]/20 border-[#D6685A] text-[#D6685A] shadow-[0_0_10px_rgba(214,104,90,0.2)]' : 'bg-[#1C1C1C] border-white/5 text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
                      {studio.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>

        {!isDiscoverMode && activeTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 animate-in fade-in">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest mr-2">Filtros Activos:</span>
            {activeTags.map((tag, idx) => (
              <span key={idx} className="bg-[#D6685A]/10 text-[#D6685A] border border-[#D6685A]/20 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col justify-center items-center py-32">
          <Loader2 className="animate-spin text-[#D6685A] mb-4" size={50} />
          <span className="text-neutral-500 font-bold tracking-widest uppercase text-sm">Rastreando Base de Datos</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-neutral-800 pb-4 gap-4 mt-8">
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              Resultados
              <span className="bg-neutral-800 text-neutral-400 text-xs px-3 py-1 rounded-full">{results.length} coincidencias</span>
            </h3>
            <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all text-xs font-bold uppercase tracking-wider">
              <FilterX size={14} /> Limpiar todo
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} />)}
          </div>

          {/* --- NUEVO BOTÓN DE "VER MÁS" --- */}
          {hasNextPage && (
            <div className="flex justify-center mt-16 mb-8">
              <button 
                onClick={() => executeAdvancedSearch(searchParams, page + 1)}
                disabled={loadingMore}
                className="group relative flex items-center gap-3 px-10 py-4 bg-[#1C1C1C] border border-neutral-700 hover:border-[#D6685A] rounded-full text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(214,104,90,0.15)]"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={20} className="animate-spin text-[#D6685A]" />
                    <span>Cargando más animes...</span>
                  </>
                ) : (
                  <>
                    <span>Cargar más resultados</span>
                    <Plus size={18} className="text-[#D6685A] group-hover:rotate-90 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && results.length === 0 && hasActiveFilters && (
        <div className="text-center py-20 bg-[#1C1C1C] rounded-3xl border border-neutral-800 animate-in fade-in">
          <FilterX size={48} className="mx-auto text-neutral-600 mb-4" />
          <p className='text-neutral-300 text-xl font-bold mb-2'>No encontramos animes con esos filtros exactos.</p>
          <p className='text-neutral-500'>Intenta quitar algunos géneros o cambiar el año de estreno.</p>
          <button onClick={clearFilters} className="inline-block mt-6 px-6 py-2 border border-neutral-700 text-neutral-300 rounded-full hover:bg-neutral-800 transition-colors">
            Volver a explorar
          </button>
        </div>
      )}

      {isDiscoverMode && (
        <div className="flex flex-col gap-12 animate-in fade-in duration-700">
          <section className="bg-gradient-to-br from-[#1C1C1C] to-neutral-900 rounded-3xl p-8 border border-neutral-800 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-black text-white mb-3">¿No sabes qué ver?</h3>
                <p className="text-neutral-400 mb-8 max-w-md text-lg">Deja que el destino elija tu próxima aventura. Nuestra base de datos elegirá una serie o película completamente al azar para ti.</p>
                <button onClick={handlePickRandomAnime} disabled={loadingRandom} className="bg-[#D6685A] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#c25a4d] transition-all shadow-lg shadow-[#D6685A]/20 flex items-center gap-3 mx-auto md:mx-0 disabled:opacity-70 disabled:scale-95">
                  {loadingRandom ? <Loader2 size={24} className="animate-spin" /> : <Dices size={24} />} {loadingRandom ? 'Buscando...' : 'Generar Anime al Azar'}
                </button>
              </div>
              <div className="w-full md:w-64 min-h-[350px] flex items-center justify-center bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
                {randomAnime ? <div className="w-full h-full animate-in zoom-in duration-500"><AnimeCard anime={randomAnime} /></div> : <div className="text-neutral-600 flex flex-col items-center gap-3"><Dices size={40} className="opacity-50" /><span className="text-sm font-medium">El resultado aparecerá aquí</span></div>}
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-neutral-800 pb-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">Recomendados para ti</h3>
              <button onClick={handleLoadRecommendations} disabled={loadingRecs} className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-[#D6685A] bg-[#1C1C1C] px-4 py-2 rounded-full border border-neutral-800 hover:border-[#D6685A]/50 transition-all disabled:opacity-50">
                <RefreshCw size={16} className={loadingRecs ? "animate-spin" : ""} /> Actualizar lista
              </button>
            </div>
            {loadingRecs ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="bg-[#1C1C1C] aspect-[3/4] rounded-2xl border border-neutral-800 animate-pulse"></div>)}</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">{recommendations.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} />)}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};