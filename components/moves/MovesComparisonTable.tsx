import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '../ui/scroll-area';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Filter,
  Loader2
} from "lucide-react";
import Image from 'next/image';
import { typeColors } from '@/constants/gendata';
import { cn } from "@/lib/utils";
import { usePokemonData } from '@/hooks/usePokemonData';

interface Move {
    id: number;
    name: string;
    type: string;
    power: number | null;
    accuracy: number | null;
    pp: number;
    damage_class: string;
    effect_entries: string[];
    url: string;
  }

  interface LearnsetCache {
    [key: string]: Array<{ name: string; url: string }>;
  }
  
  
  interface MovesComparisonTableProps {
    moves: Record<string, Move>;
    pokemonCache: Record<string, {
      sprite: string;
      types: string[];
    }>;
    fetchPokemonBatch: (names: string[]) => Promise<void>;
  }

type SortConfig = {
  key: keyof Move | 'name';
  direction: 'asc' | 'desc';
};

export function MovesComparisonTable({ moves }: MovesComparisonTableProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const { cache: pokemonCache, fetchPokemonBatch } = usePokemonData();
  const [loadingPokemon, setLoadingPokemon] = useState(false);
  const [learnsetPokemon, setLearnsetPokemon] = useState<string[]>([]);
  const [learnsetCache, setLearnsetCache] = useState<LearnsetCache>({});

  const uniqueTypes = useMemo(() => 
    Array.from(new Set(Object.values(moves).map(move => move.type))).sort(),
    [moves]
  );

  const filteredAndSortedMoves = useMemo(() => {
    let filtered = Object.values(moves).filter(move => {
      const matchesSearch = move.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = !selectedType || move.type === selectedType;
      const matchesCategory = !selectedCategory || move.damage_class === selectedCategory;
      return matchesSearch && matchesType && matchesCategory;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [moves, search, selectedType, selectedCategory, sortConfig]);

  const handleSort = (key: keyof Move | 'name') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const fetchLearnsetPokemon = async (moveName: string) => {
    setLoadingPokemon(true);
    try {
      const move = moves[moveName];
      if (!move) {
        setLearnsetPokemon([]);
        return;
      }
  
      // Check if we have cached learnset data
      if (learnsetCache[moveName]) {
        const pokemonList = learnsetCache[moveName].map(p => p.name);
        setLearnsetPokemon(pokemonList);
        
        // Fetch sprites in background if needed
        const uncachedPokemon = pokemonList.filter(name => !pokemonCache[name]);
        if (uncachedPokemon.length > 0) {
          await fetchPokemonBatch(uncachedPokemon);
        }
        return;
      }
  
      // Fetch learnset data
      const moveResponse = await fetch(move.url);
      const moveData = await moveResponse.json();
      
      if (!moveData.learned_by_pokemon) {
        setLearnsetPokemon([]);
        return;
      }
  
      // Cache the learnset data
      setLearnsetCache(prev => ({
        ...prev,
        [moveName]: moveData.learned_by_pokemon
      }));
  
      // Set the Pokemon list and fetch sprites
      const pokemonList = moveData.learned_by_pokemon.map((p: any) => p.name);
      setLearnsetPokemon(pokemonList);
  
      // Fetch sprite data for uncached Pokemon
      const uncachedPokemon = pokemonList.filter((name:any) => !pokemonCache[name]);
      if (uncachedPokemon.length > 0) {
        await fetchPokemonBatch(uncachedPokemon);
      }
  
    } catch (error) {
      console.error('Failed to process learnset:', error);
      setLearnsetPokemon([]);
    } finally {
      setLoadingPokemon(false);
    }
  };

  const formatMoveName = (name: string): string => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const SortIcon = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => {
    if (!active) return <ChevronsUpDown className="w-4 h-4 ml-1" />;
    return direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
            <CardTitle>Moves Comparison</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search moves..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-auto"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    {selectedType || 'All Types'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedType(null)}>
                    All Types
                  </DropdownMenuItem>
                  {uniqueTypes.map(type => (
                    <DropdownMenuItem 
                      key={type} 
                      onClick={() => setSelectedType(type)}
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          typeColors[type.toLowerCase()]?.bg,
                          typeColors[type.toLowerCase()]?.text
                        )}
                      >
                        {type}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    {selectedCategory || 'All Categories'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                    All Categories
                  </DropdownMenuItem>
                  {['physical', 'special', 'status'].map(category => (
                    <DropdownMenuItem 
                      key={category} 
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        <div className="max-h-[600px] overflow-auto">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    <SortIcon 
                      active={sortConfig.key === 'name'} 
                      direction={sortConfig.direction} 
                    />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort('power')}
                  >
                    Power
                    <SortIcon 
                      active={sortConfig.key === 'power'} 
                      direction={sortConfig.direction} 
                    />
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort('accuracy')}
                  >
                    Accuracy
                    <SortIcon 
                      active={sortConfig.key === 'accuracy'} 
                      direction={sortConfig.direction} 
                    />
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort('pp')}
                  >
                    PP
                    <SortIcon 
                      active={sortConfig.key === 'pp'} 
                      direction={sortConfig.direction} 
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedMoves.map((move) => (
                  <TableRow 
                    key={move.id}
                    className="cursor-pointer hover:bg-muted/50 motion-preset-slide-up"
                    onClick={() => {
                      setSelectedMove(move.name);
                      fetchLearnsetPokemon(move.name);
                    }}
                  >
                    <TableCell className="font-medium">
                      {formatMoveName(move.name)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          typeColors[move.type.toLowerCase()]?.bg,
                          typeColors[move.type.toLowerCase()]?.text
                        )}
                      >
                        {move.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {move.damage_class}
                    </TableCell>
                    <TableCell className="text-right">
                      {move.power || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {move.accuracy ? `${move.accuracy}%` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {move.pp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog 
        open={!!selectedMove} 
        onOpenChange={(isOpen) => {
            if (!isOpen) {
            setTimeout(() => {
                setSelectedMove(null);
                setLearnsetPokemon([]);
            }, 100);
            }
        }}
        >
  <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        Pokémon that can learn {formatMoveName(selectedMove || '')}
        {moves[selectedMove || ''] && (
          <Badge
            variant="secondary"
            className={cn(
              typeColors[moves[selectedMove || ''].type.toLowerCase()]?.bg,
              typeColors[moves[selectedMove || ''].type.toLowerCase()]?.text
            )}
          >
            {moves[selectedMove || ''].type}
          </Badge>
        )}
      </DialogTitle>
    </DialogHeader>

    {loadingPokemon ? (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ) : learnsetPokemon.length === 0 ? (
      <div className="text-center text-muted-foreground py-8">
        No Pokémon found that can learn this move
      </div>
    ) : (
      <div className="relative flex-1 -mx-6">
        <ScrollArea className="h-[60vh] px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {learnsetPokemon.map((pokemon) => (
              <div 
                key={pokemon}
                className="flex flex-col items-center p-2 border rounded-lg hover:bg-muted/50"
              >
                {pokemonCache[pokemon]?.sprite && (
                  <div className="relative w-16 h-16">
                    <Image
                      src={pokemonCache[pokemon].sprite}
                      alt={pokemon}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="text-sm font-medium mt-2">
                  {formatMoveName(pokemon)}
                </span>
                <div className="flex gap-1 mt-1 flex-wrap justify-center">
                  {pokemonCache[pokemon]?.types?.map(type => (
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
            ))}
          </div>
        </ScrollArea>
      </div>
    )}
  </DialogContent>
</Dialog>
    </>
  );
}