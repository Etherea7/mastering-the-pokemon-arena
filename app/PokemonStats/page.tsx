'use client'

import React, { useState } from 'react';
import PokemonSelector from '@/components/PokemonStatsDisplay/PokemonSelector';
import PokemonRadarChart from '@/components/PokemonStatsDisplay/PokemonRadarChart';
import { Alert, AlertDescription } from "@/components/ui/alert";
import PokemonAbilitiesChart from '@/components/PokemonStatsDisplay/PokemonAbilitiesChart';
import NetworkGraph from '@/components/PokemonStatsDisplay/NetworkGraph';
import CounterMatrix from '@/components/PokemonStatsDisplay/CounterMatrix';

export default function PokemonStats() {
  const [selectedPokemon, setSelectedPokemon] = useState('');
  const [selectedGen, setSelectedGen] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');

  const shouldShowAbilities = (gen: string) => {
    const noAbilityGens = ['gen1', 'gen2'];
    return !noAbilityGens.includes(gen);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Pokemon Stats</h1>
      
      <PokemonSelector
        selectedPokemon={selectedPokemon}
        selectedGen={selectedGen}
        selectedFormat={selectedFormat}
        onPokemonSelect={setSelectedPokemon}
        onGenSelect={setSelectedGen}
        onFormatSelect={setSelectedFormat}
      />

      <div>
        {(!selectedGen || !selectedFormat || !selectedPokemon) ? (
          <Alert>
            <AlertDescription>
              Please select a Pokemon, generation and format to view stats
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {/* Centered Radar Chart */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <PokemonRadarChart pokemonName={selectedPokemon} />
              </div>
            </div>

            {/* Top Stats Row - Abilities and Network */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shouldShowAbilities(selectedGen) && (
                <PokemonAbilitiesChart
                  pokemonName={selectedPokemon}
                  generation={selectedGen}
                  format={selectedFormat}
                />
              )}
              <NetworkGraph 
                pokemonName={selectedPokemon}
                generation={selectedGen}
                format={selectedFormat}
              />
            </div>

            {/* Full Width Matchups Section */}
            {selectedPokemon && selectedGen && selectedFormat && (
              <div className="w-full">
                <CounterMatrix
                  pokemonName={selectedPokemon}
                  generation={selectedGen}
                  battleFormat={selectedFormat}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}