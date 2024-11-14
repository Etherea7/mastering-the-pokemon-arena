import { useState, useEffect } from 'react';

interface Move {
  id: number;
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  damage_class: string;
  effect_entries: string[];
}

interface MoveCache {
  data: Record<string, Move>;
  timestamp: number;
}

const CACHE_KEY = 'pokemon-moves-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MOVES_PER_BATCH = 100;

export function useMoveData() {
  const [moves, setMoves] = useState<Record<string, Move>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const loadCache = () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp }: MoveCache = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setMoves(data);
          setLoading(false);
          return true;
        }
      }
      return false;
    };

    const fetchMoves = async () => {
      if (loadCache()) return;

      try {
        setLoading(true);
        // First, get the total count of moves
        const listResponse = await fetch('https://pokeapi.co/api/v2/move?limit=1');
        const listData = await listResponse.json();
        const total = listData.count;
        setProgress({ current: 0, total });

        // Fetch moves in batches
        const allMoves: Record<string, Move> = {};
        for (let offset = 0; offset < total; offset += MOVES_PER_BATCH) {
          const batchResponse = await fetch(
            `https://pokeapi.co/api/v2/move?limit=${MOVES_PER_BATCH}&offset=${offset}`
          );
          const batchData = await batchResponse.json();

          // Fetch details for each move in the batch
          const movePromises = batchData.results.map(async (move: { url: string }) => {
            const moveResponse = await fetch(move.url);
            const moveData = await moveResponse.json();

            return {
              id: moveData.id,
              name: moveData.name,
              type: moveData.type.name,
              power: moveData.power,
              accuracy: moveData.accuracy,
              pp: moveData.pp,
              damage_class: moveData.damage_class.name,
              effect_entries: moveData.effect_entries
                .filter((entry: any) => entry.language.name === 'en')
                .map((entry: any) => entry.effect)
            };
          });

          const movesData = await Promise.all(movePromises);
          movesData.forEach((move) => {
            allMoves[move.name] = move;
          });

          setProgress({ current: offset + MOVES_PER_BATCH, total });
        }

        // Cache the data
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: allMoves,
          timestamp: Date.now()
        }));

        setMoves(allMoves);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch moves');
      } finally {
        setLoading(false);
      }
    };

    fetchMoves();
  }, []);

  return { moves, loading, error, progress };
}

// Helper functions for data processing
export function getMovesByType(moves: Record<string, Move>) {
  const byType: Record<string, Move[]> = {};
  Object.values(moves).forEach(move => {
    if (!byType[move.type]) {
      byType[move.type] = [];
    }
    byType[move.type].push(move);
  });
  return byType;
}

export function getMoveCountsByTypeAndCategory(moves: Record<string, Move>) {
  const counts: Record<string, Record<string, number>> = {};
  Object.values(moves).forEach(move => {
    if (!counts[move.type]) {
      counts[move.type] = { physical: 0, special: 0, status: 0 };
    }
    counts[move.type][move.damage_class]++;
  });
  return counts;
}

export function formatMoveName(name: string): string {
  return name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}