import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Edit2, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}

interface SavedAnime {
  anime_id: number;
  title: string;
  image_url: string;
  status: string;
  episodes_total: number | null;
  is_favorite: boolean;
  genres?: string[]; 
  year?: number | null;
  duration?: string | null; 
}

// Algoritmo experto para extraer minutos exactos de formatos como "1 hr 46 min", "24 min per ep", o "3 min"
const parseDurationToMinutes = (durationStr?: string | null): number => {
  if (!durationStr || durationStr === 'Unknown') return 24; 
  let totalMin = 0;
  
  const hrMatch = durationStr.match(/(\d+)\s*hr/);
  if (hrMatch) totalMin += parseInt(hrMatch[1], 10) * 60;
  
  const minMatch = durationStr.match(/(\d+)\s*min/);
  if (minMatch) totalMin += parseInt(minMatch[1], 10);
  
  return totalMin > 0 ? totalMin : 24;
};

export const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedAnimes, setSavedAnimes] = useState<SavedAnime[]>([]);
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();

  // --- SOLUCIÓN AL BUG DEL USEEFFECT ---
  useEffect(() => {
    // Declaramos la función DENTRO del useEffect para que React no pelee
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as UserProfile);
          setNewBio(profileData.bio || '');
        }

        const { data: animesData } = await supabase
          .from('saved_animes')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (animesData) {
          setSavedAnimes(animesData as SavedAnime[]);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]); // navigate es la única dependencia real aquí

  const handleUpdateBio = async () => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: newBio })
        .eq('id', profile.id);

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
      alert('Error al subir la imagen.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- CÁLCULOS ANALÍTICOS DINÁMICOS ---
  const completados = savedAnimes.filter(a => a.status === 'Completado');
  
  let totalEpisodios = 0;
  let totalMinutos = 0;

  completados.forEach(anime => {
    const eps = anime.episodes_total || 1; // Pelis cuentan como 1 episodio
    const minsPerEp = parseDurationToMinutes(anime.duration);
    
    totalEpisodios += eps;
    totalMinutos += (eps * minsPerEp);
  });

  const horasTotales = Math.floor(totalMinutos / 60);
  const minutosRestantes = totalMinutos % 60;
  const diasTotales = (totalMinutos / 1440).toFixed(1);

  // Mapeo de Géneros
  const genreCounts: Record<string, number> = {};
  let totalGenresCount = 0;
  completados.forEach(anime => {
    if (anime.genres && Array.isArray(anime.genres)) {
      anime.genres.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
        totalGenresCount++;
      });
    }
  });
  const topGenres = Object.entries(genreCounts)
    .map(([name, count]) => ({ label: name, pct: Math.round((count / totalGenresCount) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  // Mapeo de Años
  const yearCounts: Record<string, number> = {};
  let totalYearsCount = 0;
  completados.forEach(anime => {
    if (anime.year) {
      const y = anime.year.toString();
      yearCounts[y] = (yearCounts[y] || 0) + 1;
      totalYearsCount++;
    }
  });
  const topYears = Object.entries(yearCounts)
    .map(([year, count]) => ({ label: year, pct: Math.round((count / totalYearsCount) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  const stats = {
    completados: completados.length,
    mirando: savedAnimes.filter(a => a.status === 'Mirando').length,
    pendientes: savedAnimes.filter(a => a.status === 'Pendiente').length,
    favoritos: savedAnimes.filter(a => a.is_favorite === true).length,
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-[#D6685A] font-bold text-xl animate-pulse">Cargando Cuartel General...</div>;
  if (!profile) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 pt-32 md:pt-36 max-w-[1200px] font-sans">
      
      {/* HEADER DEL PERFIL */}
      <div className="bg-[#1C1C1C] rounded-3xl p-8 mb-12 border border-neutral-800 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-neutral-800/50 to-transparent z-0"></div>

        <div className="relative z-10 group">
          <div className="w-40 h-40 rounded-full bg-neutral-800 border-4 border-[#1C1C1C] shadow-2xl overflow-hidden flex items-center justify-center text-4xl font-black text-neutral-600 uppercase">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile.username?.charAt(0) || profile.email?.charAt(0)
            )}
          </div>
          <label className="absolute bottom-2 right-2 bg-[#D6685A] p-3 rounded-full cursor-pointer hover:bg-[#c25a4d] transition-transform hover:scale-110 shadow-lg group-hover:animate-bounce">
            {uploadingAvatar ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
          </label>
        </div>

        <div className="flex-1 z-10 text-center md:text-left pt-4">
          <h1 className="text-4xl font-black text-white mb-1">@{profile.username}</h1>
          <p className="text-neutral-500 mb-6 font-medium">{profile.email}</p>

          <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800/50 max-w-2xl">
            {isEditingBio ? (
              <div>
                <textarea 
                  autoFocus
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Escribe algo sobre ti..."
                  className="w-full bg-neutral-900 text-white rounded-xl p-3 focus:outline-none focus:border-[#D6685A] border border-neutral-700 min-h-[100px] mb-3 text-sm"
                  maxLength={160}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setIsEditingBio(false); setNewBio(profile.bio || ''); }} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors"><X size={18} /></button>
                  <button onClick={handleUpdateBio} className="p-2 rounded-lg bg-[#D6685A] text-white hover:bg-[#c25a4d] transition-colors"><Check size={18} /></button>
                </div>
              </div>
            ) : (
              <div className="group relative pr-10 cursor-pointer" onClick={() => setIsEditingBio(true)}>
                <p className="text-neutral-300 text-sm leading-relaxed italic">
                  {profile.bio ? `"${profile.bio}"` : "Sin descripción. Haz clic en el lápiz para agregar una."}
                </p>
                <button className="absolute top-0 right-0 p-2 text-neutral-500 hover:text-[#D6685A] opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DASHBOARD ANALÍTICO */}
      <div className="mb-16 flex flex-col gap-12">
        
        <div>
          <h3 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-3">Estado de Colección</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Completados" value={stats.completados} color="text-emerald-400" />
            <StatCard title="Mirando" value={stats.mirando} color="text-blue-400" />
            <StatCard title="Pendientes" value={stats.pendientes} color="text-amber-400" />
            <StatCard title="Favoritos" value={stats.favoritos} color="text-[#D6685A]" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-3">Mis Estadísticas</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 grid grid-cols-3 gap-4">
              <StatCard title="Episodios" value={totalEpisodios} color="text-neutral-200" />
              <StatCard title="Tiempo Total" value={`${horasTotales}h ${minutosRestantes}m`} color="text-neutral-200" />
              <StatCard title="Días Totales" value={diasTotales} color="text-neutral-200" />
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              <PercentageCard title="Top Géneros" data={topGenres} />
              <PercentageCard title="Años Destacados" data={topYears} />
            </div>
          </div>
        </div>

      </div>

      {/* LISTAS DE ANIMES */}
      <div className="space-y-12">
        <AnimeListSection title="★ Mis Favoritos" animes={savedAnimes.filter(a => a.is_favorite === true)} />
        <AnimeListSection title="Completados" animes={completados} />
        <AnimeListSection title="Mirando" animes={savedAnimes.filter(a => a.status === 'Mirando')} />
        <AnimeListSection title="Pendientes" animes={savedAnimes.filter(a => a.status === 'Pendiente')} />
      </div>

    </div>
  );
};

// --- SUB-COMPONENTES ---

const StatCard = ({ title, value, color = "text-white" }: { title: string, value: number | string, color?: string }) => (
  <div className="bg-[#1C1C1C] p-5 rounded-2xl border border-neutral-800 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all h-full flex flex-col justify-center">
    <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
    <p className={`text-2xl md:text-3xl font-black ${color}`}>{value}</p>
  </div>
);

const PercentageCard = ({ title, data }: { title: string, data: { label: string, pct: number }[] }) => (
  <div className="bg-[#1C1C1C] p-5 rounded-2xl border border-neutral-800 shadow-sm flex flex-col justify-center h-full">
    <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-4">{title}</p>
    
    {data.length > 0 ? (
      <div className="flex flex-col gap-3.5">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm font-bold text-white w-24 truncate" title={item.label}>{item.label}</span>
            <div className="flex items-center gap-3 flex-1 ml-4">
              <div className="w-full bg-neutral-900 border border-neutral-800 h-2 rounded-full overflow-hidden flex-1">
                <div 
                  className="bg-gradient-to-r from-[#D6685A] to-[#f48475] h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${item.pct}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-neutral-400 w-8 text-right">{item.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-neutral-600 italic py-4 text-center">Añade animes para generar estadísticas.</p>
    )}
  </div>
);

const AnimeListSection = ({ title, animes }: { title: string, animes: SavedAnime[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const limit = 7;

  if (animes.length === 0) return null;
  
  const hasMore = animes.length > limit;
  const visibleAnimes = isExpanded ? animes : animes.slice(0, limit);

  return (
    <section>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        {title} <span className="bg-neutral-800 text-neutral-400 text-sm px-3 py-1 rounded-full">{animes.length}</span>
      </h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
        {visibleAnimes.map(anime => (
          <Link key={anime.anime_id} to={`/anime/${anime.anime_id}`} className="group relative rounded-xl overflow-hidden aspect-[3/4] border border-neutral-800">
            <img src={anime.image_url} alt={anime.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <p className="text-white text-xs font-bold line-clamp-2">{anime.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-neutral-800 bg-[#1C1C1C] hover:bg-neutral-800 text-xs font-bold tracking-widest uppercase transition-all text-neutral-300 hover:text-white"
          >
            {isExpanded ? (
              <>Ver Menos <ChevronUp size={16} /></>
            ) : (
              <>Mostrar Todos ({animes.length}) <ChevronDown size={16} /></>
            )}
          </button>
        </div>
      )}
    </section>
  );
};