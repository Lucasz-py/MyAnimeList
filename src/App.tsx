import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Search } from './pages/Search';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </main>
        {/* Footer provisional */}
        <footer className="bg-slate-900 text-slate-400 text-center p-4 mt-auto">
          <p>© 2026 MyAnimeTracker. Creado para uso personal.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;