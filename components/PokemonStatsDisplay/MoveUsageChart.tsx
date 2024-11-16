import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import MovesTreeMap from './MovesAnalysis';

interface MoveUsage {
  move: string;
  min: number;
  max: number;
  avgPoints: number;
}

interface MonthlyUsage {
  year_month: string;
  usage: number;
}


interface RawMoveData {
  data: {
    [moveName: string]: Array<{
      year_month: string;
      usage: number;
    }>;
  };
}

interface ProcessedMoveUsage {
  move: string;
  min: number;
  max: number;
  avgPoints: number;
}

interface Move {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  damage_class: string;
  effect_entries: string;
  usage?: {
    min: number;
    max: number;
    avgPoints: number;
  };
}

interface PokemonMovesProps {
  pokemonName: string;
  generation: string;
  format: string;
  moves: Array<{
    move: {
      name: string;
      url: string;
    };
  }>;
}

export function PokemonMoves({ 
  pokemonName,
  generation,
  format,
  moves: initialMoves 
}: PokemonMovesProps) {
  const [moves, setMoves] = useState<Move[]>([]);
  const [moveUsages, setMoveUsages] = useState<MoveUsage[]>([]);
  const [moveTypes, setMoveTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMoveDetails() {
      setLoading(true);
      try {
        // 1. Fetch usage data from your API
        const usageResponse = await fetch(
          `/api/pokemon/moves/aggregate?name=${pokemonName}&generation=${generation}&format=${format}`
        );
        const rawData: RawMoveData = await usageResponse.json();
        
  
  
        // 2. Process the usage data - handle the nested data structure
        const processedUsages = Object.entries(rawData.data || {}).reduce((acc: ProcessedMoveUsage[], [moveName, monthlyData]) => {
          // Safety check for array
          if (!Array.isArray(monthlyData)) {
            console.warn(`Monthly data for ${moveName} is not an array:`, monthlyData);
            return acc;
          }
  
          // Extract usage values
          const usages = monthlyData
            .filter(data => data && typeof data.usage === 'number')
            .map(data => data.usage);
  
          if (usages.length === 0) {
            console.warn(`No valid usage data found for ${moveName}`);
            return acc;
          }
  
          acc.push({
            move: moveName,
            min: Math.min(...usages),
            max: Math.max(...usages),
            avgPoints: monthlyData.length
          });
  
          return acc;
        }, []);
  

        setMoveUsages(processedUsages);
  
        // Rest of the code remains the same...
        // 3. Fetch move types
        const moveTypePromises = processedUsages.map(async (moveData) => {
          try {
            const formattedMoveName = moveData.move.toLowerCase().replace(/\s+/g, '-');
            const response = await fetch(`/api/pokeapi/moves/${formattedMoveName}`);
            const data = await response.json();
            return [moveData.move, data.type];
          } catch (error) {
            console.error(`Failed to fetch type for ${moveData.move}:`, error);
            return [moveData.move, 'normal'];
          }
        });
  
        const typeResults = await Promise.all(moveTypePromises);
        setMoveTypes(Object.fromEntries(typeResults));
  
        // 4. Process moves list if we have initialMoves
        if (initialMoves?.length > 0) {
          const movePromises = initialMoves.map(async (moveEntry) => {
            if (!moveEntry?.move?.url) return null;
  
            try {
              const moveResponse = await fetch(moveEntry.move.url);
              const moveData = await moveResponse.json();
  
              const usageInfo = processedUsages.find((usage) => 
                usage.move.toLowerCase() === moveData.name.replace(/-/g, ' ').toLowerCase()
              );
  
              const effectEntry = moveData.effect_entries.find((entry: any) => 
                entry.language.name === 'en'
              );
  
              return {
                name: moveData.name,
                type: moveData.type.name,
                power: moveData.power,
                accuracy: moveData.accuracy,
                pp: moveData.pp,
                damage_class: moveData.damage_class.name,
                effect_entries: effectEntry?.short_effect || 'No description available',
                usage: usageInfo ? {
                  min: usageInfo.min,
                  max: usageInfo.max,
                  avgPoints: usageInfo.avgPoints
                } : undefined
              };
            } catch (error) {
              console.error(`Error fetching move details for ${moveEntry.move.name}:`, error);
              return null;
            }
          });
  
          const movesData = (await Promise.all(movePromises)).filter(Boolean);
          const sortedMoves = movesData.sort((a, b) => {
            if (a?.usage && b?.usage) return b.usage.max - a.usage.max;
            if (a?.usage) return -1;
            if (b?.usage) return 1;
            return (a?.name || '').localeCompare(b?.name || '');
          });
  
          setMoves(sortedMoves as Move[]);
        }
  
      } catch (error) {
        console.error('Error fetching move details:', error);
      } finally {
        setLoading(false);
      }
    }
  
    if (pokemonName) {
      fetchMoveDetails();
    }
  }, [pokemonName, generation, format, initialMoves]);

  const formatMoveName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Moves</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[500px]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Skeleton className="h-[500px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Moves</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Move</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Category</TableHead>
                  <TableHead className="text-right">Power</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moves.map((move) => (
                  <TableRow key={move.name} className="group">
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {formatMoveName(move.name)}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1 group-hover:block hidden">
                          {move.effect_entries}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          typeColors[move.type.toLowerCase()]?.bg,
                          typeColors[move.type.toLowerCase()]?.text
                        )}
                      >
                        {move.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {formatMoveName(move.damage_class)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {move.power ? (
                        <span className="text-sm">
                          {move.power}
                        </span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {moveUsages.length > 0 && (
        <MovesTreeMap
          moveUsages={moveUsages}
        />
      )}
    </div>
  );
}