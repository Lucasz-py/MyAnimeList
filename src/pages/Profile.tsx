import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Edit2, Check, X, Loader2 } from 'lucide-react';
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
  is_favorite: boolean; // <-- AÑADIDO
}

export const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedAnimes, setSavedAnimes] = useState<SavedAnime[]>([]);
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, );

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
      if (!event.target.files || event.target.files.length === 0 || !profile) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
    } catch (error) {
      console.error('Error subiendo avatar:', error);
      alert('Error al subir la imagen.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- CÁLCULO ESTRICTO DE ESTADÍSTICAS ---
  // Solo suma episodios si el status es 'Completado'
  const totalEpisodios = savedAnimes.reduce((acc, curr) => {
    if (curr.status === 'Completado' && curr.episodes_total) {
       return acc + curr.episodes_total;
    }
    return acc;
  }, 0);

  const horasTotales = Math.round((totalEpisodios * 24) / 60);

  const stats = {
    completados: savedAnimes.filter(a => a.status === 'Completado').length,
    mirando: savedAnimes.filter(a => a.status === 'Mirando').length,
    pendientes: savedAnimes.filter(a => a.status === 'Pendiente').length,
    favoritos: savedAnimes.filter(a => a.is_favorite === true).length,
    episodios: totalEpisodios,
    horas: horasTotales
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-[#D6685A] font-bold text-xl animate-pulse">Cargando Cuartel General...</div>;
  if (!profile) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-[1200px] font-sans">
      
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
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Escribe algo sobre ti..."
                  className="w-full bg-neutral-900 text-white rounded-xl p-3 focus:outline-none focus:border-[#D6685A] border border-neutral-700 min-h-[100px] mb-3 text-sm"
                  maxLength={160}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditingBio(false)} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors"><X size={18} /></button>
                  <button onClick={handleUpdateBio} className="p-2 rounded-lg bg-[#D6685A] text-white hover:bg-[#c25a4d] transition-colors"><Check size={18} /></button>
                </div>
              </div>
            ) : (
              <div className="group relative pr-10">
                <p className="text-neutral-300 text-sm leading-relaxed italic">
                  {profile.bio ? `"${profile.bio}"` : "Sin descripción. Haz clic en el lápiz para agregar una."}
                </p>
                <button 
                  onClick={() => setIsEditingBio(true)}
                  className="absolute top-0 right-0 p-2 text-neutral-500 hover:text-[#D6685A] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SEPARACIÓN DE ESTADÍSTICAS EN DOS BLOQUES --- */}
      <div className="mb-16 flex flex-col lg:flex-row gap-8">
        
        {/* Bloque 1: Colección */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-4 border-b border-neutral-800 pb-3 flex items-center gap-2">
            Estado de Colección
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Completados" value={stats.completados} color="text-emerald-400" />
            <StatCard title="Mirando" value={stats.mirando} color="text-blue-400" />
            <StatCard title="Pendientes" value={stats.pendientes} color="text-amber-400" />
            <StatCard title="Favoritos" value={stats.favoritos} color="text-[#D6685A]" />
          </div>
        </div>

        {/* Bloque 2: Tiempo Visualizado */}
        <div className="lg:w-1/3">
          <h3 className="text-xl font-bold text-white mb-4 border-b border-neutral-800 pb-3 flex items-center gap-2">
            Tiempo Invertido
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Episodios Vistos" value={stats.episodios} color="text-neutral-200" />
            <StatCard title="Horas Totales" value={`${stats.horas}h`} color="text-neutral-200" />
          </div>
        </div>

      </div>

      {/* LISTAS DE ANIMES */}
      <div className="space-y-12">
        <AnimeListSection title="★ Mis Favoritos" animes={savedAnimes.filter(a => a.is_favorite === true)} />
        <AnimeListSection title="Completados" animes={savedAnimes.filter(a => a.status === 'Completado')} />
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
    <p className={`text-3xl font-black ${color}`}>{value}</p>
  </div>
);

const AnimeListSection = ({ title, animes }: { title: string, animes: SavedAnime[] }) => {
  if (animes.length === 0) return null;
  
  return (
    <section>
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        {title} <span className="bg-neutral-800 text-neutral-400 text-sm px-3 py-1 rounded-full">{animes.length}</span>
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
        {animes.map(anime => (
          <Link key={anime.anime_id} to={`/anime/${anime.anime_id}`} className="group relative rounded-xl overflow-hidden aspect-[3/4] border border-neutral-800">
            <img src={anime.image_url} alt={anime.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <p className="text-white text-xs font-bold line-clamp-2">{anime.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};