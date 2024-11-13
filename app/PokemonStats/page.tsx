// app/PokemonStats/page.tsx
'use client'

import React, { useState } from 'react';
import PokemonSelector from '@/components/PokemonStatsDisplay/PokemonSelector';
import PokemonRadarChart from '@/components/PokemonStatsDisplay/PokemonRadarChart';
import { Alert, AlertDescription } from "@/components/ui/alert";
import PokemonAbilitiesChart from '@/components/PokemonStatsDisplay/PokemonAbilitiesChart';
import MovesViewer from '@/components/PokemonStatsDisplay/MovesViewer';
import NetworkGraph from '@/components/PokemonStatsDisplay/NetworkGraph';
import CounterMatrix from '@/components/PokemonStatsDisplay/CounterMatrix';

// app/PokemonStats/page.tsx
export default function PokemonStats() {
    const [selectedPokemon, setSelectedPokemon] = useState('');
    const [selectedGen, setSelectedGen] = useState('');
    const [selectedFormat, setSelectedFormat] = useState('');
  
    // Helper function to check if generation should show abilities
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PokemonRadarChart pokemonName={selectedPokemon} />
                {shouldShowAbilities(selectedGen) && (
                <PokemonAbilitiesChart
                    pokemonName={selectedPokemon}
                    generation={selectedGen}
                    format={selectedFormat}
                />
                )}
                {/* <MovesViewer 
                    pokemonName={selectedPokemon}
                    generation={selectedGen}
                    format={selectedFormat}
                /> */}
                <NetworkGraph 
                pokemonName={selectedPokemon}
                generation={selectedGen}
                format={selectedFormat}
                />
                {/* Only render CounterMatrix when we have all required values */}
                {selectedPokemon && selectedGen && selectedFormat && (
                <CounterMatrix
                    pokemonName={selectedPokemon}
                    generation={selectedGen}
                    battleFormat={selectedFormat}
                />
                )}
            </div>
            )}
        </div>
      </div>
    );
  }