'use client'
import { useEffect, useState } from "react";
import { TypeDistributionChart } from "@/components/generation/TypeAnalysis";
import { StatsComparisonChart } from "@/components/generation/StatAnalysis";
import { TypeStatsTable } from "@/components/generation/StatsTable";

import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GENERATION_RANGES } from "@/constants/gendata";

interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
  sprite?: string;
}

const BATCH_SIZE = 20;

export default function GenAnalysis() {
  const [selectedGen, setSelectedGen] = useState('gen9');
  const [pokemonData, setPokemonData] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const fetchPokemonData = async (id: number): Promise<Pokemon | null> => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!response.ok) return null;
      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        types: data.types.map((t: any) => t.type.name),
        stats: {
          hp: data.stats[0].base_stat,
          attack: data.stats[1].base_stat,
          defense: data.stats[2].base_stat,
          special_attack: data.stats[3].base_stat,
          special_defense: data.stats[4].base_stat,
          speed: data.stats[5].base_stat,
        },
        sprite: data.sprites.front_default || undefined
      };
    } catch (error) {
      console.error(`Error fetching Pokémon #${id}:`, error);
      return null;
    }
  };

  const fetchGenerationData = async (generation: string) => {
    setLoading(true);
    setError(null);
    const genRange = GENERATION_RANGES[generation as keyof typeof GENERATION_RANGES];
    const { start, end } = genRange;
    const total = end - start + 1;
    setProgress({ current: 0, total });

    try {
      const pokemon: Pokemon[] = [];
      
      for (let i = start; i <= end; i += BATCH_SIZE) {
        const batch = Array.from(
          { length: Math.min(BATCH_SIZE, end - i + 1) },
          (_, index) => fetchPokemonData(i + index)
        );
        
        const results = await Promise.all(batch);
        const validResults = results.filter((p): p is Pokemon => p !== null);
        pokemon.push(...validResults);
        
        setProgress({ current: Math.min(i + BATCH_SIZE - start, total), total });
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      }
      
      setPokemonData(pokemon);
    } catch (err) {
      setError('Failed to fetch Pokémon data. Please try again later.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerationData(selectedGen);
  }, [selectedGen]);

  const handleGenerationChange = (generation: string) => {
    setSelectedGen(generation);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading && (
        <div className="w-full space-y-2">
          <Progress value={(progress.current / progress.total) * 100} />
          <p className="text-sm text-muted-foreground text-center">
            Fetching Pokémon data: {progress.current} of {progress.total}
          </p>
        </div>
      )}

      <TypeDistributionChart 
        pokemonData={pokemonData}
        selectedGen={selectedGen}
        onGenerationChange={handleGenerationChange}
        loading={loading}
      />
      <StatsComparisonChart 
        pokemonData={pokemonData}
        selectedGen={selectedGen}
        loading={loading}
      />
      <TypeStatsTable 
        pokemonData={pokemonData}
        loading={loading}
    />
    </div>
  );
}