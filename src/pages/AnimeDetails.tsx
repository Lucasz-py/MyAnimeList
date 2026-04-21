import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeById, getAnimeCharacters, getAnimeStreaming } from '../services/jikanApi';
import type { AnimeFull, Character } from '../types/anime';
import { supabase } from '../lib/supabase';
import { ChevronDown, Check, Trash2, Loader2, Heart, Image as ImageIcon, ExternalLink, Play, Network, Film, Users } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// --- ESTILOS CYBER CORE REUTILIZABLES ---
const cyberClipCard = { clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' };
const cyberClipPanel = { clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))' };

const CyberCrosshairs = () => (
  <>
    <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none z-10"></div>
    <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none z-10"></div>
    <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none z-10"></div>
    <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none z-10"></div>
  </>
);

const getRankingBadgeStyle = (rank: number) => {
  switch (rank) {
    case 1: return "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-white font-black shadow-[0_0_30px_rgba(34,211,238,0.8)] border border-cyan-300"; 
    case 2: return "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 font-black shadow-[0_0_20px_rgba(203,213,225,0.7)] border border-white"; 
    case 3: return "bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black shadow-[0_0_20px_rgba(245,158,11,0.7)] border border-amber-300"; 
    case 4: return "bg-blue-900/80 text-blue-300 border border-blue-400 font-bold shadow-[0_0_15px_rgba(59,130,246,0.6)]"; 
    case 5: return "bg-teal-900/80 text-teal-300 border border-teal-400 font-bold shadow-[0_0_15px_rgba(20,184,166,0.6)]"; 
    default: return "bg-slate-950 border border-slate-700 text-slate-400"; 
  }
};

export const AnimeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<AnimeFull | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [streaming, setStreaming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<Session | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para el progreso (Mirando)
  const [progress, setProgress] = useState<number>(0);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getAvailableStatuses = () => {
    if (!anime) return [];
    if (anime.status === 'Currently Airing') return ['Mirando', 'Pendiente'];
    if (anime.status === 'Not yet aired') return ['Pendiente'];
    return ['Completado', 'Mirando', 'Pendiente'];
  };

  const availableStatuses = getAvailableStatuses();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      try {
        const [animeRes, charsRes, streamingRes] = await Promise.all([
          getAnimeById(id),
          getAnimeCharacters(id),
          getAnimeStreaming(id)
        ]);
        
        setAnime(animeRes.data);
        setCharacters(charsRes.data.slice(0, 18));
        setStreaming(streamingRes.data || []);
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession) {
          const { data: savedData } = await supabase
            .from('saved_animes')
            .select('status, is_favorite, progress')
            .eq('user_id', currentSession.user.id)
            .eq('anime_id', animeRes.data.mal_id)
            .maybeSingle();

          if (savedData) {
            setSavedStatus(savedData.status);
            setIsFavorite(savedData.is_favorite);
            setProgress(savedData.progress || 0);
          }
        }
      } catch (error: unknown) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setPendingStatus(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveAnime = async (newStatus: string, episodesWatched: number = 0) => {
    if (!session || !anime) return;
    setIsSaving(true);
    try {
      const { data: existing } = await supabase.from('saved_animes').select('id').eq('user_id', session.user.id).eq('anime_id', anime.mal_id).maybeSingle();
      const payload = {
        status: newStatus,
        progress: episodesWatched,
        user_id: session.user.id,
        anime_id: anime.mal_id,
        title: anime.title,
        image_url: anime.images.jpg.image_url,
        episodes_total: anime.episodes,
        score: anime.score,
        is_favorite: isFavorite,
        genres: anime.genres?.map(g => g.name) || [],
        studios: anime.studios?.map(s => s.name) || [], 
        duration: anime.duration || null 
      };
      if (existing) await supabase.from('saved_animes').update({ status: newStatus, progress: episodesWatched }).eq('id', existing.id);
      else await supabase.from('saved_animes').insert(payload);
      setSavedStatus(newStatus);
      setProgress(episodesWatched);
      setPendingStatus(null);
      setIsDropdownOpen(false);
    } catch (error) { console.error(error); } 
    finally { setIsSaving(false); }
  };

  const handleToggleFavorite = async () => {
    if (!session || !anime || !savedStatus) return;
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    await supabase.from('saved_animes').update({ is_favorite: newFavoriteState }).eq('user_id', session.user.id).eq('anime_id', anime.mal_id);
  };

  const handleRemoveAnime = async () => {
    if (!session || !anime) return;
    setIsSaving(true);
    await supabase.from('saved_animes').delete().eq('user_id', session.user.id).eq('anime_id', anime.mal_id);
    setSavedStatus(null);
    setIsFavorite(false);
    setIsSaving(false);
    setIsDropdownOpen(false);
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-950"><Loader2 size={24} className="animate-spin text-cyan-400" /></div>;
  if (!anime) return <div className="flex justify-center items-center h-screen bg-slate-950 text-slate-400 font-bold uppercase tracking-widest">Registro no encontrado.</div>;

  const filteredRelations = anime.relations?.filter((rel) => rel.relation.toLowerCase() !== 'adaptation') || [];
  // FILTRO DE STREAMING: Solo Crunchyroll y Netflix
  const filteredStreaming = streaming.filter(s => s.name.toLowerCase().includes('netflix') || s.name.toLowerCase().includes('crunchyroll'));
  const displayYear = anime.year || (anime.aired?.from ? anime.aired.from.substring(0, 4) : 'TBA');

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans overflow-hidden">
      <div className="relative z-10 container mx-auto p-4 md:p-8 pt-32 md:pt-36 max-w-[1350px]">
        
        <Link to="/search" className="inline-flex items-center gap-2 mb-8 text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium">
          <span>&larr;</span> Volver al buscador
        </Link>

        {/* --- PANEL PRINCIPAL (HERO) --- */}
        <div className="bg-slate-900/80 backdrop-blur-xl mb-12 relative flex flex-col md:flex-row border-t-2 border-cyan-500/50 shadow-[0_0_30px_rgba(0,0,0,0.8)]" style={cyberClipPanel}>
          <CyberCrosshairs />
          
          <div className="w-full md:w-[45%] lg:w-[40%] relative bg-slate-950 p-4 md:p-6 flex justify-center items-center z-10">
             <div className="relative w-full h-full max-h-[600px] shadow-[0_0_20px_rgba(6,182,212,0.1)] border-2 border-slate-800" style={cyberClipCard}>
               <img src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} alt={anime.title} className="w-full h-full object-cover" />
             </div>
          </div>

          <div className="p-8 md:p-10 flex-1 flex flex-col relative z-10">
            <div className="flex flex-col xl:flex-row justify-between items-start mb-8 gap-8">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{anime.title}</h1>
                <div className="flex flex-wrap gap-2 mb-6">
                  {anime.genres.map(g => (
                    <span key={g.name} className="bg-slate-950 text-cyan-400 border border-cyan-500/30 text-[10px] px-3 py-1.5 uppercase tracking-widest font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]" style={cyberClipCard}>{g.name}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {anime.rank && <div className={`px-5 py-2 text-[11px] uppercase tracking-widest flex items-center gap-2 ${getRankingBadgeStyle(anime.rank)}`} style={cyberClipCard}>🏆 Rank #{anime.rank}</div>}
                  {anime.popularity && <div className="px-5 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 bg-slate-950 border border-slate-700 text-slate-300" style={cyberClipCard}>🔥 Popularidad #{anime.popularity}</div>}
                </div>
              </div>
              <div className="flex flex-col items-start xl:items-end gap-5 min-w-max">
                <div className="bg-slate-950 p-4 border border-slate-800 w-full xl:w-auto" style={cyberClipCard}>
                    <div className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{anime.score || 'N/A'}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Puntuación Global</div>
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <button onClick={handleToggleFavorite} className={`p-3.5 border transition-all flex items-center justify-center shrink-0 ${isFavorite ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-fuchsia-400 hover:bg-slate-900 hover:border-fuchsia-500/30'}`} style={cyberClipCard} title={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}><Heart size={18} className={isFavorite ? 'fill-cyan-400' : ''} /></button>
                  <div className="relative flex-1" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} disabled={isSaving} className={`flex items-center justify-between gap-3 font-sans font-bold text-xs px-6 py-3.5 transition-all w-full h-full ${savedStatus ? 'bg-slate-950 text-cyan-400 border border-cyan-500/50 hover:bg-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]'}`} style={cyberClipCard}>
                        {isSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : <><span className="flex items-center gap-2">{savedStatus && <Check size={16} className="text-cyan-400" />}{savedStatus || '+ Agregar a mi lista'}</span><ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} /></>}
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute top-full mt-2 right-0 w-full xl:w-64 bg-slate-950 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] z-50 animate-in fade-in" style={cyberClipCard}>
                        {pendingStatus === 'Mirando' ? (
                          <div className="p-5 flex flex-col gap-4">
                            <label className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest text-center">Episodios Vistos</label>
                            <div className="flex items-center justify-center gap-3">
                              <input type="number" min="0" max={anime.episodes || 9999} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-16 bg-slate-900 border border-slate-700 text-white p-2 text-center text-sm focus:border-cyan-400 focus:outline-none font-mono" style={cyberClipCard} autoFocus />
                              <span className="text-slate-500 font-mono text-sm">/ {anime.episodes || '?'}</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => setPendingStatus(null)} className="flex-1 py-2 text-slate-400 bg-slate-900 border border-slate-800 hover:text-white text-[10px] font-bold uppercase transition-colors" style={cyberClipCard}>Atrás</button>
                              <button onClick={() => handleSaveAnime('Mirando', progress)} className="flex-1 py-2 bg-cyan-500 text-slate-950 font-bold text-[10px] uppercase hover:bg-cyan-400 transition-colors" style={cyberClipCard}>Guardar</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {availableStatuses.map(status => (
                              <button key={status} onClick={() => {
                                if (status === 'Mirando') setPendingStatus('Mirando');
                                else if (status === 'Completado') handleSaveAnime('Completado', anime.episodes || 0);
                                else handleSaveAnime(status, 0);
                              }} className={`w-full text-left px-5 py-4 text-[11px] font-bold transition-colors hover:bg-slate-900 flex items-center justify-between border-b border-slate-800/50 last:border-0 ${savedStatus === status ? 'text-cyan-400 bg-slate-900/80' : 'text-slate-400'}`}>{status}{savedStatus === status && <Check size={14} />}</button>
                            ))}
                            {savedStatus && <button onClick={handleRemoveAnime} className="w-full text-left px-5 py-4 text-[11px] font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-slate-800 flex items-center gap-2"><Trash2 size={14} /> Quitar de la lista</button>}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* HUD RÁPIDO DE PROGRESO */}
                {savedStatus === 'Mirando' && (
                  <div className="mt-1 flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-2.5 w-full" style={cyberClipCard}>
                     <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>Progreso</span>
                     <div className="flex items-center gap-4">
                       <button onClick={() => handleSaveAnime('Mirando', Math.max(0, progress - 1))} disabled={progress <= 0 || isSaving} className="w-6 h-6 flex items-center justify-center bg-slate-900 text-slate-400 border border-slate-800 hover:text-cyan-400 disabled:opacity-50 transition-colors" style={cyberClipCard}>-</button>
                       <span className="text-white font-mono text-sm font-bold w-12 text-center">{progress} <span className="text-slate-600 text-xs">/ {anime.episodes || '?'}</span></span>
                       <button onClick={() => {
                          const newProg = progress + 1;
                          if (anime.episodes && newProg >= anime.episodes) handleSaveAnime('Completado', anime.episodes);
                          else handleSaveAnime('Mirando', newProg);
                       }} disabled={isSaving} className="w-6 h-6 flex items-center justify-center bg-slate-900 text-slate-400 border border-slate-800 hover:text-cyan-400 disabled:opacity-50 transition-colors" style={cyberClipCard}>+</button>
                     </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              <MetadataBox label="Formato" value={anime.type || 'Desconocido'} />
              <MetadataBox label="Estado" value={anime.status} />
              <MetadataBox label="Episodios" value={anime.episodes || 'En emisión'} />
              <MetadataBox label="Año" value={displayYear} />
              <MetadataBox label="Estudio" value={anime.studios?.[0]?.name || 'Desconocido'} isLink link={`/search?studioId=${anime.studios?.[0]?.mal_id}&studioName=${encodeURIComponent(anime.studios?.[0]?.name || '')}`} />
            </div>

            <div className="mt-auto">
              <h3 className="text-xl font-black text-white mb-4">Sinopsis</h3>
              <p className="text-slate-300 text-base leading-relaxed">{anime.synopsis || 'Sinopsis no disponible en la base de datos.'}</p>
            </div>
          </div>
        </div>

        {/* --- CONTENIDO RELACIONADO --- */}
        {filteredRelations.length > 0 && (
          <section className="mb-16">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Network size={24} className="text-cyan-400" /> Contenido Relacionado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRelations.map((rel, index) => (
                <div key={index} className="bg-slate-900/80 p-5 border border-slate-800 relative group" style={cyberClipCard}>
                  <CyberCrosshairs />
                  <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest block border-b border-slate-800 pb-2 mb-4 relative z-10">{rel.relation}</span>
                  <div className="flex flex-col gap-3 relative z-10">
                    {rel.entry.map(entry => <RelatedEntryItem key={entry.mal_id} entry={entry} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- SECCIÓN DE STREAMING (Crunchyroll/Netflix solamente) --- */}
        {/* --- SECCIÓN DE STREAMING (Crunchyroll/Netflix solamente) --- */}
        {filteredStreaming.length > 0 && (
          <section className="mb-16">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Play size={24} className="text-cyan-400" /> Plataformas de Streaming
            </h3>
            
            <div className="flex flex-wrap gap-4">
              {filteredStreaming.map((link) => {
                const isNetflix = link.name.toLowerCase().includes('netflix');
                const isCrunchyroll = link.name.toLowerCase().includes('crunchyroll');
                
                return (
                  <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-3 text-sm font-bold text-slate-300 transition-all group ${
                      isNetflix ? 'hover:text-white hover:border-red-600/50 hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 
                      isCrunchyroll ? 'hover:text-white hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 
                      'hover:text-cyan-400 hover:border-cyan-500/50'
                    }`}
                    style={cyberClipCard}
                  >
                    {isNetflix && <img src="/logon.png" alt="Netflix" className="w-5 h-5 object-contain" />}
                    {isCrunchyroll && <img src="/logoc.png" alt="Crunchyroll" className="w-5 h-5 object-contain" />}
                    
                    {link.name}
                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                  </a>
                );
              })}
            </div>

            {/* --- NUEVA ACLARACIÓN DE REGIÓN --- */}
            <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="text-cyan-500">*</span> Tal vez no disponible en tu región
            </p>
          </section>
        )}

        {/* --- TRAILER OFICIAL --- */}
        <section className="mb-16">
          <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <Film size={24} className="text-cyan-400" /> Trailer Oficial
          </h3>
          {anime.trailer?.embed_url || anime.trailer?.youtube_id ? (
            <div className="aspect-video w-full bg-slate-900 relative shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 border-slate-800 hover:border-cyan-500/30 transition-colors p-1" style={cyberClipPanel}>
              <CyberCrosshairs />
              <div className="w-full h-full relative z-10" style={cyberClipPanel}>
                <iframe src={anime.trailer.embed_url || `https://www.youtube.com/embed/${anime.trailer.youtube_id}`} title="Trailer" className="w-full h-full" allowFullScreen></iframe>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 py-16 px-8 border border-slate-800 flex flex-col items-center justify-center text-center relative" style={cyberClipPanel}>
              <CyberCrosshairs />
              <span className="text-slate-400 font-bold text-lg mb-6 relative z-10">No se encontraro trailer oficial.</span>
              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' trailer oficial')}`} target="_blank" rel="noopener noreferrer" className="bg-slate-950 text-white font-bold text-sm px-6 py-3 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500/50 transition-all relative z-10" style={cyberClipCard}>Buscar en YouTube</a>
            </div>
          )}
        </section>

        {/* --- PERSONAJES --- */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <Users size={24} className="text-cyan-400" /> Personajes 
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {characters.length > 0 ? (
              characters.map((char) => (
                <div key={char.character.mal_id} className="bg-slate-950 relative group border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]" style={cyberClipCard}>
                  <div className="aspect-[3/4] overflow-hidden relative bg-slate-950">
                    <img src={char.character.images.jpg.image_url} alt={char.character.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                  </div>
                  <div className="absolute bottom-0 w-full p-3 bg-gradient-to-t from-slate-950 to-transparent">
                    <h4 className="text-white text-xs font-bold truncate mb-1 drop-shadow-md">{char.character.name}</h4>
                    <p className="text-cyan-400 text-[10px] font-bold">{char.role}</p>
                  </div>
                </div>
              ))
            ) : <div className="col-span-full bg-slate-900/50 border border-slate-800 p-8 flex justify-center text-center" style={cyberClipCard}><p className="text-slate-500 font-bold italic">No se encontraron personajes.</p></div>}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTES AUXILIARES ---

const MetadataBox = ({ label, value, isLink, link }: { label: string, value: string | number, isLink?: boolean, link?: string }) => (
  <div className="bg-slate-950 p-4 border border-slate-800 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-900 hover:border-cyan-500/50 group" style={cyberClipCard}>
    <span className="flex items-center gap-1.5 text-slate-500 text-[9px] font-sans font-bold uppercase tracking-widest mb-1.5 group-hover:text-cyan-400/70 transition-colors">{label}</span>
    {isLink && link ? <Link to={link} className="text-lg font-sans font-black text-white hover:text-cyan-400 transition-colors truncate w-full px-2">{value}</Link> : <span className="text-lg font-sans font-black text-white">{value}</span>}
  </div>
);

const RelatedEntryItem = ({ entry }: { entry: { mal_id: number, type: string, name: string } }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(entry.type === 'anime' || entry.type === 'manga');
  useEffect(() => {
    let isMounted = true; 
    if (entry.type === 'anime' || entry.type === 'manga') {
      fetch(`https://api.jikan.moe/v4/${entry.type}/${entry.mal_id}`).then(res => res.json()).then(data => { if (isMounted && data.data?.images?.jpg?.image_url) setImageUrl(data.data.images.jpg.image_url); }).finally(() => { if (isMounted) setIsLoading(false); });
    }
    return () => { isMounted = false; };
  }, [entry.mal_id, entry.type]);
  const isClickable = entry.type === 'anime';
  const ContentBody = (
    <div className={`flex items-center gap-3 p-2 bg-slate-950 border border-slate-800 transition-colors ${isClickable ? 'hover:border-cyan-500/50 hover:bg-slate-900 group' : 'opacity-70'}`} style={cyberClipCard}>
      <div className="w-10 h-14 shrink-0 bg-slate-900 flex items-center justify-center overflow-hidden border-r border-slate-800" style={cyberClipCard}>
        {isLoading ? <Loader2 size={14} className="text-cyan-500/50 animate-spin" /> : imageUrl ? <img src={imageUrl} alt={entry.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" /> : <ImageIcon size={16} className="text-slate-600" />}
      </div>
      <div className="flex flex-col flex-1 min-w-0 pr-2">
        <span className={`text-[11px] font-bold line-clamp-2 leading-snug ${isClickable ? 'text-white group-hover:text-cyan-400 transition-colors' : 'text-slate-400'}`}>{entry.name}</span>
        <span className="text-[9px] uppercase font-bold text-slate-500 mt-1">Formato: {entry.type}</span>
      </div>
    </div>
  );
  return isClickable ? <Link to={`/anime/${entry.mal_id}`}>{ContentBody}</Link> : <div>{ContentBody}</div>;
};