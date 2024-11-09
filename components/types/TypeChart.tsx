// components/TypeChart.tsx
'use client'
import { useState } from 'react';
import { TypeData, useTypeData } from '@/hooks/useTypeData';
import  TypeButton  from '@/components/types/TypeButton';

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

const calculateCombinedEffectiveness = (
    attackerType: TypeData,
    defenderTypes: TypeData[]
  ) => {
    if (defenderTypes.length === 1) {
      return getEffectiveness(attackerType, defenderTypes[0]);
    }
  
    // Multiply the effectiveness against each defending type
    return defenderTypes.reduce((total, defenderType) => {
      const effectiveness = getEffectiveness(attackerType, defenderType);
      return total * effectiveness;
    }, 1);
  };

export default function TypeChart() {
    const { typeData, loading, error } = useTypeData();
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [highlightedAttacker, setHighlightedAttacker] = useState<string | null>(null);
    const [highlightedDefender, setHighlightedDefender] = useState<string | null>(null);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const getTypeAnalysis = () => {
        if (!selectedTypes.length) return [];
    
        const selectedTypeData = selectedTypes.map(
          typeName => typeData.find(t => t.name === typeName)!
        );
    
        return typeData.map(attackerType => ({
          attackerType: attackerType.name,
          effectiveness: calculateCombinedEffectiveness(attackerType, selectedTypeData)
        }));
      };

    const handleTypeClick = (typeName: string) => {
        if (selectedTypes.includes(typeName)) {
        setSelectedTypes(prev => prev.filter(t => t !== typeName));
        } else if (selectedTypes.length < 2) {
        setSelectedTypes(prev => [...prev, typeName]);
        }
    };

  return (
    <div className="flex flex-col gap-4">
      

        {/* Type Selection */}
        <div className="flex gap-2 flex-wrap">
        {typeData.map(type => (
          <TypeButton
            key={type.name}
            type={type.name}
            isSelected={selectedTypes.includes(type.name)}
            onClick={() => handleTypeClick(type.name)}
          />
        ))}
      </div>
      {/* Enhanced Type Analysis */}
      {/* {selectedTypes.length > 0 && ( */}
        <div className="mt-4 space-y-4">
          <h3 className="text-lg font-bold">Type Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full mt-2">
              <thead>
                <tr>
                  <th className="p-2 border">Selected Types</th>
                  <th 
                    colSpan={selectedTypes.length} 
                    className="p-2 border"
                  >
                    <div className="flex gap-2 justify-center">
                      {selectedTypes.map(type => (
                        <span
                          key={type}
                          className="px-3 py-1 rounded motion-preset-pop"
                          style={{
                            backgroundColor: TYPE_COLORS[type as keyof typeof TYPE_COLORS],
                            color: ['normal', 'flying', 'ground', 'steel', 'fairy'].includes(type) ? '#000' : '#fff'
                          }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Group resistances by effectiveness */}
                {[4, 2, 1, 0.5, 0.25, 0].map(effectiveness => {
                  const types = getTypeAnalysis()
                    .filter(analysis => analysis.effectiveness === effectiveness)
                    .map(analysis => analysis.attackerType);
                  
                  if (types.length === 0) return null;

                  return (
                    <tr key={effectiveness}>
                      <th className="p-2 border text-right whitespace-nowrap">
                        {effectiveness === 4 && '4× damage from'}
                        {effectiveness === 2 && '2× damage from'}
                        {effectiveness === 1 && '1× damage from'}
                        {effectiveness === 0.5 && '½× damage from'}
                        {effectiveness === 0.25 && '¼× damage from'}
                        {effectiveness === 0 && 'Immune to'}
                      </th>
                      <td className="p-2 border">
                        <div className="flex flex-wrap gap-1">
                          {types.map(type => (
                            <span
                              key={type}
                              className="px-2 py-1 rounded text-sm"
                              style={{
                                backgroundColor: TYPE_COLORS[type as keyof typeof TYPE_COLORS],
                                color: ['normal', 'flying', 'ground', 'steel', 'fairy'].includes(type) ? '#000' : '#fff'
                              }}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      {/* )} */}

      {/* Type Chart */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 border">Def →<br/>Atk ↓</th>
              {typeData.map(type => (
                <th 
                  key={type.name}
                  className="p-2 border cursor-pointer transition-opacity duration-200"
                  style={{
                    backgroundColor: TYPE_COLORS[type.name as keyof typeof TYPE_COLORS],
                    color: ['normal', 'flying', 'ground', 'steel', 'fairy'].includes(type.name) ? '#000' : '#fff',
                    opacity: highlightedDefender && highlightedDefender !== type.name ? 0.3 : 1
                  }}
                  onClick={() => setHighlightedDefender(
                    highlightedDefender === type.name ? null : type.name
                  )}
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
                  className="p-2 border cursor-pointer transition-opacity duration-200"
                  style={{
                    backgroundColor: TYPE_COLORS[attackerType.name as keyof typeof TYPE_COLORS],
                    color: ['normal', 'flying', 'ground', 'steel', 'fairy'].includes(attackerType.name) ? '#000' : '#fff',
                    opacity: highlightedAttacker && highlightedAttacker !== attackerType.name ? 0.3 : 1
                  }}
                  onClick={() => setHighlightedAttacker(
                    highlightedAttacker === attackerType.name ? null : attackerType.name
                  )}
                >
                  {attackerType.name}
                </th>
                {typeData.map(defenderType => {
                  const effectiveness = getEffectiveness(attackerType, defenderType);
                  const isHighlighted = 
                    (!highlightedAttacker || highlightedAttacker === attackerType.name) &&
                    (!highlightedDefender || highlightedDefender === defenderType.name);
                  
                  return (
                    <td 
                      key={defenderType.name}
                      className="p-2 border text-center transition-opacity duration-200"
                      style={{
                        backgroundColor: 
                          effectiveness === 2 ? '#6c6' :
                          effectiveness === 0.5 ? '#f66' :
                          effectiveness === 0 ? '#666' :
                          '#fff',
                        opacity: isHighlighted ? 1 : 0.3
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


       
    </div>
  );
}




  