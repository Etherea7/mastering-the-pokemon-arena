export interface PokemonStats {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  }
  
  export interface CachedPokemonData {
    name: string;
    sprite: string;
    types: string[];
    stats: PokemonStats;
  }
  
  export interface PokemonCache {
    data: Record<string, CachedPokemonData>;
    timestamp: number;
  }
  
  // Cache expiration time (24 hours)
  export const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;
  export const CACHE_KEY = 'pokemon-data-cache';
  export const MAX_CONCURRENT_REQUESTS = 100;