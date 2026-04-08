import { Search, UserCircle } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchAnime } from '../services/jikanApi';
import type { Anime } from '../types/anime';
import debounce from 'lodash.debounce';

export const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [instantResults, setInstantResults] = useState<Anime[]>([]);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLFormElement>(null);

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
    return () => {
      debouncedFetchResults.cancel();
    };
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
    <header className="bg-[#1C1C1C] border-b border-neutral-800/80 text-white p-4 shadow-sm relative z-50 font-sans">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tight hover:opacity-80 transition-opacity" onClick={() => setInstantResults([])}>
          Harmonia<span className='text-[#D6685A]'>.</span>
        </Link>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-6 relative" ref={dropdownRef}>
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
            <div className="absolute top-full left-0 w-full bg-[#1C1C1C] mt-2 border border-neutral-800 rounded-2xl shadow-xl max-h-72 overflow-y-auto z-10 p-2">
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

        <button className="flex items-center gap-2 p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white">
          <UserCircle size={28} />
          <span className="hidden sm:inline text-sm font-medium mr-2">Mi Cuenta</span>
        </button>
      </div>
    </header>
  );
};