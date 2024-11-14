'use client'

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePokemonData } from '@/hooks/usePokemonData';
import { PokemonModalSelector } from '@/components/PokemonStatsDisplay/PokemonSelector';
import { PokemonAbilities } from '@/components/PokemonStatsDisplay/PokemonAbilitiesChart';
import { PokemonMoves } from '@/components/PokemonStatsDisplay/MoveUsageChart';
import { BATTLE_FORMATS, GENERATIONS, type BattleFormat, type Generation } from '@/types/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import Image from 'next/image';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { CounterMatrix } from '@/components/PokemonStatsDisplay/CounterMatrix';
import { NetworkGraph } from '@/components/PokemonStatsDisplay/NetworkGraph';


interface PokemonDetails {
  id: number;
  name: string;
  description: string;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
  }>;
  moves: Array<{
    move: {
      name: string;
      url: string;
    };
  }>;
  evolution_chain?: Array<{
    name: string;
    sprite: string;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg p-2 shadow-md">
        <p className="text-sm font-medium">{label}: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function Page() {
  // State for format selection and Pokemon
  const [selectedFormat, setSelectedFormat] = useState<BattleFormat>('ou');
  const [selectedGeneration, setSelectedGeneration] = useState<Generation>('gen9');
  const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null);
  const [isSelectingPokemon, setIsSelectingPokemon] = useState(false);
  const [pokemonDetails, setPokemonDetails] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const { cache, loading: cacheLoading } = usePokemonData();

  // Get Pokemon data from cache
  const pokemonData = selectedPokemon ? cache[selectedPokemon] : null;

  const fetchPokemonDetails = async (pokemonName: string) => {
    setLoading(true);
    try {
      // Fetch basic Pokemon data
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
      const data = await response.json();

      // Fetch species data for description and evolution chain
      const speciesResponse = await fetch(data.species.url);
      const speciesData = await speciesResponse.json();

      // Get the latest English description
      const description = speciesData.flavor_text_entries
        .filter((entry: any) => entry.language.name === 'en')
        .pop()?.flavor_text.replace(/\f/g, ' ') || '';

      // Fetch evolution chain
      const evoResponse = await fetch(speciesData.evolution_chain.url);
      const evoData = await evoResponse.json();

      // Process evolution chain
      const evolutions: Array<{ name: string; sprite: string }> = [];
      const processEvolutionChain = async (chain: any) => {
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${chain.species.name}`);
        const pokemonData = await pokemonResponse.json();
        evolutions.push({
          name: chain.species.name,
          sprite: pokemonData.sprites.front_default
        });
        
        if (chain.evolves_to?.length > 0) {
          for (const evolution of chain.evolves_to) {
            await processEvolutionChain(evolution);
          }
        }
      };

      await processEvolutionChain(evoData.chain);

      setPokemonDetails({
        id: data.id,
        name: pokemonName,
        description,
        abilities: data.abilities,
        moves: data.moves, // Add moves from the Pokemon data
        evolution_chain: evolutions
      });
    } catch (error) {
      console.error('Error fetching Pokemon details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPokemon) {
      fetchPokemonDetails(selectedPokemon);
    }
  }, [selectedPokemon]);

  const handlePokemonSelect = (pokemonName: string) => {
    setSelectedPokemon(pokemonName);
    setIsSelectingPokemon(false);
  };  

  const renderFormatSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Select value={selectedGeneration} onValueChange={(gen) => setSelectedGeneration(gen as Generation)}>
        <SelectTrigger>
          <SelectValue placeholder="Select Generation" />
        </SelectTrigger>
        <SelectContent>
          {GENERATIONS.map(gen => (
            <SelectItem key={gen} value={gen}>
              {gen.replace('gen', 'Generation ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedFormat} onValueChange={(format) => setSelectedFormat(format as BattleFormat)}>
        <SelectTrigger>
          <SelectValue placeholder="Select Format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title" disabled className="font-semibold">
            Smogon Formats
          </SelectItem>
          {BATTLE_FORMATS.SMOGON.map(format => (
            <SelectItem key={format} value={format}>
              {format.toUpperCase()}
            </SelectItem>
          ))}
          <SelectItem value="title" disabled className="font-semibold">
            VGC Formats
          </SelectItem>
          {BATTLE_FORMATS.VGC.map(format => (
            <SelectItem key={format} value={format}>
              {format}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderPokemonSelector = () => (
    <Card className="mb-6">
      <CardContent className="p-6">
        {selectedPokemon && pokemonData ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {pokemonData.sprite && (
                <div className="relative w-16 h-16">
                  <Image
                    src={pokemonData.sprite}
                    alt={pokemonData.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {pokemonData.name.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </h3>
                <div className="flex gap-2">
                  {pokemonData.types?.map(type => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className={cn(
                        "text-xs",
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
            <Button 
              variant="outline"
              onClick={() => setIsSelectingPokemon(true)}
            >
              Change Pokemon
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full"
            onClick={() => setIsSelectingPokemon(true)}
            disabled={cacheLoading}
          >
            {cacheLoading ? "Loading Pokemon Data..." : "Select Pokemon"}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pokemon Stats</h1>
      </div>

      {/* Format and Generation Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderFormatSelector()}
      </div>

      {/* Pokemon Selector */}
      {renderPokemonSelector()}

      {!selectedPokemon ? (
        <Alert>
          <AlertDescription>
            Please select a Pokemon to view its stats
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-8">
          {/* Pokemon Info Section */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Pokemon Image and Types */}
            <div className="flex flex-col items-center space-y-4">
              {pokemonData?.sprite && (
                <div className="relative w-48 h-48">
                  <Image
                    src={pokemonData.sprite}
                    alt={pokemonData.name}
                    fill
                    className="object-contain pixelated"
                  />
                </div>
              )}
              <div className="flex gap-2 flex-wrap justify-center">
                {pokemonData?.types?.map(type => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className={cn(
                      "text-base",
                      typeColors[type.toLowerCase()]?.bg,
                      typeColors[type.toLowerCase()]?.text
                    )}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats Radar Chart */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-4">Base Stats</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { stat: 'HP', value: pokemonData?.stats.hp },
                    { stat: 'Attack', value: pokemonData?.stats.attack },
                    { stat: 'Defense', value: pokemonData?.stats.defense },
                    { stat: 'Sp. Atk', value: pokemonData?.stats.special_attack },
                    { stat: 'Sp. Def', value: pokemonData?.stats.special_defense },
                    { stat: 'Speed', value: pokemonData?.stats.speed },
                  ]}>
                    <PolarGrid 
                      strokeOpacity={0.2}
                      stroke="currentColor"
                    />
                    <PolarAngleAxis 
                      dataKey="stat"
                      tick={{ fill: 'currentColor' }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 255]}
                      stroke="currentColor"
                      tickCount={6}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Radar
                      name="Stats"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Description and Abilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-muted-foreground">
                {pokemonDetails?.description || 'Loading description...'}
              </p>
            </div>
            
            {pokemonDetails && (
              <PokemonAbilities 
                abilities={pokemonDetails.abilities}
                pokemonName={selectedPokemon}
                generation={selectedGeneration}
                format={selectedFormat}
              />
            )}
          </div>

          {/* Evolution Chain */}
          {pokemonDetails?.evolution_chain && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Evolution Chain</h2>
              <div className="flex items-center justify-center gap-8">
                {pokemonDetails.evolution_chain.map((evo) => (
                  <div 
                    key={evo.name}
                    className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handlePokemonSelect(evo.name)}
                  >
                    <div className="relative w-16 h-16">
                      <Image
                        src={evo.sprite}
                        alt={evo.name}
                        fill
                        className="object-contain pixelated"
                      />
                    </div>
                    <span className="text-sm font-medium capitalize">{evo.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rest of the sections */}
          <PokemonMoves
            pokemonName={selectedPokemon}
            generation={selectedGeneration}
            format={selectedFormat}
            moves={pokemonDetails?.moves || []}
          />

          <NetworkGraph
            pokemonName={selectedPokemon}
            generation={selectedGeneration}
            format={selectedFormat}
            onPokemonSelect={handlePokemonSelect}
          />

          <CounterMatrix
            pokemonName={selectedPokemon}
            generation={selectedGeneration}
            format={selectedFormat}
            onPokemonSelect={handlePokemonSelect}
          />
        </div>
      )}

      <PokemonModalSelector
        open={isSelectingPokemon}
        onClose={() => setIsSelectingPokemon(false)}
        onSelect={handlePokemonSelect}
        generation={selectedGeneration}
        format={selectedFormat}
      />
    </div>
  );
}