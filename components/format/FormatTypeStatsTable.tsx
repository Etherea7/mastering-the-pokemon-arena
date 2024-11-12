import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import { FormatPokemonData } from "@/types/format";

interface ExtendedFormatPokemonData extends FormatPokemonData {
  stats?: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
}

interface TypeStatsTableProps {
  pokemonData: ExtendedFormatPokemonData[];
  loading: boolean;
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
  pokemonCount: number;
  totalUsage: number;
}

function TypeBadge({ type }: { type: string }) {
  const colors = typeColors[type.toLowerCase()] || { bg: "bg-gray-500", text: "text-white" };
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "ml-1 text-xs capitalize",
        colors.bg,
        colors.text
      )}
    >
      {type}
    </Badge>
  );
}

export default function FormatTypeStatsTable({ pokemonData, loading }: TypeStatsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'type', direction: 'asc' });

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const calculateTypeStats = (): TypeStats[] => {
    const typeStats: Record<string, {
      totalStats: {
        hp: number;
        attack: number;
        defense: number;
        special_attack: number;
        special_defense: number;
        speed: number;
      };
      pokemonCount: number;
      totalUsage: number;
    }> = {};

    // Initialize stats for each type
    pokemonData.forEach(pokemon => {
      if (!pokemon.stats) return;

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
            pokemonCount: 0,
            totalUsage: 0
          };
        }

        // Add stats
        if (!pokemon.stats) return;
        typeStats[type].totalStats.hp += pokemon.stats.hp;
        typeStats[type].totalStats.attack += pokemon.stats.attack;
        typeStats[type].totalStats.defense += pokemon.stats.defense;
        typeStats[type].totalStats.special_attack += pokemon.stats.special_attack;
        typeStats[type].totalStats.special_defense += pokemon.stats.special_defense;
        typeStats[type].totalStats.speed += pokemon.stats.speed;
        typeStats[type].pokemonCount += 1;
        typeStats[type].totalUsage += pokemon.usage_percent;
      });
    });

    // Calculate averages
    return Object.entries(typeStats).map(([type, data]) => ({
      type,
      averageStats: {
        hp: Math.round(data.totalStats.hp / data.pokemonCount),
        attack: Math.round(data.totalStats.attack / data.pokemonCount),
        defense: Math.round(data.totalStats.defense / data.pokemonCount),
        special_attack: Math.round(data.totalStats.special_attack / data.pokemonCount),
        special_defense: Math.round(data.totalStats.special_defense / data.pokemonCount),
        speed: Math.round(data.totalStats.speed / data.pokemonCount)
      },
      pokemonCount: data.pokemonCount,
      totalUsage: data.totalUsage
    }));
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const typeStatsData = calculateTypeStats();
  const sortedData = [...typeStatsData].sort((a, b) => {
    let aValue: number | string = a.type;
    let bValue: number | string = b.type;

    if (sortConfig.key !== 'type' && sortConfig.key !== 'pokemonCount' && sortConfig.key !== 'totalUsage') {
      aValue = a.averageStats[sortConfig.key as keyof typeof a.averageStats];
      bValue = b.averageStats[sortConfig.key as keyof typeof b.averageStats];
    } else if (sortConfig.key === 'pokemonCount') {
      aValue = a.pokemonCount;
      bValue = b.pokemonCount;
    } else if (sortConfig.key === 'totalUsage') {
      aValue = a.totalUsage;
      bValue = b.totalUsage;
    }

    return sortConfig.direction === 'asc'
      ? aValue > bValue ? 1 : -1
      : aValue < bValue ? 1 : -1;
  });

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('type')}
                className="flex items-center"
              >
                Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('totalUsage')}
                className="flex items-center"
              >
                Usage %
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('pokemonCount')}
                className="flex items-center"
              >
                Pokemon Count
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('hp')}
                className="flex items-center"
              >
                HP
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('attack')}
                className="flex items-center"
              >
                Attack
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('defense')}
                className="flex items-center"
              >
                Defense
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('special_attack')}
                className="flex items-center"
              >
                Sp. Atk
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('special_defense')}
                className="flex items-center"
              >
                Sp. Def
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort('speed')}
                className="flex items-center"
              >
                Speed
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((typeData) => (
            <TableRow key={typeData.type}>
              <TableCell>
                <TypeBadge type={typeData.type} />
              </TableCell>
              <TableCell>
                {(typeData.totalUsage * 100).toFixed(2)}%
              </TableCell>
              <TableCell>{typeData.pokemonCount}</TableCell>
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
  );
}