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
    <header className="bg-slate-900 border-b border-cyan-400/30 text-cyan-50 p-4 shadow-lg shadow-cyan-900/10">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-neon-cyan tracking-wider hover:scale-105 transition-transform">
          MAT<span className='text-fuchsia-400'>[tracker]</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-6">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="buscar::sujeto_anime..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-4 pr-10 text-cyan-50 bg-slate-800 border-b border-cyan-400 rounded-sm focus:border-fuchsia-400 focus:outline-none placeholder:text-cyan-900"
            />
            <button type="submit" className="absolute right-3 text-cyan-400 hover:text-fuchsia-400">
              <Search size={20} />
            </button>
          </div>
        </form>

        <button className="flex items-center gap-2 px-3 py-1 bg-slate-800 border-t border-r border-cyan-400 rounded-tr-xl hover:bg-fuchsia-900 transition-colors">
          <UserCircle size={28} className='text-fuchsia-400' />
          <span className="hidden sm:inline text-cyan-50 text-sm">LOGIN_SYS</span>
        </button>
      </div>
    </header>
  );
};