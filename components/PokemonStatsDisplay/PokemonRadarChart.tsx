// components/PokemonRadarChart.tsx
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
}

export default function PokemonRadarChart({ pokemonName }: PokemonRadarChartProps) {
  const [stats, setStats] = useState<PokemonStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPokemonStats() {
      if (!pokemonName) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/pokeapi/sprites/${pokemonName}`);
        const data = await res.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Failed to fetch Pokemon stats:', error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPokemonStats();
  }, [pokemonName]);

  if (!pokemonName || !stats) {
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Base Stats - {pokemonName}</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="stat" />
            <PolarRadiusAxis angle={30} domain={[0, 255]} />
            <Radar
              name="Stats"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}