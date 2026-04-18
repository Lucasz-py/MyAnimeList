import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Trophy, Clock, Tv, Heart, LogOut, Medal, Star, Flame, Crown, Trash2, Camera, Edit2, Check, X, Info, List, Play, ChevronLeft, ChevronRight } from 'lucide-react';

// --- INTERFACES ESTRICTAS ---
interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}

interface SavedAnime {
  id: string;
  anime_id: number;
  title: string;
  image_url: string;
  status: string;
  episodes_total: number | null;
  score: number | null;
  is_favorite: boolean;
  year: number | null;
  genres: string[];
  studios?: string[];
  duration: string | null;
}

interface UserStats {
  episodes: number;
  minutes: number;
  hours: number;
  days: string;
  completed: number;
  pending: number;
  watching: number;
  favorites: number;
  topGenres: { label: string; count: number }[];
  topStudios: { label: string; count: number }[]; 
}

interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  glowClass?: string;
  containerClass?: string;
  animatedLight?: string;
  shape?: string; 
  difficulty: number;
  req: (s: UserStats) => boolean;
}

// --- FORMAS GEOMÉTRICAS ---
const SHAPES = {
  circle: undefined, 
  hexagon: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  octagon: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)', 
  starburst: 'polygon(50% 0%, 61% 22%, 85% 15%, 78% 39%, 100% 50%, 78% 61%, 85% 85%, 61% 78%, 50% 100%, 39% 78%, 15% 85%, 22% 61%, 0% 50%, 22% 39%, 15% 15%, 39% 22%)' 
};

const parseDurationToMinutes = (durationStr?: string | null): number => {
  if (!durationStr || durationStr === 'Unknown') return 24; 
  let totalMin = 0;
  const hrMatch = durationStr.match(/(\d+)\s*hr/);
  if (hrMatch) totalMin += parseInt(hrMatch[1], 10) * 60;
  const minMatch = durationStr.match(/(\d+)\s*min/);
  if (minMatch) totalMin += parseInt(minMatch[1], 10);
  return totalMin > 0 ? totalMin : 24;
};

// --- LISTA DE LOGROS ---
const ACHIEVEMENTS: Achievement[] = [
  { 
    id: 'dios_anime', name: 'Dios del Anime', desc: 'Acumula 1,000 horas de visualización', icon: Crown, 
    color: 'from-fuchsia-500 to-purple-700', glowClass: 'drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]', 
    containerClass: 'border-[#d946ef] shadow-[0_0_25px_rgba(217,70,239,0.4)] scale-105 z-10', 
    animatedLight: 'bg-[conic-gradient(from_0deg,transparent_0%,transparent_70%,#f0abfc_100%)] animate-[spin_2s_linear_infinite]', 
    shape: SHAPES.starburst, difficulty: 5, req: (s: UserStats) => s.hours >= 1000 
  },
  { 
    id: 'sin_vida', name: 'Leyenda Viva', desc: 'Visualiza 1,000 episodios en total', icon: Flame, 
    color: 'from-red-500 to-rose-700', glowClass: 'drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]', 
    containerClass: 'border-[#e11d48] shadow-[0_0_25px_rgba(225,29,72,0.4)] scale-105 z-10', 
    animatedLight: 'bg-[conic-gradient(from_0deg,transparent_0%,transparent_70%,#fda4af_100%)] animate-[spin_2s_linear_infinite]', 
    shape: SHAPES.starburst, difficulty: 5, req: (s: UserStats) => s.episodes >= 1000 
  },
  { 
    id: 'time_100', name: 'El Viaje del Héroe', desc: 'Acumula 100 horas de visualización', icon: Medal, 
    color: 'from-purple-400 to-purple-700', glowClass: 'drop-shadow-[0_0_8px_rgba(147,51,234,0.6)]', 
    containerClass: 'border-[#9333ea] shadow-[0_0_15px_rgba(147,51,234,0.25)]', 
    animatedLight: 'bg-[conic-gradient(from_0deg,transparent_0%,transparent_80%,#d8b4fe_100%)] animate-[spin_3s_linear_infinite]', 
    shape: SHAPES.octagon, difficulty: 4, req: (s: UserStats) => s.hours >= 100 
  },
  { 
    id: 'maratonista', name: 'Maratonista', desc: 'Visualiza 100 episodios en total', icon: Trophy, 
    color: 'from-orange-400 to-red-500', glowClass: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]', 
    containerClass: 'border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.25)]', 
    animatedLight: 'bg-[conic-gradient(from_0deg,transparent_0%,transparent_80%,#fca5a5_100%)] animate-[spin_3s_linear_infinite]', 
    shape: SHAPES.octagon, difficulty: 4, req: (s: UserStats) => s.episodes >= 100 
  },
  { id: 'otaku_experto', name: 'Otaku Experto', desc: 'Marca 50 animes como completados', icon: Trophy, color: 'from-yellow-400 to-yellow-600', glowClass: 'drop-shadow-[0_0_6px_#eab308]', shape: SHAPES.hexagon, difficulty: 3, req: (s: UserStats) => s.completed >= 50 },
  { id: 'time_24', name: 'Un Día Entero', desc: 'Acumula 24 horas de visualización', icon: Clock, color: 'from-indigo-400 to-indigo-600', glowClass: 'drop-shadow-[0_0_6px_#6366f1]', shape: SHAPES.hexagon, difficulty: 3, req: (s: UserStats) => s.hours >= 24 },
  { id: 'otaku_novato', name: 'Otaku Novato', desc: 'Marca 10 animes como completados', icon: Tv, color: 'from-emerald-400 to-emerald-600', glowClass: 'drop-shadow-[0_0_4px_#10b981]', shape: SHAPES.circle, difficulty: 2, req: (s: UserStats) => s.completed >= 10 },
  { id: 'coleccionista', name: 'Coleccionista', desc: 'Añade 5 animes a tu lista de favoritos', icon: Heart, color: 'from-pink-400 to-pink-600', glowClass: 'drop-shadow-[0_0_4px_#ec4899]', shape: SHAPES.circle, difficulty: 2, req: (s: UserStats) => s.favorites >= 5 },
  { id: 'first_blood', name: 'Primer Paso', desc: 'Marca tu primer anime como completado', icon: Star, color: 'from-blue-400 to-blue-600', glowClass: 'drop-shadow-[0_0_4px_#3b82f6]', shape: SHAPES.circle, difficulty: 1, req: (s: UserStats) => s.completed >= 1 },
].sort((a, b) => b.difficulty - a.difficulty); 

const PROFILE_TABS = [
  { id: 'Favoritos', icon: Heart },
  { id: 'Todos', icon: List },
  { id: 'Completado', icon: Check },
  { id: 'Mirando', icon: Play },
  { id: 'Pendiente', icon: Clock },
];

const ITEMS_PER_PAGE = 24; 

export const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [animes, setAnimes] = useState<SavedAnime[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('Favoritos');
  const [currentPage, setCurrentPage] = useState(1); 
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          navigate('/search');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as UserProfile);
          setNewBio(profileData.bio || '');
        } else {
          setProfile({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            username: currentSession.user.email?.split('@')[0] || 'usuario',
            avatar_url: null,
            bio: null
          });
        }

        const { data: animesData } = await supabase
          .from('saved_animes')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .order('created_at', { ascending: false });

        if (animesData) {
          setAnimes(animesData as SavedAnime[]);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from('saved_animes').delete().eq('id', id);
    if (!error) {
      setAnimes(animes.filter(a => a.id !== id));
    }
  };

  const handleUpdateBio = async () => {
    if (!profile) return;
    try {
      const { error } = await supabase.from('profiles').update({ bio: newBio }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, bio: newBio });
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error actualizando bio:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0 || !profile) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
    } catch (error) {
      console.error('Error subiendo avatar:', error);
      alert('Hubo un error al subir la imagen.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const stats: UserStats = useMemo(() => {
    let episodes = 0;
    let minutes = 0;
    let completed = 0;
    let favorites = 0;
    let pending = 0;
    let watching = 0;
    const genreCounts: Record<string, number> = {};
    const studioCounts: Record<string, number> = {}; 

    animes.forEach(anime => {
      if (anime.is_favorite) favorites++;
      if (anime.status === 'Pendiente') pending++;
      if (anime.status === 'Mirando') watching++;
      if (anime.status === 'Completado') {
        completed++;
        const eps = anime.episodes_total || 1;
        episodes += eps;
        minutes += (eps * parseDurationToMinutes(anime.duration));
        if (anime.genres) anime.genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
        if (anime.studios) anime.studios.forEach(s => { studioCounts[s] = (studioCounts[s] || 0) + 1; });
      }
    });

    return {
      episodes, minutes,
      hours: Math.floor(minutes / 60),
      days: (minutes / 1440).toFixed(1),
      completed, pending, watching, favorites,
      topGenres: Object.entries(genreCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 3),
      topStudios: Object.entries(studioCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 3)
    };
  }, [animes]);

  const filteredAnimes = animes.filter(a => {
    if (activeTab === 'Favoritos') return a.is_favorite;
    if (activeTab === 'Todos') return true;
    return a.status === activeTab;
  });

  const totalPages = Math.ceil(filteredAnimes.length / ITEMS_PER_PAGE);
  const paginatedAnimes = filteredAnimes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const unlockedAchievements = ACHIEVEMENTS.filter(ach => ach.req(stats));

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-[#D6685A]" size={50} /></div>;
  if (!profile) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 pt-32 md:pt-36 font-sans max-w-[1400px]">
      
      {/* CABECERA (FOTO MÁS GRANDE) */}
      <div className="bg-[#1C1C1C] rounded-3xl p-8 border border-neutral-800 shadow-xl mb-12 flex flex-col md:flex-row justify-between items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D6685A] to-purple-600 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-neutral-800/30 to-transparent z-0"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 z-10 w-full">
          <div className="relative group shrink-0">
            {/* TAMAÑO AGRANDADO: w-36 h-36 md:w-48 md:h-48 */}
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-full bg-gradient-to-tr from-[#D6685A] to-purple-600 p-1 shadow-2xl">
              <div className="w-full h-full bg-[#1C1C1C] rounded-full flex items-center justify-center text-6xl md:text-7xl font-black text-white overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.username?.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <label className="absolute bottom-2 right-2 bg-[#D6685A] p-3.5 rounded-full cursor-pointer hover:bg-[#c25a4d] transition-transform hover:scale-110 shadow-lg group-hover:animate-bounce">
              {uploadingAvatar ? <Loader2 size={22} className="text-white animate-spin" /> : <Camera size={22} className="text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
          </div>

          <div className="flex-1 text-center md:text-left pt-2 md:pt-6 w-full max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">@{profile.username}</h1>
            <p className="text-neutral-400 font-medium mb-6 text-lg">{profile.email}</p>
            <div className="bg-neutral-900/50 p-5 rounded-2xl border border-neutral-800/80">
              {isEditingBio ? (
                <div>
                  <textarea autoFocus value={newBio} onChange={(e) => setNewBio(e.target.value)} placeholder="Escribe algo sobre ti..." className="w-full bg-[#1C1C1C] text-white rounded-xl p-3 focus:outline-none focus:border-[#D6685A] border border-neutral-700 min-h-[80px] mb-3 text-sm" maxLength={160}/>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setIsEditingBio(false); setNewBio(profile.bio || ''); }} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors"><X size={18} /></button>
                    <button onClick={handleUpdateBio} className="p-2 rounded-lg bg-[#D6685A] text-white hover:bg-[#c25a4d] transition-colors"><Check size={18} /></button>
                  </div>
                </div>
              ) : (
                <div className="group relative pr-10 cursor-pointer" onClick={() => setIsEditingBio(true)}>
                  <p className="text-neutral-300 text-base leading-relaxed italic">{profile.bio ? `"${profile.bio}"` : "Sin descripción. Haz clic para agregar una."}</p>
                  <button className="absolute top-0 right-0 p-2 text-neutral-500 hover:text-[#D6685A] opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16}/></button>
                </div>
              )}
            </div>
          </div>
        </div>
        <button onClick={handleSignOut} className="z-10 shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 border border-neutral-700 hover:border-red-500/50 transition-all font-bold text-sm mt-4 md:mt-4"><LogOut size={18} /> Cerrar Sesión</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL IZQUIERDO */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6">
          <div className="bg-[#1C1C1C] rounded-3xl p-6 border border-neutral-800 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2"><Tv className="text-[#D6685A]" size={20} /> Estadísticas Globales</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatBox title="Completados" value={stats.completed} color="text-emerald-400" />
              <StatBox title="Pendientes" value={stats.pending} color="text-amber-400" />
              <StatBox title="Mirando" value={stats.watching} color="text-blue-400" />
              <StatBox title="Favoritos" value={stats.favorites} color="text-pink-400" />
              <StatBox title="Eps Vistos" value={stats.episodes} color="text-white" />
              <StatBox title="Total Horas" value={stats.hours} color="text-[#D6685A]" />
              <StatBox title="Total Días" value={stats.days} color="text-purple-400" />
              <StatBox title="Total Minutos" value={stats.minutes} color="text-indigo-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <PodiumCard title="Top 3 Géneros" data={stats.topGenres} />
            <PodiumCard title="Top 3 Estudios" data={stats.topStudios} /> 
          </div>

          <div className="bg-[#1C1C1C] rounded-3xl p-6 border border-neutral-800 shadow-lg mb-8">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2"><Trophy className="text-yellow-500" size={20} /> Vitrina de Logros</h2>
            {unlockedAchievements.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {unlockedAchievements.map(ach => (
                  <div key={ach.id} onClick={() => setSelectedAchievement(ach)} className={`relative p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center group cursor-pointer ${ach.containerClass ? `bg-neutral-900/90 ${ach.containerClass}` : "bg-neutral-900/80 border-neutral-700 hover:border-neutral-400"}`}>
                    <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 hidden group-hover:block w-max max-w-[150px] bg-neutral-800 border border-neutral-600 text-white text-[10px] px-3 py-2 rounded-lg shadow-2xl z-20 animate-in fade-in zoom-in duration-100 pointer-events-none">
                       {ach.desc}<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800"></div>
                    </div>
                    <div className={`transition-transform duration-300 group-hover:scale-110 mb-2 relative ${ach.glowClass || ''}`}>
                      {ach.animatedLight ? (
                        <div className="w-12 h-12 relative flex items-center justify-center overflow-hidden bg-neutral-800" style={ach.shape ? { clipPath: ach.shape } : { borderRadius: '9999px' }}>
                           <div className={`absolute w-[250%] h-[250%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${ach.animatedLight}`}></div>
                           <div className={`absolute inset-[2px] bg-gradient-to-br ${ach.color} flex items-center justify-center`} style={ach.shape ? { clipPath: ach.shape } : { borderRadius: '9999px' }}>
                              <ach.icon size={18} className="text-white drop-shadow-md relative z-10" />
                           </div>
                        </div>
                      ) : (
                        <div className={`w-12 h-12 flex items-center justify-center bg-gradient-to-br ${ach.color}`} style={ach.shape ? { clipPath: ach.shape } : { borderRadius: '9999px' }}>
                          <ach.icon size={18} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-white leading-tight mt-1">{ach.name}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-neutral-500 text-center italic py-4">Sigue explorando para ganar logros.</p>}
          </div>
        </div>

        {/* PANEL DERECHO (GRID 4x6) */}
        <div className="lg:col-span-8 xl:col-span-8">
          <div className="bg-[#1C1C1C] rounded-3xl border border-neutral-800 shadow-lg overflow-hidden min-h-[800px] flex flex-col">
            <div className="flex overflow-x-auto border-b border-neutral-800 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
              {PROFILE_TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[140px] py-5 px-4 text-sm font-bold uppercase tracking-wider transition-colors relative flex items-center justify-center gap-2 ${activeTab === tab.id ? 'text-[#D6685A]' : 'text-neutral-500 hover:text-neutral-300'}`}>
                  <tab.icon size={16} className={activeTab === tab.id ? 'text-[#D6685A]' : 'text-neutral-500'} />{tab.id}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D6685A] shadow-[0_0_10px_rgba(214,104,90,0.8)]"></div>}
                </button>
              ))}
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col">
              {paginatedAnimes.length === 0 ? (
                <div className="text-center py-32 flex flex-col items-center my-auto"><Tv size={48} className="text-neutral-700 mb-4" /><p className="text-neutral-400 text-lg font-medium">Lista vacía.</p></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {paginatedAnimes.map(anime => (
                      <div key={anime.id} className="group relative bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-[#D6685A]/50 transition-colors shadow-sm">
                        <Link to={`/anime/${anime.anime_id}`} className="block relative aspect-[3/4] overflow-hidden">
                          <img src={anime.image_url} alt={anime.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                          <div className="absolute bottom-0 left-0 w-full p-3"><h4 className="text-white text-[11px] md:text-xs font-bold line-clamp-2 leading-tight mb-1.5">{anime.title}</h4>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${anime.status === 'Completado' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-800 border-neutral-600 text-neutral-300'}`}>{anime.status}</span>
                          </div>
                        </Link>
                        <button onClick={() => handleRemove(anime.id)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-neutral-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                        {anime.is_favorite && <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center"><Heart size={14} className="fill-[#D6685A] text-[#D6685A]" /></div>}
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-auto pt-6 border-t border-neutral-800 flex justify-center items-center gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-[#1C1C1C] border border-neutral-700 text-neutral-400 disabled:opacity-50"><ChevronLeft size={18} /></button>
                      <div className="flex gap-1.5 px-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${currentPage === i + 1 ? 'bg-[#D6685A] text-white' : 'bg-neutral-800 text-neutral-400'}`}>{i + 1}</button>
                        ))}
                      </div>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-[#1C1C1C] border border-neutral-700 text-neutral-400 disabled:opacity-50"><ChevronRight size={18} /></button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE MEDALLA */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedAchievement(null)}>
          <div className="bg-[#141414] border border-neutral-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedAchievement(null)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors bg-neutral-800 rounded-full p-1"><X size={20} /></button>
            <div className="flex flex-col items-center text-center">
              <div className={`mb-6 relative ${selectedAchievement.glowClass || ''}`}>
                {selectedAchievement.animatedLight ? (
                  <div className="w-28 h-28 relative flex items-center justify-center overflow-hidden bg-neutral-800" style={selectedAchievement.shape ? { clipPath: selectedAchievement.shape } : { borderRadius: '9999px' }}>
                     <div className={`absolute w-[250%] h-[250%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${selectedAchievement.animatedLight}`}></div>
                     <div className={`absolute inset-[3px] bg-gradient-to-br ${selectedAchievement.color} flex items-center justify-center`} style={selectedAchievement.shape ? { clipPath: selectedAchievement.shape } : { borderRadius: '9999px' }}>
                        <selectedAchievement.icon size={50} className="text-white drop-shadow-lg relative z-10" />
                     </div>
                  </div>
                ) : (
                  <div className={`w-28 h-28 flex items-center justify-center bg-gradient-to-br ${selectedAchievement.color}`} style={selectedAchievement.shape ? { clipPath: selectedAchievement.shape } : { borderRadius: '9999px' }}>
                    <selectedAchievement.icon size={50} className="text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-3xl font-black text-white mb-3">{selectedAchievement.name}</h3>
              <span className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 border bg-[#D6685A]/10 text-[#D6685A] border-[#D6685A]/30">Logro Desbloqueado</span>
              <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 w-full relative">
                <Info size={16} className="absolute top-3 left-3 text-neutral-500" /><p className="text-neutral-400 text-[11px] font-bold uppercase tracking-wider mb-2 ml-4">Requisito Cumplido</p><p className="text-white font-medium text-base">{selectedAchievement.desc}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const StatBox = ({ title, value, color }: { title: string, value: number|string, color: string }) => (
  <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 flex flex-col items-center justify-center text-center transition-all hover:bg-neutral-800/80">
    <span className="text-neutral-500 text-[9px] font-bold uppercase tracking-widest mb-1">{title}</span>
    <span className={`text-xl font-black ${color}`}>{value}</span>
  </div>
);

const PodiumCard = ({ title, data }: { title: string, data: { label: string, count: number }[] }) => {
  const first = data[0]; const second = data[1]; const third = data[2];
  return (
    <div className="bg-[#1C1C1C] p-6 rounded-3xl border border-neutral-800 shadow-lg flex flex-col justify-center h-full min-h-[250px]">
      <p className="text-white font-bold mb-6 flex items-center gap-2 text-sm"><Star className="text-[#D6685A]" size={16} /> {title}</p>
      <div className="flex items-end justify-center gap-2 md:gap-4 h-full mt-auto pt-4">
        {second ? <div className="flex flex-col items-center w-1/3"><span className="text-[10px] md:text-xs font-bold text-neutral-300 text-center mb-2 truncate w-full px-1">{second.label}</span><div className="w-full bg-gradient-to-t from-slate-400 to-slate-300 h-20 rounded-t-lg flex items-start justify-center pt-2 shadow-[0_0_15px_rgba(148,163,184,0.3)] border border-slate-300/20"><span className="text-slate-800 font-black text-xl">2</span></div></div> : <div className="w-1/3"></div>}
        {first ? <div className="flex flex-col items-center w-1/3"><span className="text-xs md:text-sm font-black text-yellow-400 text-center mb-2 truncate w-full px-1">{first.label}</span><div className="w-full bg-gradient-to-t from-yellow-500 to-yellow-300 h-28 rounded-t-lg flex items-start justify-center pt-2 shadow-[0_0_20px_rgba(234,179,8,0.4)] border border-yellow-300/20 z-10"><span className="text-yellow-900 font-black text-2xl">1</span></div></div> : <div className="w-1/3 flex items-center justify-center"><p className="text-[10px] text-neutral-600 italic">Faltan datos</p></div>}
        {third ? <div className="flex flex-col items-center w-1/3"><span className="text-[10px] md:text-xs font-bold text-neutral-300 text-center mb-2 truncate w-full px-1">{third.label}</span><div className="w-full bg-gradient-to-t from-amber-700 to-amber-600 h-14 rounded-t-lg flex items-start justify-center pt-2 shadow-[0_0_15px_rgba(180,83,9,0.3)] border border-amber-500/20"><span className="text-amber-950 font-black text-lg">3</span></div></div> : <div className="w-1/3"></div>}
      </div>
    </div>
  );
};