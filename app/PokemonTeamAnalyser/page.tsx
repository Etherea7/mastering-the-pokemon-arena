'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Legend, 
  Tooltip 
} from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'

interface RadarDataPoint {
  stat: string;
  [key: string]: string | number;
}

interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

interface Pokemon {
  id: number;
  name: string;
  stats: PokemonStats;
  types: string[];
  sprite?: string;
}

const allTypes = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 
  'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
]

export default function PokemonTeamAnalyser() {
  const [team1, setTeam1] = useState<Pokemon[]>([]);
  const [team2, setTeam2] = useState<Pokemon[]>([]);
  const [selectedPokemon1, setSelectedPokemon1] = useState<number | null>(null);
  const [selectedPokemon2, setSelectedPokemon2] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pokemonData, setPokemonData] = useState<Pokemon[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const team1Param = params.get('team1');
      const team2Param = params.get('team2');

      const team1List = team1Param ? team1Param.split(',') : [];
      const team2List = team2Param ? team2Param.split(',') : [];

      const fetchPokemonData = async () => {
        try {
          const allPokemon = [...team1List, ...team2List];
          const fetchedData = await Promise.all(
            allPokemon.map(async (pokemonName) => {
              try {
                const response = await fetch(`/api/pokeapi/sprites/${encodeURIComponent(pokemonName)}`);
                
                if (!response.ok) {
                  console.error(`Failed to fetch data for ${pokemonName}`);
                  return null;
                }

                const data = await response.json();
                console.log('Pokemon data:', data); // Add this to debug

                return {
                  id: Date.now() + Math.random(), // Generate unique ID
                  name: data.name,
                  stats: data.stats,
                  types: data.types,
                  sprite: data.sprite
                };
              } catch (error) {
                console.error(`Error fetching data for ${pokemonName}:`, error);
                return null;
              }
            })
          );

          const validData = fetchedData.filter(Boolean) as Pokemon[];
          setPokemonData(validData);
          setTeam1(validData.slice(0, team1List.length));
          setTeam2(validData.slice(team1List.length));
          setLoading(false);
        } catch (error) {
          console.error('Error fetching Pokémon data:', error);
          setLoading(false);
        }
      };

      if (team1List.length > 0 || team2List.length > 0) {
        fetchPokemonData();
      } else {
        setLoading(false);
      }
    }
  }, []);

  const getRadarData = (pokemonId: number | null) => {
    const pokemon = pokemonData.find(p => p.id === pokemonId);
    if (!pokemon) return [];
    
    // Transform stats into radar chart format with proper naming
    return Object.entries(pokemon.stats).map(([key, value]) => ({
      stat: key.replace(/_/g, ' '), // Replace underscores with spaces
      [pokemon.name]: value,
    }));
  };

  const radarData = [
    ...getRadarData(selectedPokemon1),
    ...getRadarData(selectedPokemon2),
  ].reduce<RadarDataPoint[]>((acc, curr) => {
    const existingItem = acc.find(item => item.stat === curr.stat);
    if (existingItem) {
      return acc.map(item => 
        item.stat === curr.stat ? { ...item, ...curr } : item
      );
    }
    return [...acc, curr];
  }, []);

  const getCellColor = (effectiveness: number) => {
    if (effectiveness === 0) return 'bg-red-500';
    if (effectiveness === 0.5) return 'bg-orange-300';
    if (effectiveness === 1) return 'bg-gray-100';
    if (effectiveness === 2) return 'bg-green-300';
    return 'bg-gray-100';
  };

  if (loading) {
    return <div>Loading Pokémon data...</div>;
  }

  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Pokemon Team Analyzer</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Team 1</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup onValueChange={(value) => setSelectedPokemon1(Number(value))}>
                {team1.map(pokemon => (
                  <div key={pokemon.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={pokemon.id.toString()} id={`team1-${pokemon.id}`} />
                    <Label htmlFor={`team1-${pokemon.id}`} className="capitalize flex items-center">
                    {pokemon.sprite && (
                          <Image 
                            src={pokemon.sprite} 
                            alt={pokemon.name} 
                            width={32}
                            height={32}
                            className="mr-2"
                          />
                        )}
                      {pokemon.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle>Comparative Radar Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis 
                dataKey="stat" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              />
              <PolarRadiusAxis angle={90} domain={[0, 255]} />
              {selectedPokemon1 && (
                <Radar
                  name={pokemonData.find(p => p.id === selectedPokemon1)?.name}
                  dataKey={pokemonData.find(p => p.id === selectedPokemon1)?.name || ''}
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              )}
              {selectedPokemon2 && (
                <Radar
                  name={pokemonData.find(p => p.id === selectedPokemon2)?.name}
                  dataKey={pokemonData.find(p => p.id === selectedPokemon2)?.name || ''}
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              )}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Team 2</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup onValueChange={(value) => setSelectedPokemon2(Number(value))}>
                {team2.map(pokemon => (
                  <div key={pokemon.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={pokemon.id.toString()} id={`team2-${pokemon.id}`} />
                    <Label htmlFor={`team2-${pokemon.id}`} className="capitalize flex items-center">
                    {pokemon.sprite && (
                          <Image 
                            src={pokemon.sprite} 
                            alt={pokemon.name} 
                            width={24}
                            height={24}
                            className="mx-auto mb-1"
                          />
                        )}
                      {pokemon.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Type Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row">
              <div className="overflow-x-auto flex-grow">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">Type</TableHead>
                      {[...team1, ...team2].map(pokemon => (
                        <TableHead key={pokemon.id} className="px-2 py-1 text-xs capitalize">
                          {pokemon.sprite && (
                              <Image 
                                src={pokemon.sprite} 
                                alt={pokemon.name} 
                                width={24}
                                height={24}
                                className="mx-auto mb-1"
                              />
                            )}
                          {pokemon.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTypes.map(type => (
                      <TableRow key={type}>
                        <TableCell className="sticky left-0 bg-background font-medium capitalize">
                          {type}
                        </TableCell>
                        {[...team1, ...team2].map(pokemon => (
                          <TableCell 
                            key={`${type}-${pokemon.id}`} 
                            className={`${getCellColor(1)} w-8 h-8 p-0`}
                          />
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:w-48 mt-4 md:mt-0 md:ml-4">
                <h3 className="font-semibold mb-2">Effectiveness Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-red-500 mr-2"></div>
                    <span className="text-sm">No effect (0x)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-orange-300 mr-2"></div>
                    <span className="text-sm">Not very effective (0.5x)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-100 mr-2"></div>
                    <span className="text-sm">Normal (1x)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-300 mr-2"></div>
                    <span className="text-sm">Super effective (2x)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}


