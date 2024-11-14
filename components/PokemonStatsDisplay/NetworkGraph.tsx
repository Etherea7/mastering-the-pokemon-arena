import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePokemonData } from '@/hooks/usePokemonData';

interface Teammate {
  name: string;
  usage: number;
  sprite?: string;
}

interface Node {
  x: number;
  y: number;
  pokemon: string;
  usage?: number;
  sprite?: string;
}

interface NetworkGraphProps {
  pokemonName: string;
  generation: string;
  format: string;
  onPokemonSelect: (name: string) => void;
}

export function NetworkGraph({ 
  pokemonName, 
  generation, 
  format,
  onPokemonSelect
}: NetworkGraphProps) {
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  
  const { cache } = usePokemonData();

  useEffect(() => {
    async function fetchTeammates() {
      if (!pokemonName) return;
      
      setLoading(true);
      try {
        const formatPokemonName = (name: string) => {
          return name
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('-');
        };

        const url = `/api/pokemon/teammates/${formatPokemonName(pokemonName)}`;
        const queryParams = new URLSearchParams({
          generation,
          battle_format: format.toLowerCase()
        });

        const res = await fetch(`${url}?${queryParams}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch teammates');
        }

        // Process and take top 5 teammates
        const teammatesData = (data.teammates || [])
          .slice(0, 5)
          .map((teammate: any) => {
            const name = teammate.name || teammate.teammate;
            return {
              name: formatPokemonName(name),
              usage: parseFloat(teammate.usage) || 0,
              sprite: cache[name.toLowerCase()]?.sprite
            };
          })
          .filter((teammate:Teammate) => teammate.usage > 0)
          .sort((a: Teammate, b: Teammate) => b.usage - a.usage);

        setTeammates(teammatesData);
      } catch (error) {
        console.error('Failed to fetch teammates:', error);
        setError('Failed to fetch teammate data');
        setTeammates([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTeammates();
  }, [pokemonName, generation, format, cache]);

  const formatPokemonName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const calculateNodePositions = (): Node[] => {
    const centerX = 0;
    const centerY = 0;
    const radius = 120;
    const nodePositions: Node[] = [];

    // Center node (selected Pokemon)
    nodePositions.push({
      x: centerX,
      y: centerY,
      pokemon: pokemonName,
      sprite: cache[pokemonName.toLowerCase()]?.sprite
    });

    // Teammate nodes in a circle around the center
    teammates.forEach((teammate, index) => {
      const angle = (index / teammates.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions.push({
        x,
        y,
        pokemon: teammate.name,
        usage: teammate.usage,
        sprite: teammate.sprite
      });
    });

    return nodePositions;
  };

  const nodes = calculateNodePositions();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Top Teammates Network</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-lg">Loading network...</div>
          </div>
        ) : (
          <div className="relative h-96">
            <svg width="100%" height="100%" viewBox="-200 -200 400 400">
              {/* Connection lines */}
              {nodes.slice(1).map((node, index) => (
                <line
                  key={`line-${index}`}
                  x1={0}
                  y1={0}
                  x2={node.x}
                  y2={node.y}
                  stroke="#ccc"
                  strokeWidth={2}
                  strokeOpacity={0.5}
                />
              ))}

              {/* Center node (selected Pokemon) */}
              <g>
                <circle
                  cx={0}
                  cy={0}
                  r={40}
                  fill="#8884d8"
                  opacity={0.8}
                  stroke="#fff"
                  strokeWidth={2}
                />
                {nodes[0].sprite && (
                  <image
                    href={nodes[0].sprite}
                    x={-25}
                    y={-25}
                    width={50}
                    height={50}
                    className="pixelated"
                  />
                )}
                <text
                  x={0}
                  y={45}
                  textAnchor="middle"
                  fill="white"
                  fontSize={12}
                  className="pointer-events-none"
                >
                  {formatPokemonName(pokemonName)}
                </text>
              </g>

              {/* Teammate nodes */}
              {nodes.slice(1).map((node, index) => (
                <g 
                  key={`node-${index}`}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onPokemonSelect(node.pokemon)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={35}
                    fill="#b9b4e5"
                    opacity={hoveredNode === node ? 0.9 : 0.7}
                    stroke="#fff"
                    strokeWidth={2}
                    className="transition-opacity duration-200"
                  />
                  {node.sprite && (
                    <image
                      href={node.sprite}
                      x={node.x - 25}
                      y={node.y - 25}
                      width={50}
                      height={50}
                      className="pixelated"
                    />
                  )}
                  <text
                    x={node.x}
                    y={node.y + 45}
                    textAnchor="middle"
                    fill="white"
                    fontSize={11}
                    className="pointer-events-none"
                  >
                    {formatPokemonName(node.pokemon)}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover tooltip */}
            {hoveredNode && (
              <div
                className="absolute bg-white p-2 rounded-lg shadow-lg border"
                style={{
                  left: '50%',
                  bottom: '10px',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="font-medium">
                  {formatPokemonName(hoveredNode.pokemon)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Usage Rate: {hoveredNode.usage?.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}