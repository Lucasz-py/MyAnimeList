// 1. Estructura base de un Anime
export interface Anime {
  mal_id: number;
  title: string;
  episodes: number | null;
  score?: number | null;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  aired?: {
    from: string;
  };
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
  studios: { name: string }[];
  genres: { name: string }[];
  score: number | null;
  trailer?: {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null; // <-- Agregamos el enlace directo para iframes
  };
  relations?: AnimeRelation[];
}

// 6. Respuesta de los detalles completos
export interface JikanFullResponse {
  data: AnimeFull;
}

export interface AnimeRelationEntry {
  mal_id: number;
  type: string; // Puede ser "anime" o "manga"
  name: string;
}

export interface AnimeRelation {
  relation: string; // Ej: "Sequel", "Prequel", "Alternative version"
  entry: AnimeRelationEntry[];
}