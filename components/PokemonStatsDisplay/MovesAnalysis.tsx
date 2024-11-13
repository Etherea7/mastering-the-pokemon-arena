import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { typeColors, UNKNOWN_MOVE_COLOR } from '@/constants/gendata';

const MovesAnalysis = ({ pokemonName, generation, format }) => {
  const [moveData, setMoveData] = useState(null);
  const [moveTypes, setMoveTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const capitalizeFirstLetter = (string) => {
    return string
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
  };

  const isSpecialMove = (moveName: string) => {
    const name = moveName.toLowerCase();
    return name === 'nothing' || 
           name === 'other' || 
           name === '(no move)';
  };

  const fetchMoveType = async (moveName) => {
    if (isSpecialMove(moveName)) {
      return 'unknown';
    }
    try {
      const formattedName = moveName.toLowerCase().replace(/\s+/g, '-');
      const response = await fetch(`/api/pokeapi/moves/${formattedName}`);
      const data = await response.json();
      return data.type;
    } catch (error) {
      console.error(`Failed to fetch type for move ${moveName}:`, error);
      return 'normal'; // fallback to normal type
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const formattedName = capitalizeFirstLetter(pokemonName);
        const url = `/api/pokemon/moves/aggregate?name=${encodeURIComponent(formattedName)}&generation=${encodeURIComponent(generation)}&format=${encodeURIComponent(format)}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.data) {
          throw new Error('Invalid API response structure');
        }

        // Fetch types for all moves
        const moveTypePromises = Object.keys(result.data).map(async (moveName) => {
          const type = await fetchMoveType(moveName);
          return [moveName, type];
        });

        const typeResults = await Promise.all(moveTypePromises);
        const typeMap = Object.fromEntries(typeResults);

        setMoveTypes(typeMap);
        setMoveData(result.data);
      } catch (err) {
        console.error('[Error] Failed to fetch move data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (pokemonName && generation && format) {
      fetchData();
    }
  }, [pokemonName, generation, format]);

  const getTreemapData = () => {
    if (!moveData) return [];

    const moves = Object.entries(moveData)
      .map(([move, usageData]) => {
        const total = usageData.reduce((sum, data) => sum + data.usage, 0);
        const average = total / usageData.length;
        
        return {
          name: move,
          size: Number(average.toFixed(2)),
          monthsCount: usageData.length,
          recentUsage: usageData
            .sort((a, b) => b.year_month.localeCompare(a.year_month))[0]?.usage || 0,
          type: moveTypes[move] || 'normal'
        };
      })
      .filter(move => move.size > 0)
      .sort((a, b) => b.size - a.size)
      .slice(0, 15);

    return [{
      name: 'moves',
      children: moves
    }];
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const type = data.type || 'normal';
      const typeColor = typeColors[type]?.color || '#A8A878';
      
      return (
        <div className="bg-white p-2 shadow-lg rounded-lg border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm" style={{ color: typeColor }}>
            Type: {capitalizeFirstLetter(type)}
          </p>
          <p className="text-sm text-muted-foreground">
            Average Usage: {data.size}%
          </p>
          <p className="text-xs text-muted-foreground">
            Recent Usage: {data.recentUsage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomContent = ({ root, depth, x, y, width, height, index, name, size, type }) => {
    const moveType = type || 'normal';
    const color = moveType === 'unknown' ? UNKNOWN_MOVE_COLOR : (typeColors[moveType]?.color || '#A8A878');
    
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
            style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}
          >
            <tspan x={x + width / 2} dy="-0.5em">{name}</tspan>
            <tspan x={x + width / 2} dy="1.2em">{size}%</tspan>
          </text>
        )}
      </g>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">Loading move data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const treemapData = getTreemapData();

  if (!moveData || treemapData[0]?.children.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>No move data available for {capitalizeFirstLetter(pokemonName)}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Move Usage Distribution for {capitalizeFirstLetter(pokemonName)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full">
          <ResponsiveContainer>
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4/3}
              stroke="#fff"
              content={CustomContent}
            >
              <Tooltip content={CustomTooltip} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MovesAnalysis;