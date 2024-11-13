// components/PokemonSelector.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const BATTLE_FORMATS = ['ou', 'uu', 'ru', 'nu', 'pu'];
const GENERATIONS = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9'];

interface PokemonSelectorProps {
  selectedPokemon: string;
  selectedGen: string;
  selectedFormat: string;
  onPokemonSelect: (pokemon: string) => void;
  onGenSelect: (gen: string) => void;
  onFormatSelect: (format: string) => void;
}

export default function PokemonSelector({
  selectedPokemon,
  selectedGen,
  selectedFormat,
  onPokemonSelect,
  onGenSelect,
  onFormatSelect
}: PokemonSelectorProps) {
  const [allPokemon, setAllPokemon] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchPokemonList() {
      if (!selectedGen || !selectedFormat) {
        setAllPokemon([]);
        return;
      }
      
      try {
        const res = await fetch(`/api/pokemon?battle_format=${selectedFormat}&generation=${selectedGen}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllPokemon(data);
        }
      } catch (error) {
        console.error('Failed to fetch Pokemon list:', error);
        setAllPokemon([]);
      }
    }
    fetchPokemonList();
  }, [selectedGen, selectedFormat]);

  const formatPokemonName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Select Pokemon</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={selectedGen} onValueChange={onGenSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select Generation" />
            </SelectTrigger>
            <SelectContent>
              {GENERATIONS.map(gen => (
                <SelectItem key={gen} value={gen}>
                  {gen.replace('gen', 'Gen ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedFormat} onValueChange={onFormatSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select Format" />
            </SelectTrigger>
            <SelectContent>
              {BATTLE_FORMATS.map(format => (
                <SelectItem key={format} value={format}>
                  {format.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedPokemon} 
            onValueChange={onPokemonSelect}
            disabled={!selectedGen || !selectedFormat}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Pokemon" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-60">
                {allPokemon.map(pokemon => (
                  <SelectItem key={pokemon} value={pokemon}>
                    {formatPokemonName(pokemon)}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}