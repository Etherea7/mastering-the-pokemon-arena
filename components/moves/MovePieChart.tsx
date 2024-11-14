import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { typeColors } from '@/constants/gendata';
import { cn } from "@/lib/utils";
import { fromTheme } from 'tailwind-merge';

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

interface MoveCategoryPieChartProps {
  moves: Record<string, Move>;
}

export function MoveCategoryPieChart({ moves }: MoveCategoryPieChartProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const processData = () => {
    const filteredMoves = Object.values(moves).filter(move => 
      selectedType === 'all' || move.type === selectedType
    );

    const categories = filteredMoves.reduce((acc, move) => {
      acc[move.damage_class] = (acc[move.damage_class] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Physical', value: categories.physical || 0, color: 'hsl(var(--primary))' },
      { name: 'Special', value: categories.special || 0, color: 'hsl(var(--accent))' },
      { name: 'Status', value: categories.status || 0, color: 'hsl(var(--secondary))' }
    ];
  };

  const uniqueTypes = ['all', ...Array.from(new Set(Object.values(moves).map(move => move.type)))];
  const data = processData();

  const renderActiveShape = (props: any) => {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, value, percent
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="currentColor"
          className="text-base font-medium"
        >
          {payload.name}
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill="currentColor"
          className="text-sm"
        >
          {value} moves ({(percent * 100).toFixed(1)}%)
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-2 shadow-md">
          <div className="font-medium">{data.name}</div>
          <div className="text-sm space-y-1">
            <div>{data.value} moves</div>
            <div>{(data.percent * 100).toFixed(1)}% of total</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Move Categories Distribution</CardTitle>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    {type === 'all' ? (
                      'All Types'
                    ) : (
                      <Badge
                        variant="secondary"
                        className={cn(
                          typeColors[type.toLowerCase()]?.bg,
                          typeColors[type.toLowerCase()]?.text
                        )}
                      >
                        {type}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="stroke-background hover:opacity-80 cursor-pointer"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {data.map((category) => (
            <div 
              key={category.name}
              className="text-center p-2 rounded-lg border"
              style={{ borderColor: category.color }}
            >
              <div className="text-sm font-medium">{category.name}</div>
              <div className="text-2xl font-bold">{category.value}</div>
              <div className="text-sm text-muted-foreground">
                {((category.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        {/* Additional Stats for Selected Type */}
        {selectedType !== 'all' && (
          <div className="mt-6 p-4 rounded-lg border">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  typeColors[selectedType.toLowerCase()]?.bg,
                  typeColors[selectedType.toLowerCase()]?.text
                )}
              >
                {selectedType}
              </Badge>
              Type Statistics
            </h3>
            <div className="text-sm text-muted-foreground">
              Total Moves: {data.reduce((sum, d) => sum + d.value, 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Most Common Category: {data.reduce((max, d) => d.value > max.value ? d : max).name}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}