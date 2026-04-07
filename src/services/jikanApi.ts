import type { JikanResponse } from '../types/anime';

const BASE_URL = 'https://api.jikan.moe/v4';

export const searchAnime = async (query: string): Promise<JikanResponse> => {
  const response = await fetch(`${BASE_URL}/anime?q=${query}&limit=10`);
  if (!response.ok) throw new Error('Error en la búsqueda');
  return response.json();
};

export const getUpcomingAnimes = async (): Promise<JikanResponse> => {
  // Obtenemos los animes de la temporada actual (Abril = Spring)
  const response = await fetch(`${BASE_URL}/seasons/2026/spring`);
  if (!response.ok) throw new Error('Error al obtener temporada');
  return response.json();
};