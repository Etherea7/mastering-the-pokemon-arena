import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Ability {
  ability: string;
  usage: number;
}

interface PokemonAbilitiesChartProps {
  pokemonName: string;
  generation: string;
  format: string;
}

export default function PokemonAbilitiesChart({ 
  pokemonName,
  generation,
  format 
}: PokemonAbilitiesChartProps) {
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAbilities() {
      if (!pokemonName || !generation || !format) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/pokemon/abilities/${pokemonName}?generation=${generation}&battle_format=${format}`);
        const data = await res.json();
        
        if (data.data) {
          setAbilities(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch abilities:', error);
        setAbilities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAbilities();
  }, [pokemonName, generation, format]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow-lg rounded-lg border">
          <p className="font-medium">{payload[0].payload.ability}</p>
          <p className="text-sm text-muted-foreground">
            Usage: {payload[0].payload.usage}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (!pokemonName || !generation || !format) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abilities</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          Select a Pokemon to view abilities
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abilities</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          Loading abilities...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abilities Usage</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        {abilities.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={abilities}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                type="category" 
                dataKey="ability"
                width={75}
                style={{ fontSize: '0.875rem' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="usage" 
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No ability data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}