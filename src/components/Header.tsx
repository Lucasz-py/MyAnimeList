import { Search, UserCircle, LogOut } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchAnime } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import debounce from 'lodash.debounce';
import { LoginModal } from './LoginModal';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js'; // <-- 1. Importamos el tipo oficial de Sesión

// 2. Creamos una interfaz estricta para el perfil en lugar de usar "any"
interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

export const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [instantResults, setInstantResults] = useState<Anime[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // 3. Aplicamos los tipos estrictos a los estados
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLFormElement>(null);

  // --- LÓGICA DE AUTENTICACIÓN CORREGIDA ---
  useEffect(() => {
    // 4. Movemos fetchProfile ADENTRO del useEffect y ANTES de usarlo. 
    // Esto soluciona el error "Cannot access variable before it is declared"
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (data) setProfile(data as UserProfile);
    };

    // Obtener la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(session) fetchProfile(session.user.id);
    });

    // Escuchar cambios (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if(session) {
         fetchProfile(session.user.id);
      } else {
         setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Dependencias vacías: solo se ejecuta al montar el componente

  // Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  // ----------------------------------------

  const debouncedFetchResults = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.trim()) {
          try {
            const response = await searchAnime(query, 3);
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
    return () => debouncedFetchResults.cancel();
  }, [debouncedFetchResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedFetchResults(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setInstantResults([]);
      navigate(`/search?q=${searchTerm}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setInstantResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-[#1C1C1C] border-b border-neutral-800/80 text-white p-4 shadow-sm relative z-40 font-sans">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tight hover:opacity-80 transition-opacity" onClick={() => setInstantResults([])}>
            Harmonia<span className='text-[#D6685A]'>.</span>
          </Link>

          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-6 relative hidden md:block" ref={dropdownRef}>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Buscar series, películas..."
                value={searchTerm}
                onChange={handleInputChange}
                className="w-full py-2.5 pl-5 pr-12 text-white bg-neutral-900 border border-neutral-800 rounded-full focus:border-[#D6685A] focus:outline-none focus:ring-1 focus:ring-[#D6685A]/50 transition-all placeholder:text-neutral-500 text-sm"
              />
              <button type="submit" className="absolute right-4 text-neutral-400 hover:text-[#D6685A] transition-colors">
                <Search size={18} />
              </button>
            </div>

            {instantResults.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-[#1C1C1C] mt-2 border border-neutral-800 rounded-2xl shadow-xl max-h-72 overflow-y-auto z-10 p-2 custom-scrollbar">
                {instantResults.map((anime) => (
                  <Link 
                    key={anime.mal_id} 
                    to={`/anime/${anime.mal_id}`}
                    onClick={() => setInstantResults([])}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-900 transition-colors"
                  >
                    <img src={anime.images.jpg.image_url} alt={anime.title} className="w-10 h-14 object-cover rounded-lg shadow-sm" />
                    <div className='flex-1 min-w-0'>
                      <p className="text-white text-sm font-bold truncate">{anime.title}</p>
                      <p className="text-xs text-neutral-500 font-medium">{anime.episodes ? `${anime.episodes} eps` : 'En emisión'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </form>

          {session ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-3 bg-neutral-900/80 px-3 py-1.5 rounded-full border border-neutral-800 hover:border-[#D6685A]/50 transition-colors cursor-pointer group">
  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-sm uppercase bg-neutral-800 border border-[#D6685A]">
    {/* Mostrar foto si existe, si no, inicial */}
    {profile?.avatar_url ? (
      <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
    ) : (
      profile?.username?.charAt(0) || session.user.email?.charAt(0)
    )}
  </div>
  <span className="hidden sm:inline text-sm font-medium mr-1 text-neutral-200 group-hover:text-white transition-colors">
    {profile?.username || 'Usuario'}
  </span>
</Link>
              
              <button 
                onClick={handleLogout}
                title="Cerrar sesión"
                className="text-neutral-400 hover:text-[#D6685A] transition-colors p-2 rounded-full hover:bg-neutral-800"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
            >
              <UserCircle size={28} />
              <span className="hidden sm:inline text-sm font-medium mr-2">Mi Cuenta</span>
            </button>
          )}
        </div>
      </header>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </>
  );
};