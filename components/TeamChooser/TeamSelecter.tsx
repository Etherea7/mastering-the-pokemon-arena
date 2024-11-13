// components/PokemonModalSelector.tsx
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';

interface PokemonOption {
  name: string;
  sprite?: string;
  types?: string[];
}

interface PokemonModalSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: PokemonOption[];
  disabled?: boolean;
}

export function PokemonModalSelector({
  open,
  onClose,
  onSelect,
  options = [],
  disabled = false,
}: PokemonModalSelectorProps) {
  const [search, setSearch] = useState('');

  const groupedAndFilteredPokemon = useMemo(() => {
    const filtered = options.filter(pokemon => 
      pokemon.name.toLowerCase().includes(search.toLowerCase())
    );

    return filtered.reduce((acc, pokemon) => {
      let tier = 'Other';
      
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(pokemon);
      return acc;
    }, {} as Record<string, PokemonOption[]>);
  }, [options, search]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Pokemon</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Search Pokemon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />
          <ScrollArea className="h-[400px]">
            {Object.entries(groupedAndFilteredPokemon).map(([tier, pokemonList]) => (
              <div key={tier} className="mb-6">
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">{tier}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {pokemonList.map((pokemon) => (
                    <button
                      key={pokemon.name}
                      onClick={() => {
                        onSelect(pokemon.name);
                        onClose();
                      }}
                      disabled={disabled}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors duration-200",
                        "text-left"
                      )}
                    >
                      {pokemon.sprite && (
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <Image
                            src={pokemon.sprite}
                            alt={pokemon.name}
                            fill
                            className="object-contain pixelated"
                          />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {pokemon.name}
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {pokemon.types?.map(type => (
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
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}