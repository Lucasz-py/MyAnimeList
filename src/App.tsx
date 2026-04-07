import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Search } from './pages/Search';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-cyan-50 flex flex-col font-space-mono">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </main>
        
        <footer className="bg-slate-900 border-t border-cyan-400/20 text-slate-600 text-center text-xs p-6 mt-12">
          <p>© 2026 MY::A.T DATACENTER [v0.1.0] - Uso Personal Autorizado.</p>
          <p className='mt-1'>Data provided by Jikan API (MAL).</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;