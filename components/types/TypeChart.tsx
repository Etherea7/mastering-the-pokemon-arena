// components/TypeChart.tsx
'use client'
import { useState } from 'react';
import { TypeData, useTypeData } from '@/hooks/useTypeData';

const TYPE_COLORS = {
  normal: '#A8A878',
  fighting: '#C03028',
  flying: '#A890F0',
  poison: '#A040A0',
  ground: '#E0C068',
  rock: '#B8A038',
  bug: '#A8B820',
  ghost: '#705898',
  steel: '#B8B8D0',
  fire: '#F08030',
  water: '#6890F0',
  grass: '#78C850',
  electric: '#F8D030',
  psychic: '#F85888',
  ice: '#98D8D8',
  dragon: '#7038F8',
  dark: '#705848',
  fairy: '#EE99AC'
} as const;

const getEffectiveness = (attacker: TypeData, defender: TypeData) => {
  if (attacker.damage_relations.double_damage_to.some(t => t.name === defender.name)) return 2;
  if (attacker.damage_relations.half_damage_to.some(t => t.name === defender.name)) return 0.5;
  if (attacker.damage_relations.no_damage_to.some(t => t.name === defender.name)) return 0;
  return 1;
};

export default function TypeChart() {
  const { typeData, loading, error } = useTypeData();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Type Selection */}
      <div className="flex gap-2 flex-wrap">
        {typeData.map(type => (
          <button
            key={type.name}
            onClick={() => {
              if (selectedTypes.includes(type.name)) {
                setSelectedTypes(prev => prev.filter(t => t !== type.name));
              } else if (selectedTypes.length < 2) {
                setSelectedTypes(prev => [...prev, type.name]);
              }
            }}
            className="px-3 py-1 rounded"
            style={{
              backgroundColor: TYPE_COLORS[type.name as keyof typeof TYPE_COLORS],
              color: ['normal', 'flying', 'ground', 'steel', 'fairy'].includes(type.name) ? '#000' : '#fff',
              opacity: selectedTypes.includes(type.name) ? 1 : 0.6
            }}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* Type Chart */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 border">Def →<br/>Atk ↓</th>
              {typeData.map(type => (
                <th 
                  key={type.name}
                  className="p-2 border"
                  style={{
                    backgroundColor: TYPE_COLORS[type.name as keyof typeof TYPE_COLORS],
                    color: ['normal', 'flying', 'ground', 'steel', 'fairy'].includes(type.name) ? '#000' : '#fff'
                  }}
                >
                  {type.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {typeData.map(attackerType => (
              <tr key={attackerType.name}>
                <th 
                  className="p-2 border"
                  style={{
                    backgroundColor: TYPE_COLORS[attackerType.name as keyof typeof TYPE_COLORS],
                    color: ['normal', 'flying', 'ground', 'steel', 'fairy'].includes(attackerType.name) ? '#000' : '#fff'
                  }}
                >
                  {attackerType.name}
                </th>
                {typeData.map(defenderType => {
                  const effectiveness = getEffectiveness(attackerType, defenderType);
                  return (
                    <td 
                      key={defenderType.name}
                      className="p-2 border text-center"
                      style={{
                        backgroundColor: 
                          effectiveness === 2 ? '#6c6' :
                          effectiveness === 0.5 ? '#f66' :
                          effectiveness === 0 ? '#666' :
                          '#fff'
                      }}
                    >
                      {effectiveness === 0 ? '0' : effectiveness}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Types Analysis */}
      {selectedTypes.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-bold">Type Analysis</h3>
          {/* We'll implement this next! */}
        </div>
      )}
    </div>
  );
}