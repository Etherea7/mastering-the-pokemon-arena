'use client'
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import { 
  FormatPokemonData, 
  BattleFormat, 
  Generation,
} from '@/types/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

interface TypeData {
  type: string;
  count: number;
  usagePercent: number;
  pokemon: FormatPokemonData[];
}

interface FormatTypeChartProps {
  pokemonData: FormatPokemonData[];
  selectedFormat: BattleFormat;
  selectedGeneration: Generation;
  onFormatChange: (format: string) => void;
  onGenerationChange: (generation: string) => void;
  loading: boolean;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TypeData;
      const color = typeColors[data.type.toLowerCase()];
      
      return (
        <Badge 
          variant="secondary"
          className={cn(
            "text-sm px-3 py-1",
            color.bg,
            color.text
          )}
        >
          {`${data.type}: ${data.count} Pokémon (${data.usagePercent.toFixed(1)}% total usage)`}
        </Badge>
      );
    }
    return null;
  };

// Pokemon list dialog component
const PokemonListDialog = ({
  open,
  onClose,
  typeData
}: {
  open: boolean;
  onClose: () => void;
  typeData: TypeData | null;
}) => {
  if (!typeData) return null;
  
  const color = typeColors[typeData.type.toLowerCase()];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <Badge 
              variant="secondary"
              className={cn(
                "text-sm px-3 py-1",
                color.bg,
                color.text
              )}
            >
              {typeData.type} Type Pokémon ({(typeData.usagePercent).toFixed(2)}% Usage)
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {typeData.pokemon
              .sort((a, b) => b.usage_percent - a.usage_percent)
              .map((pokemon) => (
                <div 
                  key={pokemon.name}
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
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1">
                        {pokemon.types.map((t) => (
                          <Badge 
                            key={t}
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              typeColors[t.toLowerCase()].bg,
                              typeColors[t.toLowerCase()].text
                            )}
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Usage: {(pokemon.usage_percent * 100).toFixed(2)}%
                      </span>
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

export function FormatTypeChart({ 
    pokemonData,
    loading 
  }: FormatTypeChartProps) {
  const [selectedType, setSelectedType] = useState<TypeData | null>(null);

  // Calculate type distribution and usage
  const calculateTypeDistribution = (): TypeData[] => {
    const typeStats = new Map<string, {
      count: number;
      totalUsage: number;
      pokemon: FormatPokemonData[];
    }>();
  
    // Group Pokemon by type
    pokemonData.forEach(pokemon => {
      pokemon.types.forEach(type => {
        if (!typeStats.has(type)) {
          typeStats.set(type, {
            count: 0,
            totalUsage: 0,
            pokemon: []
          });
        }
  
        const stats = typeStats.get(type)!;
        // Only count each Pokemon once for each type
        if (!stats.pokemon.find(p => p.name === pokemon.name)) {
          stats.count += 1;
          stats.totalUsage += pokemon.usage_percent;
          stats.pokemon.push(pokemon);
        }
      });
    });
  
    // Convert to array and format data
    return Array.from(typeStats.entries())
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        usagePercent: stats.totalUsage * 100, // Convert decimal to percentage
        pokemon: stats.pokemon.sort((a, b) => b.usage_percent - a.usage_percent)
      }))
      .sort((a, b) => b.count - a.count);
  };

  const typeDistribution = calculateTypeDistribution();

  if (loading || pokemonData.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type Distribution and Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={typeDistribution} 
                    margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                    onClick={(data) => {
                    if (data.activePayload) {
                        setSelectedType(data.activePayload[0].payload as TypeData);
                    }
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis 
                    label={{ 
                        value: 'Pokémon Count', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: -40
                    }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                    name="Count"
                    dataKey="count"
                    >
                    {typeDistribution.map((entry) => (
                        <Cell
                        key={`cell-${entry.type}`}
                        cursor="pointer"
                        fill={typeColors[entry.type.toLowerCase()].color}
                        />
                    ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
        
        <PokemonListDialog
          open={!!selectedType}
          onClose={() => setSelectedType(null)}
          typeData={selectedType}
        />
      </CardContent>
    </Card>
  );
}