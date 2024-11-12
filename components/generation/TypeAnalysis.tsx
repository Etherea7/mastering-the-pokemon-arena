// components/generation/TypeAnalysis.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GENERATION_RANGES } from '@/constants/gendata';
import { Skeleton } from "@/components/ui/skeleton";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprite?: string;
}

interface TypeAnalysisProps {
  pokemonData: Pokemon[];
  selectedGen: string;
  onGenerationChange: (generation: string) => void;
  loading: boolean;
}
const LoadingSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-[200px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
// Type-safe color mapping
type PokemonType = 
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';
const typeColors: Record<PokemonType, { bg: string; text: string; color: string }> = {
  normal: { bg: "bg-gray-400", text: "text-white", color: "#A8A878" },
  fire: { bg: "bg-red-500", text: "text-white", color: "#F08030" },
  water: { bg: "bg-blue-500", text: "text-white", color: "#6890F0" },
  electric: { bg: "bg-yellow-400", text: "text-black", color: "#F8D030" },
  grass: { bg: "bg-green-500", text: "text-white", color: "#78C850" },
  ice: { bg: "bg-blue-200", text: "text-black", color: "#98D8D8" },
  fighting: { bg: "bg-red-700", text: "text-white", color: "#C03028" },
  poison: { bg: "bg-purple-500", text: "text-white", color: "#A040A0" },
  ground: { bg: "bg-amber-600", text: "text-white", color: "#E0C068" },
  flying: { bg: "bg-indigo-300", text: "text-black", color: "#A890F0" },
  psychic: { bg: "bg-pink-500", text: "text-white", color: "#F85888" },
  bug: { bg: "bg-lime-500", text: "text-white", color: "#A8B820" },
  rock: { bg: "bg-yellow-700", text: "text-white", color: "#B8A038" },
  ghost: { bg: "bg-purple-700", text: "text-white", color: "#705898" },
  dragon: { bg: "bg-indigo-600", text: "text-white", color: "#7038F8" },
  dark: { bg: "bg-gray-700", text: "text-white", color: "#705848" },
  steel: { bg: "bg-gray-400", text: "text-white", color: "#B8B8D0" },
  fairy: { bg: "bg-pink-300", text: "text-black", color: "#EE99AC" }
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const type = data.type.toLowerCase() as PokemonType;
    const typeColor = typeColors[type];
    

    return (
      
        <Badge 
            variant="secondary"
            className={cn(
            "text-sm px-3 py-1",
            typeColor.bg,
            typeColor.text
            )}
        >
            {`Click to see ${data.count} ${data.type} type Pokémon`}

        </Badge>
    );
  }
  return null;
};

// Pokemon list dialog component
const PokemonListDialog = ({
  open,
  onClose,
  type,
  pokemonList
}: {
  open: boolean;
  onClose: () => void;
  type: string;
  pokemonList: Pokemon[];
}) => {
  const typeColor = typeColors[type.toLowerCase() as PokemonType];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <Badge 
              variant="secondary"
              className={cn(
                "text-sm px-3 py-1",
                typeColor.bg,
                typeColor.text
              )}
            >
              {type} Type Pokémon
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pokemonList.map((pokemon) => (
              <div 
                key={pokemon.id}
                className="flex items-center gap-2 p-2 rounded-lg border"
              >
                {pokemon.sprite && (
                  <div className="w-12 h-12 relative">
                    <Image
                      src={pokemon.sprite}
                      alt={pokemon.name}
                      fill
                      className="object-contain pixelated"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium capitalize">{pokemon.name}</p>
                  <div className="flex gap-1">
                    {pokemon.types.map((t) => (
                      <Badge 
                        key={t}
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          typeColors[t.toLowerCase() as PokemonType].bg,
                          typeColors[t.toLowerCase() as PokemonType].text
                        )}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export const TypeDistributionChart = ({ 
  pokemonData, 
  selectedGen, 
  onGenerationChange, 
  loading 
}: TypeAnalysisProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Process type distribution
  const calculateTypeDistribution = () => {
    const typeCounts: { [key: string]: number } = {};
    
    pokemonData.forEach(pokemon => {
      pokemon.types.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  };

  const typeDistribution = calculateTypeDistribution();

  // Get Pokemon list for selected type
  const getPokemonByType = (type: string) => {
    return pokemonData.filter(pokemon => 
      pokemon.types.map(t => t.toLowerCase()).includes(type.toLowerCase())
    );
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Pokémon Type Distribution</span>
          <Select value={selectedGen} onValueChange={onGenerationChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Generation" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(GENERATION_RANGES).map(gen => (
                <SelectItem key={gen} value={gen}>
                  Gen {gen.slice(3)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={typeDistribution} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onClick={(data) => {
                if (data.activePayload) {
                  setSelectedType(data.activePayload[0].payload.type);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count">
                {typeDistribution.map((entry) => (
                  <Cell
                    key={`cell-${entry.type}`}
                    cursor="pointer"
                    fill={typeColors[entry.type.toLowerCase() as PokemonType].color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Type badges below chart */}
        <div className="flex flex-wrap gap-2 mt-4">
          {typeDistribution.map(({ type, count }) => {
            const typeKey = type.toLowerCase() as PokemonType;
            return (
              <Badge
                key={type}
                variant="secondary"
                className={cn(
                  "text-sm cursor-pointer",
                  typeColors[typeKey].bg,
                  typeColors[typeKey].text
                )}
                onClick={() => setSelectedType(type)}
              >
                {type}: {count}
              </Badge>
            )}
          )}
        </div>

        {/* Pokemon list dialog */}
        {selectedType && (
          <PokemonListDialog
            open={!!selectedType}
            onClose={() => setSelectedType(null)}
            type={selectedType}
            pokemonList={getPokemonByType(selectedType)}
          />
        )}
      </CardContent>
    </Card>
  );
};