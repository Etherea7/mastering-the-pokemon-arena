import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Teammate {
  name: string;
  usage: number;
  sprite?: string;
  types?: string[];
}

interface Node {
  x: number;
  y: number;
  pokemon: string;
  usage?: number;
  sprite?: string;
  types?: string[];
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
  const [centerSprite, setCenterSprite] = useState<string | null>(null);
  const [centerTypes, setCenterTypes] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPokemonData(name: string) {
      try {
        const formattedName = name.toLowerCase().replace(/\s+/g, '-');
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${formattedName}`);
        const data = await response.json();
        return {
          sprite: data.sprites.front_default,
          types: data.types.map((t: any) => t.type.name)
        };
      } catch (error) {
        console.error(`Failed to fetch data for ${name}:`, error);
        return null;
      }
    }

    async function fetchTeammates() {
      if (!pokemonName) return;
      
      setLoading(true);
      try {
        // Fetch center Pokemon data
        const centerData = await fetchPokemonData(pokemonName);
        if (centerData) {
          setCenterSprite(centerData.sprite);
          setCenterTypes(centerData.types);
        }

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

        // Fetch data for all teammates
        const teammatesPromises = (data.teammates || [])
          .slice(0, 5)
          .map(async (teammate: any) => {
            const name = teammate.name || teammate.teammate;
            const pokemonData = await fetchPokemonData(name);
            return {
              name: formatPokemonName(name),
              usage: parseFloat(teammate.usage) || 0,
              sprite: pokemonData?.sprite,
              types: pokemonData?.types
            };
          });

        const teammatesData = await Promise.all(teammatesPromises);
        const filteredTeammates = teammatesData
          .filter((teammate: Teammate) => teammate.usage > 0)
          .sort((a: Teammate, b: Teammate) => b.usage - a.usage);

        setTeammates(filteredTeammates);
      } catch (error) {
        console.error('Failed to fetch teammates:', error);
        setError('Failed to fetch teammate data');
        setTeammates([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTeammates();
  }, [pokemonName, generation, format]);

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
      sprite: centerSprite || undefined,
      types: centerTypes
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
        sprite: teammate.sprite,
        types: teammate.types
      });
    });

    return nodePositions;
  };

  const nodes = calculateNodePositions();

  const renderNodeLabel = (name: string, x: number, y: number) => (
    <>
      {/* Text shadow for visibility in both themes */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fill="black"
        fontSize={12}
        className="pointer-events-none"
        style={{ 
          paintOrder: 'stroke',
          stroke: 'white',
          strokeWidth: '3px',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }}
      >
        {formatPokemonName(name)}
      </text>
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fill="currentColor"
        fontSize={12}
        className="pointer-events-none"
      >
        {formatPokemonName(name)}
      </text>
    </>
  );

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
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeOpacity={0.2}
                />
              ))}

              {/* Center node */}
              <g>
                <circle
                  cx={0}
                  cy={0}
                  r={40}
                  className="fill-primary"
                  opacity={0.8}
                  stroke="currentColor"
                  strokeWidth={2}
                />
                {nodes[0].sprite && (
                  <image
                    href={nodes[0].sprite}
                    x={-25}
                    y={-25}
                    width={50}
                    height={50}
                    className=""
                  />
                )}
                {renderNodeLabel(pokemonName, 0, 45)}
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
                    className="fill-muted hover:fill-muted/80"
                    opacity={hoveredNode === node ? 0.9 : 0.7}
                    stroke="currentColor"
                    strokeWidth={2}
                  />
                  {node.sprite && (
                    <image
                      href={node.sprite}
                      x={node.x - 25}
                      y={node.y - 25}
                      width={50}
                      height={50}
                    
                    />
                  )}
                  {renderNodeLabel(node.pokemon, node.x, node.y + 45)}
                </g>
              ))}
            </svg>

            {/* Hover tooltip */}
            {hoveredNode && (
              <div className="absolute bg-popover p-2 rounded-lg shadow-lg border left-1/2 bottom-4 -translate-x-1/2">
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