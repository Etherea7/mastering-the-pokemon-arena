import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import Image from 'next/image';

interface Counter {
  opp_pokemon: string;
  lose_rate_against_opp: number;
  ko_percent: number;
  switch_percent: number;
}

interface PokemonData {
  sprite: string;
  types: string[];
}

interface CounterMatrixProps {
  pokemonName: string;
  generation?: string;
  format?: string;
  onPokemonSelect: (name: string) => void;
}

export function CounterMatrix({ 
  pokemonName, 
  generation, 
  format,
  onPokemonSelect
}: CounterMatrixProps) {
  const [countersData, setCountersData] = useState<Counter[]>([]);
  const [pokemonSprites, setPokemonSprites] = useState<Record<string, PokemonData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCounterData() {
      if (!pokemonName) return;
      
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          generation: generation || 'gen9',
          battle_format: format?.toLowerCase() || 'ou',
        });
   
        const response = await fetch(`/api/pokemon/counters/${pokemonName}?${queryParams}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch counter data');
        }
        
        setCountersData(data.data || []);

        // Fetch sprite data for all counters
        const spritePromises = data.data.map(async (counter: Counter) => {
          try {
            const formattedName = counter.opp_pokemon.toLowerCase();
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${formattedName}`);
            const pokemonData = await response.json();
            return {
              name: counter.opp_pokemon,
              data: {
                sprite: pokemonData.sprites.front_default,
                types: pokemonData.types.map((t: any) => t.type.name)
              }
            };
          } catch (error) {
            console.error(`Failed to fetch sprite for ${counter.opp_pokemon}:`, error);
            return null;
          }
        });

        const spriteResults = await Promise.all(spritePromises);
        const newSprites: Record<string, PokemonData> = {};
        spriteResults.forEach(result => {
          if (result) {
            newSprites[result.name] = result.data;
          }
        });
        setPokemonSprites(newSprites);

      } catch (err) {
        console.error('Error fetching counter data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch counter data');
      } finally {
        setLoading(false);
      }
    }

    fetchCounterData();
  }, [pokemonName, generation, format]);

  const formatPokemonName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const processedData = countersData
    .sort((a, b) => b.lose_rate_against_opp - a.lose_rate_against_opp);

  const strongestCounters = processedData.slice(0, 4);
  const weakestCounters = [...processedData]
    .sort((a, b) => a.lose_rate_against_opp - b.lose_rate_against_opp)
    .slice(0, 4);

  const renderPokemonCard = (counter: Counter, isStrong: boolean) => (
    <div 
      key={counter.opp_pokemon}
      onClick={() => onPokemonSelect(counter.opp_pokemon)}
      className={cn(
        "flex items-center justify-between p-2 rounded-lg border",
        "cursor-pointer transition-colors duration-200",
        isStrong ? "bg-red-950/50 border-red-800" : "bg-green-950/50 border-green-800",
        "hover:bg-opacity-75"
      )}
    >
      <div className="flex items-center gap-2">
        {pokemonSprites[counter.opp_pokemon]?.sprite && (
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src={pokemonSprites[counter.opp_pokemon].sprite}
              alt={counter.opp_pokemon}
              width={40}
              height={40}
            />
          </div>
        )}
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-sm font-medium text-foreground">
              {formatPokemonName(counter.opp_pokemon)}
            </span>
          </div>
          <div className="flex gap-1">
            {pokemonSprites[counter.opp_pokemon]?.types.map(type => (
              <Badge
                key={type}
                variant="secondary"
                className={cn(
                  "text-[10px] px-1 py-0",
                  typeColors[type.toLowerCase()]?.bg,
                  typeColors[type.toLowerCase()]?.text
                )}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="text-xs text-right">
        <div className="font-medium text-foreground">
          {isStrong ? 'Win' : 'Loss'}: {counter.lose_rate_against_opp.toFixed(1)}%
        </div>
        <div className="text-muted-foreground">
          KO: {counter.ko_percent?.toFixed(1)}%
        </div>
        <div className="text-muted-foreground">
          Switch: {counter.switch_percent?.toFixed(1)}%
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading matchups...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-center text-foreground">
          {formatPokemonName(pokemonName)} Matchups
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-red-400">
              Strong Counters
            </h3>
            {strongestCounters.map(counter => renderPokemonCard(counter, true))}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-green-400">
              Weak Matchups
            </h3>
            {weakestCounters.map(counter => renderPokemonCard(counter, false))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}