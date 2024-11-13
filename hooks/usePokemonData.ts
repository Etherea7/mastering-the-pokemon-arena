// hooks/usePokemonData.ts

import { 
  CachedPokemonData, 
  PokemonCache, 
  CACHE_KEY, 
  CACHE_EXPIRATION,
  MAX_CONCURRENT_REQUESTS 
} from '@/types/pokemon';
// hooks/usePokemonData.ts
import { useState, useEffect, useCallback, useRef } from 'react';

// hooks/usePokemonData.ts

export function usePokemonData() {
    const cacheRef = useRef<Record<string, CachedPokemonData>>({});
    const [cacheState, setCacheState] = useState<Record<string, CachedPokemonData>>({});
    const [loading, setLoading] = useState(false);
  
    // Initialize cache from localStorage only once
    useEffect(() => {
      try {
        const storedCache = localStorage.getItem(CACHE_KEY);
        if (storedCache) {
          const { data, timestamp }: PokemonCache = JSON.parse(storedCache);
          
          if (Date.now() - timestamp < CACHE_EXPIRATION) {
            cacheRef.current = data;
            setCacheState(data); // Update state as well
            console.log('Loaded cache:', Object.keys(data).length, 'Pokemon');
          } else {
            localStorage.removeItem(CACHE_KEY);
            console.log('Cache expired');
          }
        }
      } catch (error) {
        console.warn('Failed to load Pokemon cache:', error);
      }
    }, []);
  
    const saveCache = useCallback((newData: Record<string, CachedPokemonData>) => {
      try {
        const cacheData: PokemonCache = {
          data: newData,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        cacheRef.current = newData;
        setCacheState(newData);
        console.log('Saved cache:', Object.keys(newData).length, 'Pokemon');
      } catch (error) {
        console.warn('Failed to save Pokemon cache:', error);
      }
    }, []);
  
    const fetchPokemonData = useCallback(async (name: string): Promise<CachedPokemonData | null> => {
      console.log('Fetching Pokemon data for:', name);
      if (cacheRef.current[name]) {
        console.log('Cache hit for:', name);
        return cacheRef.current[name];
      }
  
      try {
        const response = await fetch(`/api/pokeapi/sprites/${encodeURIComponent(name)}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        const pokemonData = {
          name,
          sprite: data.sprite,
          types: data.types,
          stats: data.stats
        };
  
        const newCache = { ...cacheRef.current, [name]: pokemonData };
        saveCache(newCache);
        console.log('Cached new Pokemon data for:', name);
  
        return pokemonData;
      } catch (error) {
        console.error(`Failed to fetch data for ${name}:`, error);
        return null;
      }
    }, [saveCache]);
  
    return {
      cache: cacheState, // Return state instead of ref
      loading,
      fetchPokemonBatch: useCallback(async (
        pokemonList: string[], 
        onProgress?: (current: number, total: number) => void
      ) => {
        setLoading(true);
        console.log('Starting batch fetch for:', pokemonList.length, 'Pokemon');
        
        try {
          const uncachedPokemon = pokemonList.filter(name => !cacheRef.current[name]);
          console.log('Actually fetching:', uncachedPokemon.length, 'uncached Pokemon');
          
          if (uncachedPokemon.length === 0) {
            return;
          }
  
          const results = await Promise.all(
            uncachedPokemon.map(async (name, index) => {
              const result = await fetchPokemonData(name);
              if (onProgress) {
                onProgress(index + 1, uncachedPokemon.length);
              }
              return result;
            })
          );
  
          console.log('Batch fetch complete, successful fetches:', results.filter(Boolean).length);
        } catch (error) {
          console.error('Error in batch fetch:', error);
        } finally {
          setLoading(false);
        }
      }, [fetchPokemonData]),
      getPokemonData: fetchPokemonData
    };
  }