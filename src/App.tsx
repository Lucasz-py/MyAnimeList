import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { AnimeDetails } from './pages/AnimeDetails'; 
import { Profile } from './pages/Profile';
import { RankingPage } from './pages/RankingPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-cyan-50 flex flex-col font-sans relative">
        {/* El Header ahora es fixed y flotante, no ocupa espacio en el layout */}
        <Header />
        
        {/* flex-1 w-full relative asegura que el contenido empiece en el pixel 0 */}
        <main className="flex-1 w-full relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/anime/:id" element={<AnimeDetails />} /> 
            <Route path="/profile" element={<Profile />} />
            <Route path="/top/:filter" element={<RankingPage />} />
          </Routes>
        </main>
        
        <footer className="bg-[#1C1C1C] border-t border-neutral-800/80 text-neutral-500 text-center text-xs p-6 z-10 relative">
          <p>© 2026 MY::A.T DATACENTER [v0.1.0] - Uso Personal Autorizado.</p>
          <p className='mt-1'>Data provided by Jikan API (MAL).</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;