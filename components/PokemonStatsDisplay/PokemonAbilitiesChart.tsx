import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  if (!pokemonName || !generation || !format) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abilities</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-muted-foreground">
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
        <CardContent className="text-center py-6">
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
      <CardContent>
        {abilities.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70%]">Ability</TableHead>
                <TableHead className="w-[30%] text-right">Usage %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abilities.map((ability) => (
                <TableRow key={ability.ability}>
                  <TableCell className="font-medium">
                    {ability.ability.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </TableCell>
                  <TableCell className="text-right">
                    {ability.usage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No ability data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}