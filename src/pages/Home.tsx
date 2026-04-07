import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4 text-slate-800">
        Gestiona tu Colección de Anime
      </h1>
      <p className="text-lg text-slate-600 mb-8 max-w-2xl">
        Busca tus series favoritas, lleva el control de los episodios vistos y calcula cuánto tiempo has invertido en el mundo del anime.
      </p>
      
      <Link 
        to="/search" 
        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
      >
        Comenzar Registro
      </Link>
    </div>
  );
};