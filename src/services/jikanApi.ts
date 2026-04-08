import type { JikanResponse, JikanFullResponse, AnimeCharactersResponse } from '../types/anime';

const BASE_URL = 'https://api.jikan.moe/v4';

export const searchAnime = async (query: string, limit: number = 10): Promise<JikanResponse> => {
  const response = await fetch(`${BASE_URL}/anime?q=${query}&limit=${limit}`);
  if (!response.ok) throw new Error('Error en la búsqueda');
  return response.json();
};

export const getUpcomingAnimes = async (): Promise<JikanResponse> => {
  // Obtenemos los animes de la temporada actual (Abril = Spring)
  const response = await fetch(`${BASE_URL}/seasons/2026/spring`);
  if (!response.ok) throw new Error('Error al obtener temporada');
  return response.json();
};

export const getAnimeById = async (id: string): Promise<JikanFullResponse> => {
  const response = await fetch(`${BASE_URL}/anime/${id}/full`);
  if (!response.ok) throw new Error('Error al obtener los detalles del anime');
  return response.json();
};

export const getAnimeCharacters = async (id: string): Promise<AnimeCharactersResponse> => {
  const response = await fetch(`${BASE_URL}/anime/${id}/characters`);
  if (!response.ok) throw new Error('Error al obtener los personajes');
  return response.json();
};

export const getTopAnimes = async (limit: number = 20): Promise<JikanResponse> => {
  const response = await fetch(`${BASE_URL}/top/anime?limit=${limit}`);
  if (!response.ok) throw new Error('Error al obtener el top global');
  return response.json();
};