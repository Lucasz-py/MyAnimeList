// --- NUEVA INTERFAZ DE GÉNERO ---
export interface Genre {
  mal_id: number;
  name: string;
  type?: string;
  url?: string;
}

// 1. Estructura base de un Anime
export interface Anime {
  mal_id: number;
  title: string;
  type?: string;
  episodes: number | null;
  score?: number | null;
  duration?: string; // <--- AGREGADO PARA CÁLCULO DE TIEMPO
  rank?: number | null;       // <--- NUEVO: Ranking Global
  popularity?: number | null;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  aired?: {
    from: string;
  };
  genres?: Genre[]; 
}

// 2. Respuesta de búsqueda general
export interface JikanResponse {
  data: Anime[];
}

// 3. Estructura de un Personaje
export interface Character {
  character: {
    mal_id: number;
    name: string;
    images: {
      jpg: {
        image_url: string;
        large_image_url: string;
      };
    };
  };
  role: string;
}

// 4. Respuesta de la lista de personajes
export interface AnimeCharactersResponse {
  data: Character[];
}

// 5. Estructura extendida para el "Nodo de Datos" (Detalles completos)
export interface AnimeFull extends Anime {
  synopsis: string;
  year: number | null;
  status: string;
  studios: { mal_id: number; name: string }[];
  genres: Genre[]; 
  score: number | null;
  trailer?: {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null; 
  };
  relations?: AnimeRelation[];
}

// 6. Respuesta de los detalles completos
export interface JikanFullResponse {
  data: AnimeFull;
}

export interface AnimeRelationEntry {
  mal_id: number;
  type: string; 
  name: string;
}

export interface AnimeRelation {
  relation: string; 
  entry: AnimeRelationEntry[];
}