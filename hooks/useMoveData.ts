import { useState, useEffect } from 'react';
import { getFromCache, setCache } from '@/lib/redis';

interface Move {
  id: number;
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  damage_class: string;
  effect_entries: string[];
  url: string;
}

interface MoveCache {
  data: Record<string, Move>;
  timestamp: number;
}

const CACHE_KEY = 'pokemon-moves-cache';
const REDIS_CACHE_KEY = 'pokemon-moves-data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MOVES_PER_BATCH = 100;

export function useMoveData() {
  const [moves, setMoves] = useState<Record<string, Move>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const loadCache = async () => {
      // Try localStorage first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp }: MoveCache = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setMoves(data);
          setLoading(false);
          return true;
        }
      }

      // Try Redis cache
      const redisData = await getFromCache<Record<string, Move>>(REDIS_CACHE_KEY);
      if (redisData) {
        setMoves(redisData);
        // Update localStorage cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: redisData,
          timestamp: Date.now()
        }));
        setLoading(false);
        return true;
      }

      return false;
    };

    const fetchMoves = async () => {
      try {
        if (await loadCache()) return;

        setLoading(true);
        const listResponse = await fetch('https://pokeapi.co/api/v2/move?limit=1');
        const listData = await listResponse.json();
        const total = listData.count;
        setProgress({ current: 0, total });

        const allMoves: Record<string, Move> = {};
        for (let i = 0; i < total; i += MOVES_PER_BATCH) {
          const batch = await Promise.all(
            Array.from({ length: Math.min(MOVES_PER_BATCH, total - i) }, async (_, index) => {
              try {
                const res = await fetch(`https://pokeapi.co/api/v2/move/${i + index + 1}`);
                if (!res.ok) {
                  if (res.status === 404) {
                    console.warn(`Move ${i + index + 1} not found, skipping...`);
                    return null;
                  }
                  throw new Error(`HTTP error! status: ${res.status}`);
                }
                return await res.json();
              } catch (error) {
                console.error(`Error fetching move ${i + index + 1}:`, error);
                return null;
              }
            })
          );

          batch.forEach(move => {
            if (move) {
              allMoves[move.name] = {
                id: move.id,
                name: move.name,
                type: move.type.name,
                power: move.power,
                accuracy: move.accuracy,
                pp: move.pp,
                damage_class: move.damage_class.name,
                effect_entries: move.effect_entries.map((entry: any) => entry.effect),
                url: `https://pokeapi.co/api/v2/move/${move.id}`
              };
            }
          });

          setProgress({ current: i + batch.length, total });
          setMoves(allMoves);
        }

        // Save to both caches
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: allMoves,
          timestamp: Date.now()
        }));
        await setCache(REDIS_CACHE_KEY, allMoves, 24 * 60 * 60); // 24 hours

        setLoading(false);
      } catch (error) {
        console.error('Error fetching moves:', error);
        setError('Failed to fetch moves data');
        setLoading(false);
      }
    };

    fetchMoves();
  }, []);

  return { moves, loading, error, progress };
}