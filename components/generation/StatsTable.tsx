import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

interface TypeStats {
  type: string;
  averageStats: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
}

interface StatsTableProps {
  pokemonData: Pokemon[];
  loading: boolean;
}

const typeColors: Record<string, { bg: string; text: string }> = {
  normal: { bg: "bg-gray-400", text: "text-white" },
  fire: { bg: "bg-red-500", text: "text-white" },
  water: { bg: "bg-blue-500", text: "text-white" },
  electric: { bg: "bg-yellow-400", text: "text-black" },
  grass: { bg: "bg-green-500", text: "text-white" },
  ice: { bg: "bg-blue-200", text: "text-black" },
  fighting: { bg: "bg-red-700", text: "text-white" },
  poison: { bg: "bg-purple-500", text: "text-white" },
  ground: { bg: "bg-amber-600", text: "text-white" },
  flying: { bg: "bg-indigo-300", text: "text-black" },
  psychic: { bg: "bg-pink-500", text: "text-white" },
  bug: { bg: "bg-lime-500", text: "text-white" },
  rock: { bg: "bg-yellow-700", text: "text-white" },
  ghost: { bg: "bg-purple-700", text: "text-white" },
  dragon: { bg: "bg-indigo-600", text: "text-white" },
  dark: { bg: "bg-gray-700", text: "text-white" },
  steel: { bg: "bg-gray-400", text: "text-white" },
  fairy: { bg: "bg-pink-300", text: "text-black" }
};

function TypeBadge({ type }: { type: string }) {
  const colors = typeColors[type.toLowerCase()] || { bg: "bg-gray-500", text: "text-white" };
  return (
    <Badge 
      variant="secondary" 
      className={cn("ml-1 text-xs capitalize", colors.bg, colors.text)}
    >
      {type}
    </Badge>
  );
}

function PokemonDisplay({ pokemon }: { pokemon: Pokemon }) {
  return (
    <div className="flex flex-col items-center">
      {pokemon.sprite && (
        <div className="w-full aspect-square relative">
          <Image
            src={pokemon.sprite}
            alt={pokemon.name}
            fill
            sizes="100%"
            className="pixelated"
            priority
          />
        </div>
      )}
      <div className="w-full text-center mt-2">
        <div className="font-medium capitalize">{pokemon.name}</div>
        <div className="flex flex-wrap justify-center gap-1 mt-1">
          {pokemon.types.map(type => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TypeStatsTable({ pokemonData, loading }: StatsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'type', direction: 'asc' });

  // Find Pokemon with highest stats
  const highestStats = {
    hp: pokemonData.reduce((max, pokemon) => 
      pokemon.stats.hp > max.stats.hp ? pokemon : max, pokemonData[0]),
    attack: pokemonData.reduce((max, pokemon) => 
      pokemon.stats.attack > max.stats.attack ? pokemon : max, pokemonData[0]),
    defense: pokemonData.reduce((max, pokemon) => 
      pokemon.stats.defense > max.stats.defense ? pokemon : max, pokemonData[0]),
    special_attack: pokemonData.reduce((max, pokemon) => 
      pokemon.stats.special_attack > max.stats.special_attack ? pokemon : max, pokemonData[0]),
    special_defense: pokemonData.reduce((max, pokemon) => 
      pokemon.stats.special_defense > max.stats.special_defense ? pokemon : max, pokemonData[0]),
    speed: pokemonData.reduce((max, pokemon) => 
      pokemon.stats.speed > max.stats.speed ? pokemon : max, pokemonData[0]),
  };

  const calculateTypeStats = (): TypeStats[] => {
    const typeStats: Record<string, {
      totalStats: Record<string, number>;
      count: number;
    }> = {};

    // Initialize type stats
    pokemonData.forEach(pokemon => {
      pokemon.types.forEach(type => {
        if (!typeStats[type]) {
          typeStats[type] = {
            totalStats: {
              hp: 0,
              attack: 0,
              defense: 0,
              special_attack: 0,
              special_defense: 0,
              speed: 0
            },
            count: 0
          };
        }

        // Update totals
        typeStats[type].totalStats.hp += pokemon.stats.hp;
        typeStats[type].totalStats.attack += pokemon.stats.attack;
        typeStats[type].totalStats.defense += pokemon.stats.defense;
        typeStats[type].totalStats.special_attack += pokemon.stats.special_attack;
        typeStats[type].totalStats.special_defense += pokemon.stats.special_defense;
        typeStats[type].totalStats.speed += pokemon.stats.speed;
        typeStats[type].count += 1;
      });
    });

    // Calculate averages
    return Object.entries(typeStats).map(([type, data]) => ({
      type,
      averageStats: {
        hp: Math.round(data.totalStats.hp / data.count),
        attack: Math.round(data.totalStats.attack / data.count),
        defense: Math.round(data.totalStats.defense / data.count),
        special_attack: Math.round(data.totalStats.special_attack / data.count),
        special_defense: Math.round(data.totalStats.special_defense / data.count),
        speed: Math.round(data.totalStats.speed / data.count)
      }
    }));
  };

  const sortedData = calculateTypeStats().sort((a, b) => {
    const getValue = (item: TypeStats) => {
      if (sortConfig.key === 'type') return item.type;
      return item.averageStats[sortConfig.key as keyof typeof item.averageStats];
    };

    const aValue = getValue(a);
    const bValue = getValue(b);

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Type Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Highest Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {Object.entries(highestStats).map(([stat, pokemon]) => (
            <Card key={stat}>
              <CardHeader className="p-3">
                <CardTitle className="text-sm text-center">
                  Highest {stat.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <PokemonDisplay pokemon={pokemon} />
                <div className="text-sm font-medium mt-2 text-center">
                  Value: {pokemon.stats[stat as keyof typeof pokemon.stats]}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Table */}
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('type')}
                  >
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                {[
                  { key: 'hp', label: 'HP' },
                  { key: 'attack', label: 'Attack' },
                  { key: 'defense', label: 'Defense' },
                  { key: 'special_attack', label: 'Sp. Attack' },
                  { key: 'special_defense', label: 'Sp. Defense' },
                  { key: 'speed', label: 'Speed' }
                ].map(({ key, label }) => (
                  <TableHead key={key}>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort(key)}
                    >
                      {label}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((typeData) => (
                <TableRow key={typeData.type}>
                  <TableCell>
                    <TypeBadge type={typeData.type} />
                  </TableCell>
                  <TableCell>{typeData.averageStats.hp}</TableCell>
                  <TableCell>{typeData.averageStats.attack}</TableCell>
                  <TableCell>{typeData.averageStats.defense}</TableCell>
                  <TableCell>{typeData.averageStats.special_attack}</TableCell>
                  <TableCell>{typeData.averageStats.special_defense}</TableCell>
                  <TableCell>{typeData.averageStats.speed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}