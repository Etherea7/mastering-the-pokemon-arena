'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TYPE_CHART, calculateTypeEffectiveness, PokemonType } from './utils/typeEffectiveness';

const TYPES = Object.keys(TYPE_CHART);

interface TypeCoverageGridProps {
  team1: string[];
  team2: string[];
}

const TypeCoverageGrid = ({ team1, team2 }: TypeCoverageGridProps) => {
  const [loading, setLoading] = useState(true);
  const [typeData, setTypeData] = useState<{ [key: string]: PokemonType[] }>({});

  // Function to fetch type data for a single Pokemon
  const fetchPokemonType = async (name: string) => {
    if (!name) return null;
    try {
      const response = await fetch(`/api/pokemon/${name}`);
      console.log(response);
      const data = await response.json();
      return {
        name,
        types: data.base?.types || []
      };
    } catch (error) {
      console.error(`Error fetching type data for ${name}:`, error);
      return null;
    }
  };

  // Fetch type data for all Pokemon
  useEffect(() => {
    const fetchAllTypeData = async () => {
      setLoading(true);
      const allPokemon = [...team1, ...team2].filter(Boolean);
      const typePromises = allPokemon.map(pokemon => fetchPokemonType(pokemon));
      
      try {
        const allTypeData = await Promise.all(typePromises);
        const typeMap: { [key: string]: PokemonType[] } = {};
        
        allTypeData.forEach(data => {
          if (data && data.types) {
            typeMap[data.name] = data.types;
          }
        });
        
        setTypeData(typeMap);
      } catch (error) {
        console.error('Error fetching type data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTypeData();
  }, [team1, team2]);

  const getEffectivenessColor = (value: number) => {
    switch (value) {
      case 0: return 'bg-red-500 text-white';
      case 0.5: return 'bg-orange-200';
      case 2: return 'bg-green-200';
      case 4: return 'bg-emerald-400';
      default: return 'bg-white';
    }
  };

  const getEffectivenessLabel = (value: number) => {
    switch (value) {
      case 0: return '0×';
      case 0.5: return '½×';
      case 2: return '2×';
      case 4: return '4×';
      default: return '1×';
    }
  };

  const calculateEffectiveness = (attackingType: string, pokemonName: string) => {
    const defendingTypes = typeData[pokemonName];
    if (!defendingTypes) return 1;
    
    return calculateTypeEffectiveness(
      attackingType.toLowerCase(),
      defendingTypes
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading type coverage...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="min-w-[800px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border">Type</th>
                  {[...team1, ...team2].filter(Boolean).map((pokemon, index) => (
                    <th key={index} className="p-2 border text-center">
                      {pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}
                      {typeData[pokemon] && (
                        <div className="text-xs text-gray-500">
                          {typeData[pokemon].map(t => t.name).join('/')}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TYPES.map(type => (
                  <tr key={type}>
                    <td 
                      className="p-2 border font-medium capitalize"
                      style={{
                        backgroundColor: `${TYPE_CHART[type].color || '#ffffff'}20`
                      }}
                    >
                      {type}
                    </td>
                    {[...team1, ...team2].filter(Boolean).map((pokemon, index) => {
                      const effectiveness = calculateEffectiveness(type, pokemon);
                      return (
                        <td 
                          key={`${type}-${index}`} 
                          className={`border text-center ${getEffectivenessColor(effectiveness)}`}
                        >
                          <div className="p-2">
                            {getEffectivenessLabel(effectiveness)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>

        {/* Legend */}
        <div className="mt-4 flex gap-4 justify-end">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500"></div>
            <span className="text-sm">No effect (0×)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-200"></div>
            <span className="text-sm">Not very effective (½×)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border"></div>
            <span className="text-sm">Normal (1×)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200"></div>
            <span className="text-sm">Super effective (2×)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-400"></div>
            <span className="text-sm">Double super effective (4×)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TypeCoverageGrid;