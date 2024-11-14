import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { typeColors } from '@/constants/gendata';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

interface TypeMovesVisualizationProps {
  moves: Record<string, Move>;
}

export function TypeMovesVisualization({ moves }: TypeMovesVisualizationProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['physical', 'special', 'status']);

  const processData = () => {
    const typeCount: Record<string, Record<string, number>> = {};
    
    Object.values(moves).forEach(move => {
      if (!typeCount[move.type]) {
        typeCount[move.type] = {
          physical: 0,
          special: 0,
          status: 0,
          total: 0
        };
      }
      typeCount[move.type][move.damage_class]++;
      typeCount[move.type].total++;
    });

    return Object.entries(typeCount).map(([type, counts]) => ({
      type,
      ...counts,
      color: typeColors[type.toLowerCase()]?.color
    }));
  };

  const data = processData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const type = label.toLowerCase();
      return (
        <div className="bg-popover border rounded-lg p-2 shadow-md">
          <Badge
            variant="secondary"
            className={cn(
              "mb-2",
              typeColors[type]?.bg,
              typeColors[type]?.text
            )}
          >
            {label}
          </Badge>
          <div className="space-y-1">
            {payload.map((item: any) => (
              <div key={item.name} className="flex justify-between gap-4">
                <span className="text-sm capitalize">
                  {item.name === 'total' ? 'Total' : item.name}
                </span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moves by Type and Category</CardTitle>
        <ToggleGroup 
          type="multiple" 
          value={selectedCategories}
          onValueChange={setSelectedCategories}
          className="justify-start"
        >
          <ToggleGroupItem value="physical">Physical</ToggleGroupItem>
          <ToggleGroupItem value="special">Special</ToggleGroupItem>
          <ToggleGroupItem value="status">Status</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="type"
                tick={{ fill: 'currentColor' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: 'currentColor' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedCategories.includes('physical') && (
                <Bar 
                  dataKey="physical" 
                  name="Physical" 
                  stackId="a"
                  fill="hsl(var(--primary))"
                />
              )}
              {selectedCategories.includes('special') && (
                <Bar 
                  dataKey="special" 
                  name="Special" 
                  stackId="a"
                  fill="hsl(var(--accent))"
                />
              )}
              {selectedCategories.includes('status') && (
                <Bar 
                  dataKey="status" 
                  name="Status" 
                  stackId="a"
                  fill="hsl(var(--secondary))"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}