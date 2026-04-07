import type { JikanResponse } from '../types/anime';

const BASE_URL = 'https://api.jikan.moe/v4';

export const searchAnime = async (query: string): Promise<JikanResponse> => {
  const response = await fetch(`${BASE_URL}/anime?q=${query}&limit=10`);
  if (!response.ok) {
    throw new Error('Error al buscar el anime');
  }
  return response.json();
};