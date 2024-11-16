import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormStatsTable from "@/components/format/FormatStatsTable";
import { FormatPokemonData } from "@/types/format";
import FormatTypeStatsTable from './FormatTypeStatsTable';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { typeColors } from '@/constants/gendata';
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

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

interface FormatStatsTablesProps {
  pokemonData?: ExtendedFormatPokemonData[];
  loading: boolean;
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

function PokemonDisplay({ pokemon }: { pokemon: ExtendedFormatPokemonData }) {
    return (
      <div className="flex flex-col items-center">
        {pokemon.sprite && (
          <div className="w-full aspect-square relative">
            <Image
              src={pokemon.sprite}
              alt={pokemon.name}
              fill
              sizes="100%"
              className=""
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

export default function FormatStatsTables({ pokemonData = [], loading }: FormatStatsTablesProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'typeStats'>('stats');

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Format Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error or empty state
  if (!Array.isArray(pokemonData) || pokemonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Format Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            No Pokemon data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate highest stats with null checks
  const highestStats = {
    hp: pokemonData.reduce((max, pokemon) => 
      (pokemon.stats?.hp || 0) > (max.stats?.hp || 0) ? pokemon : max, pokemonData[0]),
    attack: pokemonData.reduce((max, pokemon) => 
      (pokemon.stats?.attack || 0) > (max.stats?.attack || 0) ? pokemon : max, pokemonData[0]),
    defense: pokemonData.reduce((max, pokemon) => 
      (pokemon.stats?.defense || 0) > (max.stats?.defense || 0) ? pokemon : max, pokemonData[0]),
    special_attack: pokemonData.reduce((max, pokemon) => 
      (pokemon.stats?.special_attack || 0) > (max.stats?.special_attack || 0) ? pokemon : max, pokemonData[0]),
    special_defense: pokemonData.reduce((max, pokemon) => 
      (pokemon.stats?.special_defense || 0) > (max.stats?.special_defense || 0) ? pokemon : max, pokemonData[0]),
    speed: pokemonData.reduce((max, pokemon) => 
      (pokemon.stats?.speed || 0) > (max.stats?.speed || 0) ? pokemon : max, pokemonData[0]),
  };

  // Validate that we have valid stat data
  const hasValidStats = Object.values(highestStats).every(pokemon => 
    pokemon && pokemon.stats && Object.values(pokemon.stats).some(stat => stat > 0)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Format Analysis</CardTitle>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'stats' | 'typeStats')}>
            <TabsList>
              <TabsTrigger value="stats">Pokemon Stats</TabsTrigger>
              <TabsTrigger value="typeStats">Type Stats</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {hasValidStats ? (
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
                    Value: {pokemon.stats?.[stat as keyof typeof pokemon.stats] ?? 'N/A'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mb-6 p-4 text-center text-muted-foreground">
            Stat data not available
          </div>
        )}

        {activeTab === 'stats' && (
          <FormStatsTable pokemonData={pokemonData} loading={loading} />
        )}
       
        {activeTab === 'typeStats' && (
          <FormatTypeStatsTable pokemonData={pokemonData} loading={loading} />
        )}
      </CardContent>
    </Card>
  );
}