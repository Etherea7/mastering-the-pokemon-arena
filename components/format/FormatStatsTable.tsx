import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowUpDown } from "lucide-react";
import Image from 'next/image';
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

interface StatsTableProps {
  pokemonData: ExtendedFormatPokemonData[];
  loading: boolean;
}

// TypeBadge component for consistent type display
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

// PokemonDisplay component for consistent Pokemon display with sprite and types
function PokemonDisplay({ pokemon }: { pokemon: ExtendedFormatPokemonData }) {
  return (
    <div className="flex items-center gap-2">
      {pokemon.sprite && (
        <div className="w-8 h-8 relative flex-shrink-0">
          <Image
            src={pokemon.sprite}
            alt={pokemon.name}
            fill
            sizes="32px"
            className=""
            priority
          />
        </div>
      )}
      <div>
        <div className="font-medium capitalize">{pokemon.name}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {pokemon.types.map(type => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StatsTable({ pokemonData, loading }: StatsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'usage_percent', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const totalPages = Math.ceil(pokemonData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const sortedPokemon = [...pokemonData]
    .sort((a, b) => {
      let aValue: number;
      let bValue: number;

      if (sortConfig.key === 'usage_percent') {
        aValue = a.usage_percent;
        bValue = b.usage_percent;
      } else {
        aValue = a.stats?.[sortConfig.key as keyof typeof a.stats] ?? 0;
        bValue = b.stats?.[sortConfig.key as keyof typeof b.stats] ?? 0;
      }

      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    })
    .slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Pokemon</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('usage_percent')}
                  className="flex items-center"
                >
                  Usage %
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
            {sortedPokemon.map((pokemon) => (
              <TableRow key={pokemon.name}>
                <TableCell>
                  <PokemonDisplay pokemon={pokemon} />
                </TableCell>
                <TableCell>
                  {(pokemon.usage_percent * 100).toFixed(2)}%
                </TableCell>
                <TableCell>{pokemon.stats?.hp}</TableCell>
                <TableCell>{pokemon.stats?.attack}</TableCell>
                <TableCell>{pokemon.stats?.defense}</TableCell>
                <TableCell>{pokemon.stats?.special_attack}</TableCell>
                <TableCell>{pokemon.stats?.special_defense}</TableCell>
                <TableCell>{pokemon.stats?.speed}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Rows per page
          </p>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}