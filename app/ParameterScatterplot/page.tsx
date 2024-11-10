'use client'

import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const scatterPlotParameters = [
  { label: 'Speed vs Attack', x: 'speed', y: 'attack' },
  { label: 'HP vs Defence', x: 'hp', y: 'defense' }
];

const colors = {
  'ou': "#8884d8",
  'uu': "#82ca9d",
  'ru': "#ffc658",
  'nu': "#ff7300",
  'pu': "#ff5252"
};

export default function PokemonStatsVisualizer() {
  const [pokemonData, setPokemonData] = useState<any>({});
  const [selectedTier, setSelectedTier] = useState('All Tiers');
  const [selectedParameter, setSelectedParameter] = useState(scatterPlotParameters[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First get all Pokemon names from your existing API
        const response = await fetch('/api/pokemon');
        const pokemonList = await response.json();
        
        if (!Array.isArray(pokemonList)) {
          throw new Error('Unexpected data format from API');
        }

        // Fetch base stats for each Pokemon using their names
        const baseStatsPromises = pokemonList.map(async (pokemonName) => {
          try {
            const response = await fetch(`/api/pokemon/${pokemonName}`);
            const data = await response.json();
            return data.base;  // Get base data including battle_format and raw_count
          } catch (error) {
            console.error(`Error fetching ${pokemonName}:`, error);
            return null;
          }
        });

        const pokemonBaseData = (await Promise.all(baseStatsPromises)).filter(Boolean);

        // Fetch detailed stats from PokeAPI for each Pokemon
        const pokemonWithStats = await Promise.all(
          pokemonBaseData.map(async (pokemon) => {
            if (!pokemon || !pokemon.name) return null;

            try {
              const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.name.toLowerCase()}`);
              if (!response.ok) return null;
              
              const pokeData = await response.json();
              const stats = pokeData.stats.reduce((acc: any, stat: any) => {
                acc[stat.stat.name] = stat.base_stat;
                return acc;
              }, {});

              return {
                name: pokemon.name,
                tier: pokemon.battle_format?.toLowerCase() || 'unknown',
                hp: stats.hp,
                attack: stats.attack,
                defense: stats.defense,
                speed: stats.speed,
                usage: pokemon.raw_count || 0
              };
            } catch (error) {
              console.error(`Error fetching stats for ${pokemon.name}:`, error);
              return null;
            }
          })
        );

        // Filter out nulls and group by tier
        const validPokemon = pokemonWithStats.filter(Boolean);
        
        const groupedData = validPokemon.reduce((acc: any, pokemon) => {
          if (!pokemon) return acc;
          
          const tier = pokemon.tier;
          if (!acc[tier]) {
            acc[tier] = [];
          }
          acc[tier].push(pokemon);
          return acc;
        }, {});

        // Add "All Tiers" category
        groupedData['All Tiers'] = validPokemon;

        console.log('Grouped data:', groupedData);
        setPokemonData(groupedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Pokemon data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTierChange = (value: string) => {
    setSelectedTier(value);
  };

  const handleParameterChange = (value: string) => {
    setSelectedParameter(scatterPlotParameters.find(param => param.label === value) || scatterPlotParameters[0]);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen pb-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pokemon Stats Visualizer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey={selectedParameter.x} 
                  name={selectedParameter.x.toUpperCase()} 
                  label={{ value: selectedParameter.x.toUpperCase(), position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey={selectedParameter.y} 
                  name={selectedParameter.y.toUpperCase()} 
                  label={{ value: selectedParameter.y.toUpperCase(), angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pokemon = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-bold">{pokemon.name.toUpperCase()}</p>
                          <p>{`${selectedParameter.x}: ${pokemon[selectedParameter.x]}`}</p>
                          <p>{`${selectedParameter.y}: ${pokemon[selectedParameter.y]}`}</p>
                          <p>{`Usage: ${pokemon.usage}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {selectedTier === 'All Tiers' ? (
                  Object.entries(pokemonData)
                    .filter(([tier]) => tier !== 'All Tiers')
                    .map(([tier, data]) => (
                      <Scatter 
                        key={tier} 
                        name={tier.toUpperCase()} 
                        data={data} 
                        fill={colors[tier as keyof typeof colors]} 
                      />
                    ))
                ) : (
                  <Scatter 
                    name={selectedTier} 
                    data={pokemonData[selectedTier]} 
                    fill={colors[selectedTier.toLowerCase() as keyof typeof colors] || "#8884d8"} 
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {selectedTier === 'All Tiers' && (
            <div className="flex justify-center items-center mt-4 space-x-4">
              {Object.entries(colors).map(([tier, color]) => (
                <div key={tier} className="flex items-center">
                  <div className="w-4 h-4 mr-2" style={{ backgroundColor: color }}></div>
                  <span>{tier.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Display Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tier-select" className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <Select onValueChange={handleTierChange} defaultValue={selectedTier}>
                <SelectTrigger id="tier-select">
                  <SelectValue placeholder="Select a tier" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(pokemonData).map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier === 'All Tiers' ? tier : tier.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="parameter-select" className="block text-sm font-medium text-gray-700 mb-1">Scatterplot Parameters</label>
              <Select onValueChange={handleParameterChange} defaultValue={selectedParameter.label}>
                <SelectTrigger id="parameter-select">
                  <SelectValue placeholder="Select parameters" />
                </SelectTrigger>
                <SelectContent>
                  {scatterPlotParameters.map((param) => (
                    <SelectItem key={param.label} value={param.label}>
                      {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}