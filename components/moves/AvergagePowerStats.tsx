import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

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

interface AveragePowerStatsProps {
  moves: Record<string, Move>;
}

interface TypeStats {
  type: string;
  averagePower: number;
  physicalPower: number;
  specialPower: number;
  moveCount: number;
  strongestMove: {
    name: string;
    power: number;
    category: string;
  };
}

export function AveragePowerStats({ moves }: AveragePowerStatsProps) {
  const calculateTypeStats = (): TypeStats[] => {
    const stats: Record<string, {
      totalPhysicalPower: number;
      totalSpecialPower: number;
      physicalCount: number;
      specialCount: number;
      strongestMove: {
        name: string;
        power: number;
        category: string;
      };
    }> = {};

    Object.values(moves).forEach(move => {
      if (!stats[move.type]) {
        stats[move.type] = {
          totalPhysicalPower: 0,
          totalSpecialPower: 0,
          physicalCount: 0,
          specialCount: 0,
          strongestMove: {
            name: '',
            power: 0,
            category: ''
          }
        };
      }

      if (move.power !== null) {
        if (move.damage_class === 'physical') {
          stats[move.type].totalPhysicalPower += move.power;
          stats[move.type].physicalCount++;
        } else if (move.damage_class === 'special') {
          stats[move.type].totalSpecialPower += move.power;
          stats[move.type].specialCount++;
        }

        if (move.power > stats[move.type].strongestMove.power) {
          stats[move.type].strongestMove = {
            name: move.name,
            power: move.power,
            category: move.damage_class
          };
        }
      }
    });

    return Object.entries(stats).map(([type, data]) => ({
      type,
      physicalPower: data.physicalCount > 0 
        ? data.totalPhysicalPower / data.physicalCount 
        : 0,
      specialPower: data.specialCount > 0 
        ? data.totalSpecialPower / data.specialCount 
        : 0,
      averagePower: (data.totalPhysicalPower + data.totalSpecialPower) / 
        (data.physicalCount + data.specialCount),
      moveCount: data.physicalCount + data.specialCount,
      strongestMove: data.strongestMove
    })).sort((a, b) => b.averagePower - a.averagePower);
  };

  const typeStats = calculateTypeStats();

  const formatMoveName = (name: string): string => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = typeStats.find(stat => stat.type === label);
      if (!data) return null;

      return (
        <div className="bg-popover border rounded-lg p-2 shadow-md">
          <Badge
            variant="secondary"
            className={cn(
              "mb-2",
              typeColors[label.toLowerCase()]?.bg,
              typeColors[label.toLowerCase()]?.text
            )}
          >
            {label}
          </Badge>
          <div className="space-y-1">
            {payload.map((item: any) => (
              <div key={item.name} className="flex justify-between gap-4">
                <span className="text-sm capitalize">{item.name}</span>
                <span className="text-sm font-medium">
                  {item.value.toFixed(1)}
                </span>
              </div>
            ))}
            <div className="pt-1 mt-1 border-t">
              <div className="text-xs text-muted-foreground">
                Strongest Move: {formatMoveName(data.strongestMove.name)} ({data.strongestMove.power})
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Average Power by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={typeStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="type" 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis tick={{ fill: 'currentColor' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="physicalPower" 
                  name="Physical" 
                  fill="hsl(var(--primary))"
                />
                <Bar 
                  dataKey="specialPower" 
                  name="Special" 
                  fill="hsl(var(--accent))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Type Power Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Avg. Power</TableHead>
                <TableHead className="text-right">Physical</TableHead>
                <TableHead className="text-right">Special</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typeStats.map((stat) => (
                <TableRow key={stat.type}>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        typeColors[stat.type.toLowerCase()]?.bg,
                        typeColors[stat.type.toLowerCase()]?.text
                      )}
                    >
                      {stat.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {stat.averagePower.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.physicalPower > 0 ? stat.physicalPower.toFixed(1) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.specialPower > 0 ? stat.specialPower.toFixed(1) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}