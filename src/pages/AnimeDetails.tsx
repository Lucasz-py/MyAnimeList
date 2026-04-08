import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeById, getAnimeCharacters } from '../services/jikanApi';
import type { AnimeFull, Character } from '../types/anime';

export const AnimeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<AnimeFull | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      try {
        const [animeRes, charsRes] = await Promise.all([
          getAnimeById(id),
          getAnimeCharacters(id)
        ]);
        
        setAnime(animeRes.data);
        const allCharacters = charsRes.data.slice(0, 18);
        setCharacters(allCharacters);
        
      } catch (error) {
        console.error("Error al cargar los detalles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToList = () => {
    if(!anime) return;
    console.log(`Agregando a lista: ${anime.title}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-[#D6685A] animate-pulse text-xl font-medium tracking-wide">
          Cargando información...
        </div>
      </div>
    );
  }

  if (!anime) return <div className="text-center mt-20 text-neutral-400 text-lg">No se encontró información de esta serie.</div>;

  const filteredRelations = anime.relations?.filter(
    (rel) => rel.relation.toLowerCase() !== 'adaptation'
  ) || [];

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-[1350px] font-sans">
      <Link to="/search" className="text-neutral-400 hover:text-[#D6685A] mb-8 inline-flex items-center gap-2 text-sm font-medium transition-colors">
        <span>&larr;</span> Volver al buscador
      </Link>

      {/* Tarjeta Principal - Diseño Elegante */}
      <div className="bg-[#1C1C1C] rounded-3xl overflow-hidden shadow-2xl mb-16 relative z-0 border border-neutral-800/50">
        <div className="flex flex-col md:flex-row md:items-stretch">
          
          {/* Imagen de Portada */}
          <div className="w-full md:w-[35%] lg:w-[30%] relative bg-neutral-900 p-6 md:p-8 flex justify-center items-center">
            <img 
              src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} 
              alt={anime.title} 
              className="w-full h-auto object-contain rounded-xl shadow-xl border border-neutral-800"
            />
          </div>

          {/* Detalles e Información */}
          <div className="p-8 md:p-12 flex-1 text-lg flex flex-col">
            <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{anime.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map(g => (
                    <span key={g.name} className="bg-[#D6685A]/10 text-[#D6685A] border border-[#D6685A]/20 text-sm px-4 py-1.5 rounded-full font-medium">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-start lg:items-end gap-4 min-w-max">
                <div className="text-left lg:text-right">
                    <div className="text-5xl font-extrabold text-[#D6685A]">{anime.score || 'N/A'}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-widest mt-1">Puntuación Global</div>
                </div>
                <button 
                    onClick={handleAddToList}
                    className="flex items-center justify-center gap-2 bg-[#D6685A] text-white font-medium text-base px-8 py-3.5 rounded-xl hover:bg-[#c25a4d] transition-colors shadow-lg shadow-[#D6685A]/20 w-full lg:w-auto mt-2"
                >
                    + Agregar a mi lista
                </button>
              </div>
            </div>

            {/* Grid de Metadatos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 text-base">
              <div className="bg-neutral-800/30 p-5 rounded-2xl">
                <span className="text-neutral-400 text-xs uppercase tracking-wider block mb-1.5">Estado</span>
                <span className="text-white font-medium">{anime.status}</span>
              </div>
              <div className="bg-neutral-800/30 p-5 rounded-2xl">
                <span className="text-neutral-400 text-xs uppercase tracking-wider block mb-1.5">Episodios</span>
                <span className="text-white font-medium">{anime.episodes || 'En emisión'}</span>
              </div>
              <div className="bg-neutral-800/30 p-5 rounded-2xl">
                <span className="text-neutral-400 text-xs uppercase tracking-wider block mb-1.5">Año</span>
                <span className="text-white font-medium">{anime.year || 'TBA'}</span>
              </div>
              <div className="bg-neutral-800/30 p-5 rounded-2xl">
                <span className="text-neutral-400 text-xs uppercase tracking-wider block mb-1.5">Estudio</span>
                <span className="text-white font-medium">{anime.studios[0]?.name || 'Desconocido'}</span>
              </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-xl font-bold text-white mb-4">Sinopsis</h3>
              <p className="text-neutral-300 text-base leading-relaxed">
                {anime.synopsis || 'Sinopsis no disponible en este momento.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Relaciones */}
      {filteredRelations.length > 0 && (
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">Contenido Relacionado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRelations.map((rel, index) => (
              <div key={index} className="bg-[#1C1C1C] p-6 rounded-2xl border border-neutral-800/50 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[#D6685A] text-xs font-bold uppercase tracking-wider block mb-3">
                  {rel.relation}
                </span>
                <div className="flex flex-col gap-2">
                  {rel.entry.map(entry => (
                    entry.type === 'anime' ? (
                      <Link 
                        key={entry.mal_id} 
                        to={`/anime/${entry.mal_id}`}
                        className="text-white hover:text-[#D6685A] text-base truncate transition-colors"
                      >
                        {entry.name}
                      </Link>
                    ) : (
                      <span key={entry.mal_id} className="text-neutral-500 text-base truncate">
                        {entry.name} <span className="text-xs uppercase ml-1 opacity-70">({entry.type})</span>
                      </span>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tráiler */}
      <section className="mb-16">
        <h3 className="text-2xl font-bold text-white mb-6">Tráiler Oficial</h3>
        
        {anime.trailer?.embed_url || anime.trailer?.youtube_id ? (
          <div className="flex flex-col gap-3">
            <div className="aspect-video w-full rounded-3xl overflow-hidden bg-[#1C1C1C] shadow-lg border border-neutral-800/50">
              <iframe
                src={anime.trailer.embed_url || `https://www.youtube.com/embed/${anime.trailer.youtube_id}`}
                title="Trailer"
                className="w-full h-full"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        ) : (
          <div className="bg-[#1C1C1C] py-16 px-8 rounded-3xl border border-neutral-800/50 flex flex-col items-center justify-center text-center">
            <span className="text-neutral-400 text-lg mb-6">
              No hay un video registrado para esta serie.
            </span>
            <a 
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' trailer oficial')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-neutral-800 text-white font-medium text-sm px-6 py-3 rounded-xl hover:bg-neutral-700 transition-colors"
            >
              Buscar en YouTube
            </a>
          </div>
        )}
      </section>

      {/* Personajes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Personajes Principales</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {characters.length > 0 ? (
            characters.map((char) => (
              <div key={char.character.mal_id} className="bg-[#1C1C1C] rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-xl border border-neutral-800/50">
                <div className="aspect-[3/4] overflow-hidden relative bg-neutral-900">
                  <img 
                    src={char.character.images.jpg.image_url} 
                    alt={char.character.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex flex-col justify-center bg-[#1C1C1C]">
                  <h4 className="text-white text-sm font-bold truncate mb-1">{char.character.name}</h4>
                  <p className="text-[#D6685A] text-xs font-medium">{char.role}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-neutral-500 col-span-full text-center py-8">No se encontraron personajes registrados.</p>
          )}
        </div>
      </section>
    </div>
  );
};