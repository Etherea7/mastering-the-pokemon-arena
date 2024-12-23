import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import { usePokemonData } from '@/hooks/usePokemonData';
import type { BattleFormat, Generation } from '@/types/format';

interface PokemonModalSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  generation: Generation;
  format: BattleFormat;
}

interface PokemonWithUsage {
  name: string;
  usage: number;
}

export function PokemonModalSelector({
  open,
  onClose,
  onSelect,
  generation,
  format
}: PokemonModalSelectorProps) {
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pokemonList, setPokemonList] = useState<PokemonWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use the Pokemon data hook
  const { cache, fetchPokemonBatch } = usePokemonData();

  // Fetch Pokemon list when modal opens
  useEffect(() => {
    async function fetchPokemonList() {
      if (!open) return;

      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          battle_format: format.toLowerCase(),
          generation: generation,
        });

      
        const response = await fetch(`/api/pokemon/usage?${params}`);
        const result = await response.json();
        
  

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch Pokemon list');
        }

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid data format received');
        }

        // Process and sort Pokemon by usage
        const processedPokemon = result.data
          .reduce((acc: PokemonWithUsage[], entry: any) => {
            // Check if we already have this Pokemon
            const existing = acc.find(p => p.name === entry.name);
            if (existing) {
              // Update usage if the new value is higher
              if (entry.usage_percent > existing.usage) {
                existing.usage = entry.usage_percent;
              }
            } else {
              // Add new Pokemon
              acc.push({
                name: entry.name,
                usage: entry.usage_percent || 0
              });
            }
            return acc;
          }, [])
          .sort((a:PokemonWithUsage, b:PokemonWithUsage) => b.usage - a.usage);

        setPokemonList(processedPokemon);

        // Fetch Pokemon details for the list
        await fetchPokemonBatch(processedPokemon.map((p:PokemonWithUsage) => p.name), (current, total) => {
          console.log(`Fetching Pokemon data: ${current}/${total}`);
        });

      } catch (err) {
        console.error('Error fetching Pokemon list:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch Pokemon list');
        setPokemonList([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPokemonList();
  }, [open, generation, format, fetchPokemonBatch]);

  const filteredPokemon = pokemonList.filter(pokemon =>
    pokemon.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatPokemonName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Pokemon</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Search Pokemon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading Pokemon data...</p>
            </div>
          ) : filteredPokemon.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">No Pokemon found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-2 pr-4">
                {filteredPokemon.map((pokemon) => {
                  const pokemonData = cache[pokemon.name];
                  return (
                    <button
                      key={pokemon.name}
                      onClick={() => {
                        onSelect(pokemon.name);
                        onClose();
                      }}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors duration-200",
                        "text-left w-full"
                      )}
                    >
                      {pokemonData?.sprite && (
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <Image
                            src={pokemonData.sprite}
                            alt={pokemon.name}
                            fill
                            className=""
                          />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {formatPokemonName(pokemon.name)}
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {pokemonData?.types?.map(type => (
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
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}