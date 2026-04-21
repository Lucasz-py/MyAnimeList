import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2,Trophy, Clock, Tv, Heart, LogOut, Medal, Star, Flame, Crown, Trash2, Camera, Edit2, Check, X, Info, List, Play, ChevronLeft, ChevronRight } from 'lucide-react';

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
  progress?: number | null; 
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
    color: 'from-fuchsia-500 to-purple-700', glowClass: 'drop-shadow-[0_0_25px_rgba(217,70,239,1)] scale-110', 
    containerClass: 'bg-slate-900/60 hover:bg-slate-800/60 border-l-2 border-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.3)]', 
    animatedLight: 'bg-[conic-gradient(from_0deg,transparent_0%,transparent_50%,#f0abfc_100%)] animate-[spin_1s_linear_infinite]', 
    shape: SHAPES.starburst, difficulty: 5, req: (s: UserStats) => s.hours >= 1000 
  },
  { 
    id: 'sin_vida', name: 'Leyenda Viva', desc: 'Visualiza 1,000 episodios en total', icon: Flame, 
    color: 'from-red-500 to-rose-700', glowClass: 'drop-shadow-[0_0_25px_rgba(225,29,72,1)] scale-110', 
    containerClass: 'bg-slate-900/60 hover:bg-slate-800/60 border-l-2 border-rose-500 shadow-[0_0_25px_rgba(225,29,72,0.3)]', 
    animatedLight: 'bg-[conic-gradient(from_0deg,transparent_0%,transparent_50%,#fda4af_100%)] animate-[spin_1s_linear_infinite]', 
    shape: SHAPES.starburst, difficulty: 5, req: (s: UserStats) => s.episodes >= 1000 
  },
  { 
    id: 'time_100', name: 'El Viaje del Héroe', desc: 'Acumula 100 horas de visualización', icon: Medal, 
    color: 'from-purple-400 to-purple-700', glowClass: 'drop-shadow-[0_0_12px_rgba(147,51,234,0.8)]', 
    containerClass: 'bg-slate-900/60 hover:bg-slate-800/60 border-l-2 border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.15)]', 
    animatedLight: 'bg-[conic-gradient(from_0deg,transparent_0%,transparent_80%,#d8b4fe_100%)] animate-[spin_3s_linear_infinite]', 
    shape: SHAPES.octagon, difficulty: 4, req: (s: UserStats) => s.hours >= 100 
  },
  { 
    id: 'maratonista', name: 'Maratonista', desc: 'Visualiza 100 episodios en total', icon: Trophy, 
    color: 'from-orange-400 to-red-500', glowClass: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]', 
    containerClass: 'bg-slate-900/60 hover:bg-slate-800/60 border-l-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]', 
    animatedLight: 'bg-[conic-gradient(from_0deg,transparent_0%,transparent_80%,#fca5a5_100%)] animate-[spin_3s_linear_infinite]', 
    shape: SHAPES.octagon, difficulty: 4, req: (s: UserStats) => s.episodes >= 100 
  },
  { 
    id: 'otaku_experto', name: 'Otaku Experto', desc: 'Marca 50 animes como completados', icon: Trophy, 
    color: 'from-yellow-400 to-yellow-600', glowClass: 'drop-shadow-[0_0_10px_#eab308]', 
    containerClass: 'bg-slate-900/60 hover:bg-slate-800/60 border-l-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]',
    shape: SHAPES.hexagon, difficulty: 3, req: (s: UserStats) => s.completed >= 50 
  },
  { 
    id: 'time_24', name: 'Un Día Entero', desc: 'Acumula 24 horas de visualización', icon: Clock, 
    color: 'from-blue-500 to-indigo-600', glowClass: 'drop-shadow-[0_0_10px_#3b82f6]', 
    containerClass: 'bg-slate-900/60 hover:bg-slate-800/60 border-l-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    shape: SHAPES.hexagon, difficulty: 3, req: (s: UserStats) => s.hours >= 24 
  },
  { 
    id: 'otaku_novato', name: 'Otaku Novato', desc: 'Marca 10 animes como completados', icon: Tv, 
    color: 'from-teal-400 to-teal-600', glowClass: 'drop-shadow-[0_0_6px_#2dd4bf]', 
    containerClass: 'bg-slate-900/60 hover:bg-slate-800/60 border-l-2 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.15)]',
    shape: SHAPES.circle, difficulty: 2, req: (s: UserStats) => s.completed >= 10 
  },
  { 
    id: 'coleccionista', name: 'Coleccionista', desc: 'Añade 5 animes a tu lista de favoritos', icon: Heart, 
    color: 'from-fuchsia-400 to-fuchsia-600', glowClass: 'drop-shadow-[0_0_6px_#e879f9]', 
    containerClass: 'bg-slate-900/60 hover:bg-slate-800/60 border-l-2 border-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.15)]',
    shape: SHAPES.circle, difficulty: 2, req: (s: UserStats) => s.favorites >= 5 
  },
  { 
    id: 'first_blood', name: 'Primer Paso', desc: 'Marca tu primer anime como completado', icon: Star, 
    color: 'from-cyan-400 to-blue-500', glowClass: 'drop-shadow-[0_0_6px_#22d3ee]', 
    containerClass: 'bg-slate-900/60 hover:bg-slate-800/60 border-l-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]',
    shape: SHAPES.circle, difficulty: 1, req: (s: UserStats) => s.completed >= 1 
  },
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
      const filteredLength = filteredAnimes.length - 1;
      const newTotalPages = Math.ceil(filteredLength / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
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
      
      let epsWatched = 0;

      if (anime.status === 'Completado') {
        completed++;
        epsWatched = anime.episodes_total || anime.progress || 1;
        
        if (anime.genres) anime.genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
        if (anime.studios) anime.studios.forEach(s => { studioCounts[s] = (studioCounts[s] || 0) + 1; }); 
      } 
      else if (anime.status === 'Mirando') {
        watching++;
        epsWatched = anime.progress || 0;
      }

      if (epsWatched > 0) {
        episodes += epsWatched;
        minutes += (epsWatched * parseDurationToMinutes(anime.duration));
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

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-950"><Loader2 className="animate-spin text-cyan-400" size={50} /></div>;
  if (!profile) return null;

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans overflow-hidden">
      
      <div className="relative z-10 container mx-auto p-4 md:p-8 pt-32 md:pt-36 max-w-[1400px]">
        
        {/* --- CABECERA --- */}
        <div 
          className="bg-slate-900/80 backdrop-blur-xl p-8 mb-12 flex flex-col md:flex-row justify-between items-center md:items-start gap-8 relative group"
          style={cyberClipPanel}
        >
          <CyberCrosshairs />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10 w-full relative z-10">
            <div className="relative shrink-0">
              <div 
                className="w-40 h-40 md:w-52 md:h-52 bg-slate-950 flex items-center justify-center text-6xl md:text-7xl font-black text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.2)] border-2 border-slate-800"
                style={cyberClipPanel}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.username?.charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute bottom-2 right-2 bg-cyan-500 text-slate-950 p-3.5 cursor-pointer hover:bg-cyan-400 transition-transform hover:scale-110 shadow-[0_0_15px_rgba(6,182,212,0.6)]" style={cyberClipCard}>
                {uploadingAvatar ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>

            <div className="flex-1 text-center md:text-left pt-2 md:pt-6 w-full max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-sans font-black text-white mb-1 tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                {profile.username}
              </h1>
              <p className="text-cyan-400/60 font-mono mb-6 text-xs tracking-widest">{profile.email}</p>
              
              <div className="bg-slate-950/80 p-5 border-l-2 border-slate-700 hover:border-cyan-500/50 transition-colors" style={cyberClipCard}>
                {isEditingBio ? (
                  <div>
                    <textarea autoFocus value={newBio} onChange={(e) => setNewBio(e.target.value)} placeholder="Escribe algo sobre ti..." className="w-full bg-slate-900 text-cyan-50 font-sans p-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 border border-slate-800 min-h-[80px] mb-3 text-sm placeholder:text-slate-600" maxLength={160} style={cyberClipCard}/>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setIsEditingBio(false); setNewBio(profile.bio || ''); }} className="p-2 text-slate-500 hover:text-white transition-colors" style={cyberClipCard}><X size={18} /></button>
                      <button onClick={handleUpdateBio} className="px-4 py-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-sans font-bold text-xs uppercase tracking-wider transition-all" style={cyberClipCard}>Guardar</button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative pr-10 cursor-pointer" onClick={() => setIsEditingBio(true)}>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed font-sans">
                      {profile.bio ? profile.bio : "Sin información. Haz clic para agregar una descripción."}
                    </p>
                    <button className="absolute top-0 right-0 p-2 text-slate-600 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16}/></button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button onClick={handleSignOut} className="z-10 shrink-0 flex items-center gap-2 px-6 py-3.5 bg-slate-950 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-all font-sans font-bold text-xs uppercase tracking-wider mt-4 md:mt-4" style={cyberClipCard}>
            Cerrar Sesión <LogOut size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- PANEL IZQUIERDO (DASHBOARD) --- */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6">
            
            <div className="bg-slate-900/80 backdrop-blur-md p-6 border-t-2 border-cyan-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative" style={cyberClipPanel}>
              <CyberCrosshairs />
              <h2 className="text-lg font-sans font-bold text-cyan-400 mb-5 flex items-center gap-2">
                <Tv size={20} /> Estadísticas Personales
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <StatBox title="Completados" value={stats.completed} color="text-teal-400" />
                <StatBox title="Pendientes" value={stats.pending} color="text-yellow-400" />
                <StatBox title="Mirando" value={stats.watching} color="text-sky-400" />
                <StatBox title="Favoritos" value={stats.favorites} color="text-fuchsia-400" />
                <StatBox title="Episodios Vistos" value={`${stats.episodes}`} color="text-cyan-50" />
                <StatBox title="Total en Horas" value={`${stats.hours} hs`} color="text-cyan-400" />
                <StatBox title="Total en Días" value={`${stats.days}`} color="text-purple-400" />
                <StatBox title="Total en Minutos" value={`${stats.minutes} min`} color="text-blue-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <PodiumCard title="Géneros Favoritos" data={stats.topGenres} />
              <PodiumCard title="Estudios Favoritos" data={stats.topStudios} /> 
            </div>

            {/* --- VITRINA DE LOGROS --- */}
            <div className="bg-slate-900/80 backdrop-blur-md p-6 border-b-2 border-cyan-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-8 relative" style={cyberClipPanel}>
              <CyberCrosshairs />
              <h2 className="text-lg font-sans font-bold text-yellow-400 mb-5 flex items-center gap-2">
                <Trophy size={20} /> Vitrina de Logros
              </h2>
              {unlockedAchievements.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {unlockedAchievements.map(ach => (
                    <div key={ach.id} onClick={() => setSelectedAchievement(ach)} className={`relative p-2.5 transition-all duration-300 flex flex-col items-center text-center group cursor-pointer ${ach.containerClass ? ach.containerClass : "bg-slate-900/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-slate-800 hover:border-cyan-400/50 hover:bg-slate-800/80"}`} style={cyberClipCard}>
                      <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 hidden group-hover:block w-max max-w-[150px] bg-slate-950 border border-cyan-500/50 text-cyan-50 text-[10px] font-sans px-3 py-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] z-20 animate-in fade-in pointer-events-none" style={cyberClipCard}>
                         {ach.desc}
                      </div>
                      <div className={`transition-transform duration-300 group-hover:scale-110 mb-2 relative ${ach.glowClass || ''}`}>
                        {ach.animatedLight ? (
                          <div className="w-10 h-10 relative flex items-center justify-center overflow-hidden bg-slate-950" style={ach.shape ? { clipPath: ach.shape } : { borderRadius: '9999px' }}>
                             <div className={`absolute w-[250%] h-[250%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${ach.animatedLight}`}></div>
                             <div className={`absolute inset-[2px] bg-gradient-to-br ${ach.color} flex items-center justify-center`} style={ach.shape ? { clipPath: ach.shape } : { borderRadius: '9999px' }}>
                                <ach.icon size={16} className="text-white drop-shadow-md relative z-10" />
                             </div>
                          </div>
                        ) : (
                          <div className={`w-10 h-10 flex items-center justify-center bg-gradient-to-br ${ach.color}`} style={ach.shape ? { clipPath: ach.shape } : { borderRadius: '9999px' }}>
                            <ach.icon size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 leading-tight mt-1 line-clamp-1">{ach.name}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs font-sans text-slate-500 text-center py-4">Aún no hay logros registrados.</p>}
            </div>
          </div>

          {/* --- PANEL DERECHO (DATA GRID 4x6) --- */}
          <div className="lg:col-span-8 xl:col-span-8">
            <div className="bg-slate-900/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] min-h-[800px] flex flex-col relative" style={cyberClipPanel}>
              <CyberCrosshairs />
              
              {/* TABS CYBER */}
              <div className="flex overflow-x-auto border-b border-slate-800/80 bg-slate-950/50 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 pt-4 px-4">
                {PROFILE_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[130px] py-4 px-4 text-xs font-sans font-bold uppercase tracking-widest transition-colors relative flex items-center justify-center gap-2 ${activeTab === tab.id ? 'text-cyan-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`} style={cyberClipCard}>
                    <tab.icon size={14} className={activeTab === tab.id ? 'text-cyan-400' : 'text-slate-600'} /> {tab.id}
                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]"></div>}
                  </button>
                ))}
              </div>

              <div className="p-6 md:p-8 flex-1 flex flex-col relative z-10">
                {paginatedAnimes.length === 0 ? (
                  <div className="text-center py-32 flex flex-col items-center my-auto"><Tv size={48} className="text-slate-700 mb-4" /><p className="text-slate-500 font-sans text-sm uppercase tracking-widest">No hay animes registrados en esta sección.</p>
                    <Link to="/search" className="mt-8 text-cyan-400 font-sans font-bold hover:bg-cyan-900/50 bg-slate-950 border border-cyan-500/30 px-8 py-3 uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]" style={cyberClipCard}>Explorar Catálogo</Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 mb-8">
                      {paginatedAnimes.map(anime => {
                         let dotColor = 'bg-slate-500';
                         if (anime.status === 'Completado') dotColor = 'bg-teal-400';
                         if (anime.status === 'Mirando') dotColor = 'bg-sky-400';
                         if (anime.status === 'Pendiente') dotColor = 'bg-yellow-400';

                         return (
                          <div key={anime.id} className="group relative bg-slate-950 overflow-hidden border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]" style={cyberClipCard}>
                            <Link to={`/anime/${anime.anime_id}`} className="block relative aspect-[3/4] overflow-hidden">
                              <img src={anime.image_url} alt={anime.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                              <div className="absolute bottom-0 left-0 w-full p-3">
                                <h4 className="text-white text-[11px] md:text-xs font-bold line-clamp-2 leading-tight mb-2 drop-shadow-md">{anime.title}</h4>
                                <span className={`flex items-center gap-1.5 text-[9px] font-sans font-bold uppercase tracking-wider text-slate-300`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-[0_0_5px_currentColor] animate-pulse`}></span>
                                  {anime.status}
                                </span>
                              </div>
                            </Link>
                            <button onClick={() => handleRemove(anime.id)} className="absolute top-2 right-2 w-8 h-8 bg-slate-950/80 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-slate-900 border border-slate-800 opacity-0 group-hover:opacity-100 transition-all" style={cyberClipCard}><Trash2 size={14} /></button>
                            {anime.is_favorite && <div className="absolute top-2 left-2 w-8 h-8 bg-slate-950/80 backdrop-blur-md flex items-center justify-center border border-slate-800" style={cyberClipCard}><Heart size={14} className="fill-red-500 text-red-200 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" /></div>}
                          </div>
                        )
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className="mt-auto pt-6 border-t border-slate-800/50 flex justify-center items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-slate-950 border border-slate-800 text-slate-500 hover:text-cyan-400 disabled:opacity-50 transition-colors" style={cyberClipCard}><ChevronLeft size={18} /></button>
                        <div className="flex gap-1 px-2">
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center font-sans font-bold text-xs transition-all ${currentPage === i + 1 ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white'}`} style={cyberClipCard}>{i + 1}</button>
                          ))}
                        </div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-slate-950 border border-slate-800 text-slate-500 hover:text-cyan-400 disabled:opacity-50 transition-colors" style={cyberClipCard}><ChevronRight size={18} /></button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- MODAL DE MEDALLA CYBER CENTRADO --- */}
        {selectedAchievement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedAchievement(null)}>
            <div className="bg-slate-950 border border-cyan-500/50 p-10 max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.15)] relative animate-in zoom-in-95" style={cyberClipPanel} onClick={e => e.stopPropagation()}>
              <CyberCrosshairs />
              <button onClick={() => setSelectedAchievement(null)} className="absolute top-4 right-4 text-slate-500 hover:text-cyan-400 transition-colors bg-slate-900 border border-slate-800 p-2 z-10" style={cyberClipCard}><X size={16} /></button>
              
              <div className="flex flex-col items-center text-center mt-4">
                <div className={`mb-10 relative ${selectedAchievement.glowClass || ''}`}>
                  {selectedAchievement.animatedLight ? (
                    <div className="w-36 h-36 relative flex items-center justify-center overflow-hidden bg-slate-950" style={selectedAchievement.shape ? { clipPath: selectedAchievement.shape } : { borderRadius: '9999px' }}>
                       <div className={`absolute w-[250%] h-[250%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${selectedAchievement.animatedLight}`}></div>
                       <div className={`absolute inset-[3px] bg-gradient-to-br ${selectedAchievement.color} flex items-center justify-center`} style={selectedAchievement.shape ? { clipPath: selectedAchievement.shape } : { borderRadius: '9999px' }}>
                          <selectedAchievement.icon size={64} className="text-white drop-shadow-lg relative z-10" />
                       </div>
                    </div>
                  ) : (
                    <div className={`w-36 h-36 flex items-center justify-center bg-gradient-to-br ${selectedAchievement.color}`} style={selectedAchievement.shape ? { clipPath: selectedAchievement.shape } : { borderRadius: '9999px' }}>
                      <selectedAchievement.icon size={64} className="text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
                
                <h3 className="text-3xl font-black text-white mb-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{selectedAchievement.name}</h3>
                
                <div className="bg-slate-900 p-6 border border-slate-800 w-full relative text-left mt-2 shadow-inner" style={cyberClipCard}>
                  <Info size={18} className="absolute top-6 left-5 text-cyan-500/50" />
                  <p className="text-cyan-400 font-sans font-bold text-[10px] uppercase tracking-widest mb-2 ml-8">Requisito Desbloqueado</p>
                  <p className="text-slate-300 font-medium text-sm ml-8 leading-relaxed">{selectedAchievement.desc}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- SUB-COMPONENTES CYBER ---

const StatBox = ({ title, value, color }: { title: string, value: number|string, color: string }) => (
  <div className="bg-slate-950 p-4 border border-slate-800 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-900 hover:border-cyan-500/50 group" style={cyberClipCard}>
    <span className="flex items-center gap-1.5 text-slate-500 text-[9px] font-sans font-bold uppercase tracking-widest mb-1.5 group-hover:text-cyan-400/70 transition-colors">
      <span className="w-1 h-1 bg-cyan-500 rounded-full animate-ping opacity-0 group-hover:opacity-100"></span>
      {title}
    </span>
    <span className={`text-2xl font-sans font-black drop-shadow-md ${color}`}>{value}</span>
  </div>
);

const PodiumCard = ({ title, data }: { title: string, data: { label: string, count: number }[] }) => {
  const first = data[0]; const second = data[1]; const third = data[2];
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl p-6 border-l-2 border-cyan-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-center h-full min-h-[250px] relative" style={cyberClipPanel}>
      <CyberCrosshairs />
      <p className="text-cyan-400 font-sans text-sm font-bold mb-6 flex items-center gap-2">
        <Star size={16} className="drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" /> {title}
      </p>
      <div className="flex items-end justify-center gap-2 md:gap-4 h-full mt-auto pt-4 relative z-10">
        {second ? <div className="flex flex-col items-center w-1/3"><span className="text-[10px] md:text-xs font-sans font-bold text-slate-300 text-center mb-2 truncate w-full px-1">{second.label}</span><div className="w-full bg-gradient-to-t from-slate-700 to-slate-500 h-20 flex items-start justify-center pt-2 shadow-[0_0_15px_rgba(148,163,184,0.2)] border-t-2 border-slate-400" style={cyberClipCard}><span className="text-slate-950 font-sans font-black text-xl">2</span></div></div> : <div className="w-1/3"></div>}
        {first ? <div className="flex flex-col items-center w-1/3"><span className="text-[11px] md:text-sm font-sans font-black text-cyan-400 text-center mb-2 truncate w-full px-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{first.label}</span><div className="w-full bg-gradient-to-t from-cyan-700 to-cyan-500 h-28 flex items-start justify-center pt-2 shadow-[0_0_25px_rgba(34,211,238,0.3)] border-t-2 border-cyan-300 z-10" style={cyberClipCard}><span className="text-cyan-950 font-sans font-black text-2xl">1</span></div></div> : <div className="w-1/3 flex items-center justify-center"><p className="text-[10px] font-sans text-slate-600">No hay datos</p></div>}
        {third ? <div className="flex flex-col items-center w-1/3"><span className="text-[10px] md:text-xs font-sans font-bold text-slate-300 text-center mb-2 truncate w-full px-1">{third.label}</span><div className="w-full bg-gradient-to-t from-blue-900 to-blue-700 h-14 flex items-start justify-center pt-2 shadow-[0_0_15px_rgba(59,130,246,0.2)] border-t-2 border-blue-500" style={cyberClipCard}><span className="text-blue-950 font-sans font-black text-lg">3</span></div></div> : <div className="w-1/3"></div>}
      </div>
    </div>
  );
};