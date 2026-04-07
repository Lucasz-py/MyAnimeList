// Define la estructura de un solo anime
export interface Anime {
  mal_id: number;
  title: string;
  episodes: number | null;
  images: {
    jpg: {
      image_url: string;
    };
  };
  aired?: {
    from: string;
  };
}

// Define la estructura de la respuesta completa de la API
export interface JikanResponse {
  data: Anime[];
}