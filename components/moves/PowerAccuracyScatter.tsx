import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import Image from 'next/image';
import { typeColors } from '@/constants/gendata';
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

interface PowerAccuracyScatterProps {
  moves: Record<string, Move>;
}

export function PowerAccuracyScatter({ moves }: PowerAccuracyScatterProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

  const processData = () => {
    return Object.values(moves)
      .filter(move => 
        move.power !== null && 
        move.accuracy !== null &&
        move.damage_class !== 'status' &&
        (selectedTypes.includes('all') || selectedTypes.includes(move.type))
      )
      .map(move => ({
        name: move.name,
        power: move.power,
        accuracy: move.accuracy,
        type: move.type,
        damage_class: move.damage_class,
        pp: move.pp,
        effect: move.effect_entries[0],
        color: typeColors[move.type.toLowerCase()]?.color
      }));
  };

  const uniqueTypes = ['all', ...Array.from(new Set(Object.values(moves).map(move => move.type)))];
  const data = processData();

  const formatMoveName = (name: string): string => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const move = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-2 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{formatMoveName(move.name)}</span>
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
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Power:</span>
              <span className="font-medium">{move.power}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Accuracy:</span>
              <span className="font-medium">{move.accuracy}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>PP:</span>
              <span className="font-medium">{move.pp}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Click to see more details
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Power vs. Accuracy</CardTitle>
          <ScrollArea className="w-full" aria-orientation="horizontal">
            <ToggleGroup 
              type="multiple"
              value={selectedTypes}
              onValueChange={setSelectedTypes}
              className="justify-start"
            >
              {uniqueTypes.map(type => (
                <ToggleGroupItem 
                  key={type} 
                  value={type}
                  className={cn(
                    type !== 'all' && typeColors[type.toLowerCase()]?.bg,
                    type !== 'all' && typeColors[type.toLowerCase()]?.text
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </ScrollArea>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  dataKey="accuracy"
                  name="Accuracy"
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  type="number"
                  dataKey="power"
                  name="Power"
                  domain={[0, 'dataMax + 20']}
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter
                  data={data}
                  onClick={(data) => setSelectedMove(moves[data.name])}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={entry.color || 'hsl(var(--primary))'}
                      className="cursor-pointer hover:opacity-80"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMove} onOpenChange={() => setSelectedMove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formatMoveName(selectedMove?.name || '')}
              {selectedMove && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-2",
                    typeColors[selectedMove.type.toLowerCase()]?.bg,
                    typeColors[selectedMove.type.toLowerCase()]?.text
                  )}
                >
                  {selectedMove.type}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedMove && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Power</div>
                  <div className="font-medium">{selectedMove.power || '—'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                  <div className="font-medium">{selectedMove.accuracy || '—'}%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">PP</div>
                  <div className="font-medium">{selectedMove.pp}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium capitalize">{selectedMove.damage_class}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Effect</div>
                <div className="text-sm">
                  {selectedMove.effect_entries[0] || 'No effect description available.'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}