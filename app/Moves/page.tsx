'use client'

import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TypeMovesVisualization } from '@/components/moves/TypeMovesVisualization';
import { useMoveData } from '@/hooks/useMoveData';
import { MoveTypeHeatmap } from "@/components/moves/TypeMovesHeatmap";
import { AveragePowerStats } from "@/components/moves/AvergagePowerStats";

export default function MovesPage() {
  const { moves, loading, error, progress } = useMoveData();

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Pokemon Moves Analysis</h1>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Type-Based Move Count */}
            <TypeMovesVisualization moves={moves} />
            <MoveTypeHeatmap moves={moves} />
        </div>
        <AveragePowerStats moves={moves} />
        {/* Placeholder for Power vs. Accuracy Scatter Plot */}
        <Card className="h-[500px]">
          {/* Will implement Scatter Plot component next */}
        </Card>
        
        {/* Placeholder for Move Category Proportion */}
        <Card className="h-[500px]">
          {/* Will implement Pie Chart component next */}
        </Card>
        
        {/* Placeholder for Move Comparison Table */}
        <Card className="h-[500px]">
          {/* Will implement Table component next */}
        </Card>
      </div>
    
  );
}