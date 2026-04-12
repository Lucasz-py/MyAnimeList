import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeById, getAnimeCharacters } from '../services/jikanApi';
import type { AnimeFull, Character } from '../types/anime';
import { supabase } from '../lib/supabase';
import { ChevronDown, Check, Trash2, Loader2, Heart, Image as ImageIcon } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export const AnimeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<AnimeFull | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<Session | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const STATUS_OPTIONS = ['Completado', 'Mirando', 'Pendiente'];

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      try {
        const [animeRes, charsRes] = await Promise.all([
          getAnimeById(id),
          getAnimeCharacters(id)
        ]);
        
        setAnime(animeRes.data);
        const allCharacters = charsRes.data.slice(0, 18);
        setCharacters(allCharacters);
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession) {
          const { data: savedData } = await supabase
            .from('saved_animes')
            .select('status, is_favorite')
            .eq('user_id', currentSession.user.id)
            .eq('anime_id', animeRes.data.mal_id)
            .maybeSingle();

          if (savedData) {
            setSavedStatus(savedData.status);
            setIsFavorite(savedData.is_favorite);
          }
        }
      } catch (error: unknown) {
        console.error("Error al cargar los detalles:", error);
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveAnime = async (newStatus: string) => {
    if (!session || !anime) {
      alert("Debes iniciar sesión para guardar animes en tu colección.");
      return;
    }

    setIsSaving(true);
    setIsDropdownOpen(false);

    try {
      const { data: existing } = await supabase
        .from('saved_animes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('anime_id', anime.mal_id)
        .maybeSingle();

      if (existing) {
        // Si ya existe, solo actualizamos el estado
        const { error } = await supabase
          .from('saved_animes')
          .update({ status: newStatus })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // --- AQUÍ GUARDAMOS LOS DATOS ANALÍTICOS NUEVOS ---
        const { error } = await supabase
          .from('saved_animes')
          .insert({
            user_id: session.user.id,
            anime_id: anime.mal_id,
            title: anime.title,
            image_url: anime.images.jpg.image_url,
            status: newStatus,
            episodes_total: anime.episodes,
            score: anime.score,
            is_favorite: isFavorite,
            year: anime.year || (anime.aired?.from ? parseInt(anime.aired.from.substring(0, 4)) : null),
            genres: anime.genres?.map(g => g.name) || [],
            duration: anime.duration || null 
          });
        if (error) throw error;
      }

      setSavedStatus(newStatus);
    } catch (error: unknown) {
      console.error("Error guardando anime:", error);
      alert("Hubo un error al guardar. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!session || !anime) return;
    
    if (!savedStatus) {
      alert("Primero debes agregar el anime a una lista antes de marcarlo como favorito.");
      return;
    }

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState); 

    try {
      const { error } = await supabase
        .from('saved_animes')
        .update({ is_favorite: newFavoriteState })
        .eq('user_id', session.user.id)
        .eq('anime_id', anime.mal_id);

      if (error) throw error;
    } catch (error: unknown) {
      console.error("Error al actualizar favorito:", error);
      setIsFavorite(!newFavoriteState); 
    }
  };

  const handleRemoveAnime = async () => {
    if (!session || !anime) return;
    
    setIsSaving(true);
    setIsDropdownOpen(false);

    try {
      const { error } = await supabase
        .from('saved_animes')
        .delete()
        .eq('user_id', session.user.id)
        .eq('anime_id', anime.mal_id);

      if (error) throw error;
      setSavedStatus(null);
      setIsFavorite(false);
    } catch (error: unknown) {
      console.error("Error eliminando anime:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[80vh]"><div className="text-[#D6685A] animate-pulse text-xl font-medium">Cargando información...</div></div>;
  if (!anime) return <div className="text-center mt-20 text-neutral-400 text-lg">No se encontró información.</div>;

  const filteredRelations = anime.relations?.filter((rel) => rel.relation.toLowerCase() !== 'adaptation') || [];

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-[1350px] font-sans">
      <Link to="/search" className="text-neutral-400 hover:text-[#D6685A] mb-8 inline-flex items-center gap-2 text-sm font-medium transition-colors">
        <span>&larr;</span> Volver al buscador
      </Link>

      <div className="bg-[#1C1C1C] rounded-3xl overflow-hidden shadow-2xl mb-16 relative z-0 border border-neutral-800/50">
        <div className="flex flex-col md:flex-row md:items-stretch">
          
          <div className="w-full md:w-[35%] lg:w-[30%] relative bg-neutral-900 p-6 md:p-8 flex justify-center items-center">
            <img src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} alt={anime.title} className="w-full h-auto object-contain rounded-xl shadow-xl border border-neutral-800" />
          </div>

          <div className="p-8 md:p-12 flex-1 text-lg flex flex-col">
            <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{anime.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map(g => (
                    <span key={g.name} className="bg-[#D6685A]/10 text-[#D6685A] border border-[#D6685A]/20 text-sm px-4 py-1.5 rounded-full font-medium">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-start lg:items-end gap-4 min-w-max">
                <div className="text-left lg:text-right">
                    <div className="text-5xl font-extrabold text-[#D6685A]">{anime.score || 'N/A'}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-widest mt-1">Puntuación Global</div>
                </div>
                
                <div className="flex gap-2 w-full lg:w-auto mt-2">
                  <button 
                    onClick={handleToggleFavorite}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isFavorite 
                        ? 'bg-[#D6685A]/10 border-[#D6685A] text-[#D6685A]' 
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700'
                    }`}
                    title={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
                  >
                    <Heart size={20} className={isFavorite ? 'fill-[#D6685A]' : ''} />
                  </button>

                  <div className="relative flex-1" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isSaving}
                        className={`flex items-center justify-between gap-3 font-medium text-base px-6 py-3.5 rounded-xl transition-all shadow-lg w-full ${
                          savedStatus 
                            ? 'bg-neutral-800 text-white border border-[#D6685A]/50 hover:bg-neutral-700' 
                            : 'bg-[#D6685A] text-white hover:bg-[#c25a4d] shadow-[#D6685A]/20'
                        }`}
                    >
                        {isSaving ? (
                          <Loader2 size={20} className="animate-spin mx-auto" />
                        ) : (
                          <>
                            <span className="flex items-center gap-2">
                              {savedStatus && <Check size={18} className="text-[#D6685A]" />}
                              {savedStatus || '+ Agregar a mi lista'}
                            </span>
                            <ChevronDown size={18} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </>
                        )}
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute top-full mt-2 right-0 w-full lg:w-48 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        {STATUS_OPTIONS.map(status => (
                          <button
                            key={status}
                            onClick={() => handleSaveAnime(status)}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-neutral-700 flex items-center justify-between ${savedStatus === status ? 'text-[#D6685A] font-bold bg-neutral-700/50' : 'text-neutral-300'}`}
                          >
                            {status}
                            {savedStatus === status && <Check size={16} />}
                          </button>
                        ))}
                        
                        {savedStatus && (
                          <button
                            onClick={handleRemoveAnime}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-neutral-700 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Quitar de la lista
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 text-base">
              <div className="bg-neutral-800/30 p-5 rounded-2xl">
                <span className="text-neutral-400 text-xs uppercase tracking-wider block mb-1.5">Estado</span>
                <span className="text-white font-medium">{anime.status}</span>
              </div>
              <div className="bg-neutral-800/30 p-5 rounded-2xl">
                <span className="text-neutral-400 text-xs uppercase tracking-wider block mb-1.5">Episodios</span>
                <span className="text-white font-medium">{anime.episodes || 'En emisión'}</span>
              </div>
              <div className="bg-neutral-800/30 p-5 rounded-2xl">
                <span className="text-neutral-400 text-xs uppercase tracking-wider block mb-1.5">Año</span>
                <span className="text-white font-medium">{anime.year || 'TBA'}</span>
              </div>
              <div className="bg-neutral-800/30 p-5 rounded-2xl">
                <span className="text-neutral-400 text-xs uppercase tracking-wider block mb-1.5">Estudio</span>
                <span className="text-white font-medium">{anime.studios[0]?.name || 'Desconocido'}</span>
              </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-xl font-bold text-white mb-4">Sinopsis</h3>
              <p className="text-neutral-300 text-base leading-relaxed">
                {anime.synopsis || 'Sinopsis no disponible en este momento.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {filteredRelations.length > 0 && (
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">Contenido Relacionado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRelations.map((rel, index) => (
              <div key={index} className="bg-[#1C1C1C] p-5 rounded-2xl border border-neutral-800/50 shadow-sm flex flex-col gap-4">
                <span className="text-[#D6685A] text-xs font-bold uppercase tracking-wider block border-b border-neutral-800 pb-2">
                  {rel.relation}
                </span>
                <div className="flex flex-col gap-2">
                  {rel.entry.map(entry => (
                    <RelatedEntryItem key={entry.mal_id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-16">
        <h3 className="text-2xl font-bold text-white mb-6">Tráiler Oficial</h3>
        {anime.trailer?.embed_url || anime.trailer?.youtube_id ? (
          <div className="aspect-video w-full rounded-3xl overflow-hidden bg-[#1C1C1C] shadow-lg border border-neutral-800/50">
            <iframe src={anime.trailer.embed_url || `https://www.youtube.com/embed/${anime.trailer.youtube_id}`} title="Trailer" className="w-full h-full" allowFullScreen></iframe>
          </div>
        ) : (
          <div className="bg-[#1C1C1C] py-16 px-8 rounded-3xl border border-neutral-800/50 flex flex-col items-center justify-center text-center">
            <span className="text-neutral-400 text-lg mb-6">No hay un video registrado para esta serie.</span>
            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' trailer oficial')}`} target="_blank" rel="noopener noreferrer" className="bg-neutral-800 text-white font-medium text-sm px-6 py-3 rounded-xl hover:bg-neutral-700 transition-colors">Buscar en YouTube</a>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Personajes Principales</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {characters.length > 0 ? (
            characters.map((char) => (
              <div key={char.character.mal_id} className="bg-[#1C1C1C] rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-xl border border-neutral-800/50">
                <div className="aspect-[3/4] overflow-hidden relative bg-neutral-900">
                  <img src={char.character.images.jpg.image_url} alt={char.character.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex flex-col justify-center bg-[#1C1C1C]">
                  <h4 className="text-white text-sm font-bold truncate mb-1">{char.character.name}</h4>
                  <p className="text-[#D6685A] text-xs font-medium">{char.role}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-neutral-500 col-span-full text-center py-8">No se encontraron personajes registrados.</p>
          )}
        </div>
      </section>
    </div>
  );
};


// --- SUB-COMPONENTE PARA BUSCAR IMÁGENES DE CONTENIDO RELACIONADO ---
const RelatedEntryItem = ({ entry }: { entry: { mal_id: number, type: string, name: string } }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(entry.type === 'anime' || entry.type === 'manga');

  useEffect(() => {
    let isMounted = true; 

    if (entry.type === 'anime' || entry.type === 'manga') {
      fetch(`https://api.jikan.moe/v4/${entry.type}/${entry.mal_id}`)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.data?.images?.jpg?.image_url) {
            setImageUrl(data.data.images.jpg.image_url);
          }
        })
        .catch(err => console.error("Error cargando imagen relacionada:", err))
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [entry.mal_id, entry.type]);

  const isClickable = entry.type === 'anime';

  const ContentBody = (
    <div className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isClickable ? 'hover:bg-neutral-800 group' : 'opacity-70'}`}>
      
      <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center border border-neutral-700">
        {isLoading ? (
          <Loader2 size={16} className="text-neutral-500 animate-spin" />
        ) : imageUrl ? (
          <img src={imageUrl} alt={entry.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <ImageIcon size={20} className="text-neutral-600" />
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <span className={`text-sm font-bold line-clamp-2 leading-snug ${isClickable ? 'text-white group-hover:text-[#D6685A] transition-colors' : 'text-neutral-300'}`}>
          {entry.name}
        </span>
        <span className="text-[10px] uppercase font-bold text-neutral-500 mt-1">
          Formato: {entry.type}
        </span>
      </div>
    </div>
  );

  return isClickable ? (
    <Link to={`/anime/${entry.mal_id}`}>
      {ContentBody}
    </Link>
  ) : (
    <div>
      {ContentBody}
    </div>
  );
};