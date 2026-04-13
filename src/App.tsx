import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer'; // <--- IMPORTACIÓN NUEVA
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { AnimeDetails } from './pages/AnimeDetails'; 
import { Profile } from './pages/Profile';
import { RankingPage } from './pages/RankingPage';

function App() {
  return (
    <Router>
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
        
        {/* COMPONENTE FOOTER REEMPLAZADO */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;