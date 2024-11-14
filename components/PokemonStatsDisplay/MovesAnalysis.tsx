import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { typeColors } from '@/constants/gendata';

interface MoveUsage {
  move: string;
  min: number;
  max: number;
  avgPoints: number;
}

interface MoveType {
  name: string;
  type: string;
}

interface MovesTreeMapProps {
  moveUsages: MoveUsage[];
  moveTypes: Record<string, string>;
}

interface ProcessedMoveUsage {
  move: string;
  min: number;
  max: number;
  avgPoints: number;
}

interface MovesTreeMapProps {
  moveUsages: ProcessedMoveUsage[];
  moveTypes: Record<string, string>;
}

const MovesTreeMap: React.FC<MovesTreeMapProps> = ({ moveUsages, moveTypes }) => {
  console.log('moveUsages received:', moveUsages);
  const validMoveUsages = Array.isArray(moveUsages) ? moveUsages : [];
  // Transform the data for the treemap
  const treeMapData = [{
    name: 'moves',
    children: moveUsages.map(moveData => ({
      name: moveData.move,
      size: moveData.max, // Using max usage for size
      type: moveTypes[moveData.move] || 'normal'
    }))
  }];

  console.log('Transformed treeMapData:', treeMapData);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const moveData = moveUsages.find(m => m.move === data.name);
      const type = moveTypes[data.name] || 'normal';
      
      return (
        <div className="bg-white p-2 shadow-lg rounded-lg border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm" style={{ color: typeColors[type]?.color }}>
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

  // Custom content renderer for the treemap boxes
  const CustomContent = ({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name = '',
    type = 'normal'
  }: any) => {
    const color = typeColors[type]?.color || typeColors.normal.color;
    
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
            fill="#fff"
            className="text-xs font-medium"
            style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}
          >
            {name}
          </text>
        )}
      </g>
    );
  };

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
            >
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  const moveData = validMoveUsages.find(m => m.move === data.name);
                  const type = moveTypes[data.name] || 'normal';
                  
                  return (
                    <div className="bg-white p-2 shadow-lg rounded-lg border">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm" style={{ color: typeColors[type]?.color }}>
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
              }} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MovesTreeMap;