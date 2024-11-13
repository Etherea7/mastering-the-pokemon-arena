import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

interface PokemonRadarChartProps {
  pokemonName: string;
  className?: string;
}

interface PokemonData {
  stats: PokemonStats;
  sprite: string;
  description: string; // Add this
}

export default function PokemonRadarChart({ pokemonName }: PokemonRadarChartProps) {
  const [stats, setStats] = useState<PokemonStats | null>(null);
  const [description, setDescription] = useState<string>('');
  const [sprite, setSprite] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPokemonData() {
      if (!pokemonName) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/pokeapi/sprites/${pokemonName}`);
        const data = await res.json();
        setStats(data.stats);
        setSprite(data.sprite);
        setDescription(data.description); // Add this
      } catch (error) {
        console.error('Failed to fetch Pokemon data:', error);
        setStats(null);
        setSprite('');
        setDescription('');
      } finally {
        setLoading(false);
      }
    }

    fetchPokemonData();
  }, [pokemonName]);

  if (!pokemonName || !stats) {
    return (
      <Card className="border-none bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader>
          <CardTitle>Pokemon Stats</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          {loading ? "Loading..." : "Select a Pokemon to view stats"}
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { stat: 'HP', value: stats.hp },
    { stat: 'Attack', value: stats.attack },
    { stat: 'Defense', value: stats.defense },
    { stat: 'Sp. Atk', value: stats.special_attack },
    { stat: 'Sp. Def', value: stats.special_defense },
    { stat: 'Speed', value: stats.speed },
  ];

  return (
    <div className="flex items-center justify-center gap-8 h-full">
      {/* Radar Chart */}
      <Card className="border-none bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="text-center pb-4">
          <CardTitle>
            Base Stats - {pokemonName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width={300} height={300}>
            <RadarChart
              data={chartData}
              margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
            >
              <PolarGrid gridType="circle" />
              <PolarAngleAxis
                dataKey="stat"
                tick={{ fill: 'white', fontSize: 14 }}
                dy={4}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 255]}
                tick={{ fill: 'white' }}
              />
              <Radar
                name="Stats"
                dataKey="value"
                stroke="rgb(147, 157, 238)"
                fill="rgb(147, 157, 238)"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
  
      {/* Pokémon Image and Description */}
      <div className="flex flex-col items-center">
        <img
          src={sprite}
          alt={pokemonName}
          className="w-40 h-40 object-contain"
        />
        {description && (
          <p className="text-center text-sm text-muted-foreground mt-4 max-w-xs">
            {description}
          </p>
        )}
      </div>
    </div>
  );  
}