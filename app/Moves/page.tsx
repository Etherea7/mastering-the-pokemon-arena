'use client'

import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TypeMovesVisualization } from '@/components/moves/TypeMovesVisualization';
import { MoveTypeHeatmap } from '@/components/moves/TypeMovesHeatmap';
import { AveragePowerStats } from '@/components/moves/AvergagePowerStats';
import { PowerAccuracyScatter } from '@/components/moves/PowerAccuracyScatter';
import { MoveCategoryPieChart } from '@/components/moves/MovePieChart';
import { MovesComparisonTable } from '@/components/moves/MovesComparisonTable';
import { usePokemonData } from '@/hooks/usePokemonData';
import { useMoveData } from '@/hooks/useMoveData';

export default function MovesPage() {
  const { moves, loading: movesLoading, error: movesError, progress } = useMoveData();
  const { 
    cache: pokemonCache, 
    fetchPokemonBatch,
    loading: pokemonLoading 
  } = usePokemonData();

  if (movesError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{movesError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (movesLoading || pokemonLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="space-y-2">
          <Progress value={(progress.current / progress.total) * 100} />
          <p className="text-sm text-muted-foreground text-center">
            Loading moves data: {progress.current} of {progress.total}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[500px]" />
          ))}
        </div>
      </div>
    );
  }

  console.log('Moves data:', Object.keys(moves).length);
  console.log('Pokemon cache:', Object.keys(pokemonCache).length);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Pokemon Moves Analysis</h1>
      
      {/* Type Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TypeMovesVisualization moves={moves} />
        <MoveTypeHeatmap moves={moves} />
      </div>

      {/* Power Analysis Section */}
      <AveragePowerStats moves={moves} />

      {/* Scatter Plot and Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PowerAccuracyScatter moves={moves} />
        <MoveCategoryPieChart moves={moves} />
      </div>

      {/* Moves Table */}
      <MovesComparisonTable 
        moves={moves} 
        pokemonCache={pokemonCache}
        fetchPokemonBatch={fetchPokemonBatch}
      />
    </div>
  );
}