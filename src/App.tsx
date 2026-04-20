import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer'; 
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { AnimeDetails } from './pages/AnimeDetails'; 
import { Profile } from './pages/Profile';
import { RankingPage } from './pages/RankingPage';

// --- COMPONENTE SCROLL TO TOP (CON EXCLUSIÓN DE HOME) ---
// Escucha cada cambio en la URL y sube la página suavemente, excepto en el Home
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Si la ruta NO es la raíz ('/'), forzamos el scroll al inicio
    if (pathname !== '/') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth' 
      });
    }
  }, [pathname]);

  return null;
};

function App() {
  return (
    <Router>
      {/* Se ejecuta dentro del Router para poder leer la ruta actual */}
      <ScrollToTop />
      
      <div className="min-h-screen bg-[#0a0a0a] text-cyan-50 flex flex-col font-sans relative">
        <Header />
        
        <main className="flex-1 w-full relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/anime/:id" element={<AnimeDetails />} /> 
            <Route path="/profile" element={<Profile />} />
            <Route path="/top/:filter" element={<RankingPage />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;