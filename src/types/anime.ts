export interface Anime {
    mal_id: number;
    title: string;
    episodes: number | null;
    images: {
      jpg: {
        image_url: string;
      };
    };
  }
  
  export interface JikanResponse {
    data: Anime[];
  }