import React from 'react';
import TypeCoverageGrid from '@/components/TypeCoverageGrid/index';

export default function PokemonTeamTypeAnalysis() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Pokemon Team Type Analysis</h1>
      
      <TypeCoverageGrid 
        team1={['charizard', 'blastoise', 'venusaur']}
        team2={['pikachu', 'gengar', 'dragonite']}
      />
    </div>
  );
}