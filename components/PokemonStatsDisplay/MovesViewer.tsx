import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TYPE_COLORS = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

interface MovesViewerProps {
    pokemonName: string;
    generation?: string;
    format?: string;
  }

const MovesViewer = ({ pokemonName, generation, format }: MovesViewerProps) => {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredMove, setHoveredMove] = useState(null);

  useEffect(() => {
    const fetchMoves = async () => {
      if (!pokemonName) return;
      
      setLoading(true);
      setError('');
      
      try {
        const queryParams = new URLSearchParams({
          name: pokemonName,
        });
        
        if (generation) queryParams.append('generation', generation);
        if (format) queryParams.append('battle_format', format);

        const res = await fetch(`/api/pokemon/moves?${queryParams}`);
        const data = await res.json();
        console.log(data);
        
        if (!res.ok) throw new Error(data.error || 'Failed to fetch moves');
        
        const processedMoves = data.data?.map(move => ({
          name: move.move,
          usage: move.usage || 0,
          type: move.type || 'normal',
        })) || [];

        setMoves(processedMoves);
      } catch (err) {
        setError('Failed to fetch move data');
        setMoves([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMoves();
  }, [pokemonName, generation, format]);

  const formatPokemonName = (name) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const calculateCirclePosition = (index, total, radius) => {
    const angle = (index / total) * 2 * Math.PI;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return { x, y };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Moves Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-lg">Loading moves...</div>
          </div>
        ) : (
          <div className="relative h-96">
            <svg width="100%" height="100%" viewBox="-200 -200 400 400">
              {/* Center circle */}
              <circle
                cx="0"
                cy="0"
                r="30"
                fill="#f0f0f0"
                stroke="#666"
                strokeWidth="2"
              />
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm font-medium"
                fill="#666"
              >
                {formatPokemonName(pokemonName)}
              </text>

              {/* Move circles */}
              {moves.map((move, index) => {
                const { x, y } = calculateCirclePosition(index, moves.length, 120);
                const radius = Math.max(20, (move.usage / 100) * 40);

                return (
                  <g key={move.name}>
                    <line
                      x1="0"
                      y1="0"
                      x2={x}
                      y2={y}
                      stroke="#ccc"
                      strokeWidth="1"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={TYPE_COLORS[move.type] || '#999'}
                      opacity={hoveredMove === move.name ? 0.8 : 0.6}
                      stroke="#fff"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredMove(move.name)}
                      onMouseLeave={() => setHoveredMove(null)}
                      className="cursor-pointer transition-opacity duration-200"
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize="12"
                      className="pointer-events-none"
                    >
                      {formatPokemonName(move.name)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover tooltip */}
            {hoveredMove && (
              <div
                className="absolute bg-white p-2 rounded-lg shadow-lg border"
                style={{
                  left: '50%',
                  bottom: '10px',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="font-medium">
                  {formatPokemonName(hoveredMove)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Usage: {moves.find(m => m.name === hoveredMove)?.usage?.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MovesViewer;