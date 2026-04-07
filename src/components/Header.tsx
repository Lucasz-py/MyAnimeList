import { Search, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${searchTerm}`);
    }
  };

  return (
    <header className="bg-slate-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-400">
          MyAnimeTracker
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Buscar anime..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-4 pr-10 text-slate-900 rounded-full focus:outline-none"
            />
            <button type="submit" className="absolute right-3 text-slate-500 hover:text-slate-800">
              <Search size={20} />
            </button>
          </div>
        </form>

        <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
          <UserCircle size={28} />
          <span className="hidden sm:inline">Iniciar Sesión</span>
        </button>
      </div>
    </header>
  );
};