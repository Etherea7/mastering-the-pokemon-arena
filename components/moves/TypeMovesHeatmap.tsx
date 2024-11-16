import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Move {
  id: number;
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  damage_class: string;
  effect_entries: string[];
}

interface ProcessedMoveData {
  type: string;
  physical: number;
  special: number;
  status: number;
  total: number;
  percentageOfTotal: number;
}

interface MoveTypeHeatmapProps {
  moves: Record<string, Move>;
}

export function MoveTypeHeatmap({ moves }: MoveTypeHeatmapProps) {
  const processData = (): ProcessedMoveData[] => {
    const typeCategories: Record<string, Record<string, number>> = {};
    const totalMoves = Object.values(moves).length;
    
    // Initialize type categories
    Object.values(moves).forEach(move => {
      if (!typeCategories[move.type]) {
        typeCategories[move.type] = {
          physical: 0,
          special: 0,
          status: 0,
          total: 0
        };
      }
      typeCategories[move.type][move.damage_class]++;
      typeCategories[move.type].total++;
    });

    return Object.entries(typeCategories).map(([type, counts]) => ({
      type,
      physical: counts.physical, // Ensure physical is included
      special: counts.special,   // Ensure special is included
      status: counts.status,     // Ensure status is included
      total: counts.total,
      percentageOfTotal: (counts.total / totalMoves) * 100
    }));
  };

  const data = processData();
  const maxCount = Math.max(...data.map(d => d.total));

  const getIntensity = (count: number) => {
    return Math.max(0.2, count / maxCount);
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>Move Distribution Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 min-w-[600px]">
          {/* Header */}
          <div className="sticky top-0 bg-background z-10"></div>
          <div className="sticky top-0 bg-background z-10 text-center font-medium">Physical</div>
          <div className="sticky top-0 bg-background z-10 text-center font-medium">Special</div>
          <div className="sticky top-0 bg-background z-10 text-center font-medium">Status</div>

          {/* Data rows */}
          {data.map(({ type, physical, special, status, total, percentageOfTotal }) => (
            <TooltipProvider key={type} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="contents">
                    <div className="flex items-center">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "w-20",
                          typeColors[type.toLowerCase()]?.bg,
                          typeColors[type.toLowerCase()]?.text
                        )}
                      >
                        {type}
                      </Badge>
                    </div>
                    <div 
                      className="p-4 text-center transition-colors hover:bg-muted/50"
                      style={{
                        backgroundColor: `hsla(var(--primary) / ${getIntensity(physical)})`
                      }}
                    >
                      {physical}
                    </div>
                    <div 
                      className="p-4 text-center transition-colors hover:bg-muted/50"
                      style={{
                        backgroundColor: `hsla(var(--accent) / ${getIntensity(special)})`
                      }}
                    >
                      {special}
                    </div>
                    <div 
                      className="p-4 text-center transition-colors hover:bg-muted/50"
                      style={{
                        backgroundColor: `hsla(var(--secondary) / ${getIntensity(status)})`
                      }}
                    >
                      {status}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" align="start">
                  <div className="space-y-1">
                    <div className="font-medium">{type} Type Moves</div>
                    <div className="text-sm">Total: {total} moves</div>
                    <div className="text-sm">
                      {percentageOfTotal.toFixed(1)}% of all moves
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}