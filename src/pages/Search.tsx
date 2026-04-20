import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { advancedSearchAnime, getRandomAnime, getRecommendedAnimes, type AdvancedSearchFilters } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import { AnimeCard } from '../components/AnimeCard'; 
import debounce from 'lodash.debounce';
import { Dices, RefreshCw, Loader2, FilterX, Filter, X, Plus } from 'lucide-react';

const cyberClipCard = { clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' };
const cyberClipPanel = { clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))' };

const ANIME_TYPES = [ { value: 'tv', label: 'TV (Serie)' }, { value: 'movie', label: 'Película (Cine)' }, { value: 'ova', label: 'OVA (Físico)' }, { value: 'special', label: 'Especial' }, { value: 'ona', label: 'ONA (Web / Netflix)' } ];
const ANIME_STATUS = [ { value: 'airing', label: 'En Emisión' }, { value: 'complete', label: 'Finalizado' }, { value: 'upcoming', label: 'Por Estrenar' } ];
const SEASONS = [ { value: 'winter', label: '❄️ Invierno (Ene-Mar)' }, { value: 'spring', label: '🌸 Primavera (Abr-Jun)' }, { value: 'summer', label: '☀️ Verano (Jul-Sep)' }, { value: 'fall', label: '🍂 Otoño (Oct-Dic)' } ];
const TOP_STUDIOS = [ { value: '2', label: 'Kyoto Animation' }, { value: '4', label: 'Bones' }, { value: '10', label: 'Production I.G' }, { value: '11', label: 'Madhouse' }, { value: '14', label: 'Sunrise' }, { value: '43', label: 'ufotable' }, { value: '56', label: 'A-1 Pictures' }, { value: '569', label: 'MAPPA' }, { value: '858', label: 'Wit Studio' }, { value: '1835', label: 'CloverWorks' } ];
const GENRES = [ { id: 1, name: 'Acción' }, { id: 2, name: 'Aventura' }, { id: 4, name: 'Comedia' }, { id: 8, name: 'Drama' }, { id: 10, name: 'Fantasía' }, { id: 14, name: 'Terror' }, { id: 7, name: 'Misterio' }, { id: 22, name: 'Romance' }, { id: 24, name: 'Sci-Fi' }, { id: 36, name: 'Slice of Life' }, { id: 30, name: 'Deportes' }, { id: 37, name: 'Sobrenatural' }, { id: 41, name: 'Suspenso' }, { id: 62, name: 'Isekai' }, { id: 9, name: 'Ecchi' } ];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({length: currentYear - 1970 + 2}, (_, i) => currentYear + 1 - i);

interface Option { value: string; label: string }
interface CustomDropdownProps { label: string; value: string; options: Option[]; onChange: (val: string) => void; disabled?: boolean; placeholder?: string; }

const CustomDropdown = ({ label, value, options, onChange, disabled = false, placeholder }: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      <label className={`text-xs font-bold text-slate-500 uppercase tracking-widest ${disabled ? 'opacity-50' : ''}`}>{label}</label>
      <button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)} className={`w-full bg-slate-950 text-white border border-slate-800 p-3.5 flex justify-between items-center transition-colors text-sm font-bold ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-400/50'}`} style={cyberClipCard}>
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`}>▼</span>
      </button>
      {isOpen && !disabled && (
        <div className="absolute top-[75px] left-0 w-full bg-slate-950 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] z-50 max-h-60 overflow-y-auto" style={cyberClipCard}>
          <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors hover:bg-slate-900 border-b border-slate-800/50 ${value === '' ? 'text-cyan-400 bg-slate-900/80' : 'text-slate-400'}`}>{placeholder}</button>
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors hover:bg-slate-900 border-b border-slate-800/50 last:border-0 ${value === opt.value ? 'text-cyan-400 bg-slate-900/80' : 'text-slate-400'}`}>{opt.label}</button>
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
    try { const response = await getRecommendedAnimes(); setRecommendations(response.data); } 
    catch (error) { console.error(error); } finally { setLoadingRecs(false); }
  };

  const handlePickRandomAnime = async () => {
    setLoadingRandom(true); setRandomAnime(null); 
    try { const response = await getRandomAnime(); setRandomAnime(response.data); } 
    catch (error) { console.error(error); } finally { setLoadingRandom(false); }
  };

  const debouncedFetchInstantResults = useMemo(() =>
    debounce(async (searchTerm: string) => {
      if (searchTerm.trim()) {
        try { const response = await advancedSearchAnime({ q: searchTerm, limit: 5 }); setInstantResults(response.data); } 
        catch (error) { console.error(error); }
      } else { setInstantResults([]); }
    }, 300), []);

  useEffect(() => { return () => debouncedFetchInstantResults.cancel(); }, [debouncedFetchInstantResults]);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    setQuery(qParam);
    setLocalFilters({
      type: searchParams.get('type') || '', status: searchParams.get('status') || '', year: searchParams.get('year') || '',
      season: searchParams.get('season') || '', studioId: searchParams.get('studioId') || '', studioName: searchParams.get('studioName') || '',
      genres: searchParams.get('genres') ? searchParams.get('genres')!.split(',') : []
    });
    if (Array.from(searchParams.keys()).length > 0) executeAdvancedSearch(searchParams, 1);
    else { setResults([]); setHasNextPage(false); }
  }, [searchParams]);

  const executeAdvancedSearch = async (params: URLSearchParams, pageNumber: number = 1) => {
    if (pageNumber === 1) { setLoading(true); setInstantResults([]); } else setLoadingMore(true);
    try {
      const apiFilters: AdvancedSearchFilters = { page: pageNumber };
      if (params.get('q')) apiFilters.q = params.get('q')!;
      if (params.get('type')) apiFilters.type = params.get('type')!;
      if (params.get('status')) apiFilters.status = params.get('status')!;
      if (params.get('genres')) apiFilters.genres = params.get('genres')!;
      if (params.get('studioId')) apiFilters.producers = params.get('studioId')!;
      
      let targetYear = params.get('year');
      if (params.get('season') && !targetYear) targetYear = currentYear.toString();

      if (targetYear) {
        if (params.get('season') === 'winter') { apiFilters.start_date = `${targetYear}-01-01`; apiFilters.end_date = `${targetYear}-03-31`; }
        else if (params.get('season') === 'spring') { apiFilters.start_date = `${targetYear}-04-01`; apiFilters.end_date = `${targetYear}-06-30`; }
        else if (params.get('season') === 'summer') { apiFilters.start_date = `${targetYear}-07-01`; apiFilters.end_date = `${targetYear}-09-30`; }
        else if (params.get('season') === 'fall') { apiFilters.start_date = `${targetYear}-10-01`; apiFilters.end_date = `${targetYear}-12-31`; }
        else { apiFilters.start_date = `${targetYear}-01-01`; apiFilters.end_date = `${targetYear}-12-31`; }
      }
      const response = await advancedSearchAnime(apiFilters);
      if (pageNumber === 1) setResults(response.data);
      else setResults(prev => {
          const existingIds = new Set(prev.map(a => a.mal_id));
          return [...prev, ...response.data.filter((a: Anime) => !existingIds.has(a.mal_id))];
      });
      setHasNextPage(response.pagination?.has_next_page || false); setPage(pageNumber);
    } catch (error) { console.error(error); } finally { setLoading(false); setLoadingMore(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value); debouncedFetchInstantResults(e.target.value);
  };

  const toggleGenre = (id: number) => {
    setLocalFilters(p => ({ ...p, genres: p.genres.includes(id.toString()) ? p.genres.filter(g => g !== id.toString()) : [...p.genres, id.toString()] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setInstantResults([]); 
    const newParams = new URLSearchParams();
    if (query.trim()) newParams.set('q', query);
    if (localFilters.type) newParams.set('type', localFilters.type);
    if (localFilters.status) newParams.set('status', localFilters.status);
    if (localFilters.year) newParams.set('year', localFilters.year);
    if (localFilters.season) newParams.set('season', localFilters.season);
    if (localFilters.studioId) newParams.set('studioId', localFilters.studioId);
    if (localFilters.studioName) newParams.set('studioName', localFilters.studioName);
    if (localFilters.genres.length > 0) newParams.set('genres', localFilters.genres.join(','));
    setSearchParams(newParams); setShowFilters(false);
  };

  const clearFilters = () => {
    setQuery(''); setLocalFilters({ type: '', status: '', year: '', season: '', studioId: '', studioName: '', genres: [] });
    setSearchParams({}); setPage(1); setHasNextPage(false);
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
      
      <div className={`max-w-4xl mx-auto transition-all duration-500 ${isDiscoverMode ? 'mt-8 mb-16' : 'mt-0 mb-6'}`}>
        {isDiscoverMode && (
          <h2 className="text-4xl font-black mb-8 text-white text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Encuentra tu próximo anime
          </h2>
        )}
        
        <form onSubmit={handleSubmit} className="relative z-20">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text" value={query} onChange={handleInputChange} placeholder="Buscar animes, peliculas..."
              className="flex-1 p-4 pl-6 text-cyan-50 bg-slate-950 border border-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all font-bold text-sm"
              style={cyberClipCard}
            />
            <div className="flex gap-2 shrink-0">
              <button type="button" title="Filtros Avanzados" onClick={() => setShowFilters(!showFilters)} className={`px-6 font-bold transition-all border flex items-center justify-center ${showFilters ? 'bg-cyan-900 border-cyan-400 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`} style={cyberClipCard}>
                <Filter size={20} />
              </button>
              <button type="submit" className="bg-cyan-500 text-slate-950 px-8 py-4 font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors text-sm" style={cyberClipCard}>
                Buscar
              </button>
            </div>
          </div>

          {instantResults.length > 0 && !showFilters && (
            <div className="absolute top-full left-0 w-full md:w-[calc(100%-180px)] bg-slate-950 mt-2 border border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 overflow-hidden" style={cyberClipCard}>
              {instantResults.map((anime) => (
                <Link key={anime.mal_id} to={`/anime/${anime.mal_id}`} className="flex items-center gap-4 p-3 border-b border-slate-800/50 hover:bg-slate-900 transition-colors last:border-0">
                  <div className="w-12 h-16 bg-slate-900 shrink-0" style={cyberClipCard}><img src={anime.images.jpg.image_url} alt={anime.title} className="w-full h-full object-cover opacity-80" /></div>
                  <div>
                    <p className="text-white text-sm font-bold">{anime.title}</p>
                    <p className="text-xs text-slate-400 font-bold mt-1">{anime.episodes ? `${anime.episodes} episodios` : 'En emisión'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {showFilters && (
            <div className="mt-4 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 p-6 md:p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-in fade-in" style={cyberClipPanel}>
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Filter size={16} className="text-cyan-400"/> Filtros de Búsqueda</h3>
                <button type="button" onClick={() => setShowFilters(false)} className="text-slate-500 hover:text-white transition-colors bg-slate-950 p-2 border border-slate-800" style={cyberClipCard}><X size={16} /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <CustomDropdown label="Formato" placeholder="Cualquier Formato" value={localFilters.type} options={ANIME_TYPES} onChange={(v) => setLocalFilters({...localFilters, type: v})} />
                <CustomDropdown label="Estado" placeholder="Cualquier Estado" value={localFilters.status} options={ANIME_STATUS} onChange={(v) => setLocalFilters({...localFilters, status: v})} />
                <CustomDropdown label="Año" placeholder="Cualquier Año" value={localFilters.year} options={YEARS.map(y=>({value: y.toString(), label: y.toString()}))} onChange={(v) => setLocalFilters({...localFilters, year: v})} />
                
                {/* Filtro de Temporada ahora es independiente del año */}
                <CustomDropdown label="Temporada" placeholder="Cualquier Temporada" value={localFilters.season} options={SEASONS} onChange={(v) => setLocalFilters({...localFilters, season: v})} />
              </div>

              <div className="mb-8">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Géneros</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <button key={genre.id} type="button" onClick={() => toggleGenre(genre.id)} className={`px-4 py-2 text-xs font-bold transition-all border ${localFilters.genres.includes(genre.id.toString()) ? 'bg-cyan-900/50 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'}`} style={cyberClipCard}>{genre.name}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Estudios Populares</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setLocalFilters({...localFilters, studioId: '', studioName: ''})} className={`px-4 py-2 border text-xs font-bold transition-colors ${!localFilters.studioId ? 'bg-cyan-900/50 border-cyan-400 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`} style={cyberClipCard}>Todos</button>
                  {TOP_STUDIOS.map(studio => (
                    <button key={studio.value} type="button" onClick={() => setLocalFilters({...localFilters, studioId: studio.value, studioName: studio.label})} className={`px-4 py-2 border text-xs font-bold transition-colors ${localFilters.studioId === studio.value ? 'bg-cyan-900/50 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white'}`} style={cyberClipCard}>{studio.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>

        {!isDiscoverMode && activeTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 animate-in fade-in">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Filtros Activos:</span>
            {activeTags.map((tag, idx) => (
              <span key={idx} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col justify-center items-center py-32 text-cyan-400 gap-4">
          <Loader2 className="animate-spin" size={36} />
          <span className="font-bold tracking-widest text-sm"></span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-slate-800 pb-4 gap-4 mt-8">
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              Resultados
              <span className="bg-slate-900 text-slate-400 border border-slate-800 text-xs px-3 py-1" style={cyberClipCard}>{results.length} coincidencias</span>
            </h3>
            <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all text-xs font-bold uppercase tracking-widest" style={cyberClipCard}>
              <FilterX size={14} /> Limpiar todo
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {results.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} />)}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-16 mb-8">
              <button onClick={() => executeAdvancedSearch(searchParams, page + 1)} disabled={loadingMore} className="flex items-center gap-3 px-8 py-4 bg-slate-950 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 font-bold uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50" style={cyberClipCard}>
                {loadingMore ? <><Loader2 size={18} className="animate-spin text-cyan-400" /> Cargando...</> : <>Cargar más resultados <Plus size={16} className="text-cyan-400"/></>}
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && results.length === 0 && hasActiveFilters && (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 animate-in fade-in" style={cyberClipPanel}>
          <FilterX size={48} className="mx-auto text-slate-600 mb-4" />
          <p className='text-slate-300 text-xl font-bold mb-2'>No encontramos animes con esos parámetros exactos.</p>
          <p className='text-slate-500'>Ajusta los filtros para ampliar la búsqueda.</p>
          <button onClick={clearFilters} className="inline-block mt-6 px-8 py-3 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors" style={cyberClipCard}>
            Reiniciar Filtros
          </button>
        </div>
      )}

      {isDiscoverMode && (
        <div className="flex flex-col gap-12 animate-in fade-in duration-700">
          <section className="bg-slate-900/80 p-8 border-l-2 border-cyan-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden" style={cyberClipPanel}>
            
            {/* Contenedor Flex centrado con un gap mayor para acercarlos visualmente sin pegarlos a los bordes */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 lg:gap-50 relative z-10 max-w-5xl mx-auto py-4">
              <div className="text-center md:text-left max-w-md">
                <h3 className="text-4xl font-black text-white mb-4 drop-shadow-md">¿No sabes qué ver?</h3>
                <p className="text-slate-400 mb-8 text-lg leading-relaxed">Deja que el destino elija tu próxima aventura. Nuestra base de datos elegirá una serie o película completamente al azar para ti..</p>
                <button onClick={handlePickRandomAnime} disabled={loadingRandom} className="bg-cyan-500 text-slate-950 px-8 py-4 font-black tracking-widest text-xs uppercase hover:bg-cyan-400 transition-colors flex items-center gap-3 mx-auto md:mx-0 disabled:opacity-70" style={cyberClipCard}>
                  {loadingRandom ? <Loader2 size={18} className="animate-spin" /> : <Dices size={18} />} {loadingRandom ? 'Calculando...' : 'Generar Anime al Azar'}
                </button>
              </div>
              <div className="w-full md:w-64 min-h-[350px] flex items-center justify-center bg-slate-950 border border-slate-800 shrink-0" style={cyberClipCard}>
                {randomAnime ? <div className="w-full h-full p-2"><AnimeCard anime={randomAnime} /></div> : <div className="text-slate-600 flex flex-col items-center gap-3"><Dices size={36} className="opacity-50" /><span className="text-sm font-medium">Esperando inicialización</span></div>}
              </div>
            </div>

          </section>

          <section>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-slate-800 pb-4 gap-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              Recomendados para ti
              </h3>
              <button onClick={handleLoadRecommendations} disabled={loadingRecs} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-400 bg-slate-950 px-4 py-2 border border-slate-800 hover:border-cyan-500/50 transition-all disabled:opacity-50" style={cyberClipCard}>
                <RefreshCw size={14} className={loadingRecs ? "animate-spin" : ""} /> Actualizar
              </button>
            </div>
            {loadingRecs ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">{[...Array(6)].map((_, i) => <div key={i} className="bg-slate-900 aspect-[3/4] border border-slate-800 animate-pulse" style={cyberClipCard}></div>)}</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 animate-in fade-in">{recommendations.map((anime) => <div key={anime.mal_id} className="h-full"><AnimeCard anime={anime} /></div>)}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};