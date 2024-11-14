import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { typeColors } from '@/constants/gendata';
import { Skeleton } from "@/components/ui/skeleton";

interface MoveUsage {
  move: string;
  min: number;
  max: number;
  avgPoints: number;
}

interface CustomContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  type: string;
}

const MovesTreeMap: React.FC<{
  moveUsages: MoveUsage[];
}> = ({ moveUsages }) => {
  const [moveTypes, setMoveTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const validMoveUsages = Array.isArray(moveUsages) ? moveUsages : [];

  useEffect(() => {
    const fetchMoveTypes = async () => {
      setLoading(true);
      const types: Record<string, string> = {};
      
      try {
        // Fetch types for all moves in parallel
        const promises = validMoveUsages.map(async (moveData) => {
          try {
            const formattedName = moveData.move.toLowerCase().replace(/\s+/g, '-');
            const response = await fetch(`https://pokeapi.co/api/v2/move/${formattedName}`);
            const data = await response.json();
            return { move: moveData.move, type: data.type.name };
          } catch (error) {
            console.error(`Failed to fetch type for move ${moveData.move}:`, error);
            return { move: moveData.move, type: 'normal' }; // Fallback to normal type
          }
        });

        const results = await Promise.all(promises);
        results.forEach(({ move, type }) => {
          types[move] = type;
        });

        setMoveTypes(types);
      } catch (error) {
        console.error('Error fetching move types:', error);
      } finally {
        setLoading(false);
      }
    };

    if (validMoveUsages.length > 0) {
      fetchMoveTypes();
    }
  }, [validMoveUsages]);

  const treeMapData = [{
    name: 'moves',
    children: moveUsages.map(moveData => ({
      name: moveData.move,
      size: moveData.max,
      type: moveTypes[moveData.move] || 'normal'
    }))
  }];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const moveData = validMoveUsages.find(m => m.move === data.name);
      const type = moveTypes[data.name] || 'normal';
      const typeColor = typeColors[type]?.color || typeColors.normal.color;
      
      return (
        <div className="bg-popover border rounded-lg p-2 shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm" style={{ color: typeColor }}>
            Type: {type.charAt(0).toUpperCase() + type.slice(1)}
          </p>
          {moveData && (
            <>
              <p className="text-sm text-muted-foreground">
                Usage Range: {moveData.min.toFixed(1)}% - {moveData.max.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Data Points: {moveData.avgPoints}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomContent = React.memo(({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name = '',
    type = 'normal'
  }: Partial<CustomContentProps>) => {
    const typeKey = type.toLowerCase() as keyof typeof typeColors;
    const color = typeColors[typeKey]?.color || typeColors.normal.color;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          stroke="#fff"
          strokeWidth={2}
          className="transition-colors duration-200 hover:opacity-80"
        />
        {width > 50 && height > 30 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            className="text-xs font-medium"
            style={{ 
              textShadow: '1px 1px 2px rgba(0,0,0,0.75)',
              pointerEvents: 'none'
            }}
          >
            {name}
          </text>
        )}
      </g>
    );
  });
  CustomContent.displayName = 'CustomContent';

  if (validMoveUsages.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No move usage data available
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Move Usage Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Move Usage Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full">
          <ResponsiveContainer>
            <Treemap
              data={treeMapData}
              dataKey="size"
              aspectRatio={4/3}
              stroke="#fff"
              content={<CustomContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MovesTreeMap;