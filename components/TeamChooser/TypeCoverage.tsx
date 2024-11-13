// components/TeamAnalysis/TypeCoverage.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamMember } from '@/types/setup';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';

interface TypeCoverageProps {
  team1: TeamMember[];
  team2: TeamMember[];
}

const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

// Type effectiveness data
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { ghost: 0, rock: 0.5, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  // ... Add all type effectiveness data here
};

export function TypeCoverage({ team1, team2 }: TypeCoverageProps) {
  const calculateDefensiveEffectiveness = (pokemon: TeamMember): Record<string, number> => {
    if (!pokemon.types) return {};
    
    const effectiveness: Record<string, number> = {};
    TYPES.forEach(attackingType => {
      let multiplier = 1;
      if (pokemon.types) {
        pokemon.types.forEach(defType => {
            multiplier *= TYPE_CHART[attackingType]?.[defType.toLowerCase()] || 1;
        });
      }
      effectiveness[attackingType] = multiplier;
    });

    return effectiveness;
  };

  const calculateTeamDefensiveEffectiveness = (team: TeamMember[]) => {
    const validPokemon = team.filter(p => p.name && p.types);
    const teamEffectiveness: Record<string, number[]> = {};
    
    TYPES.forEach(type => {
      teamEffectiveness[type] = validPokemon.map(p => 
        calculateDefensiveEffectiveness(p)[type]
      ).filter(Boolean);
    });

    return teamEffectiveness;
  };

  const getEffectivenessColor = (value: number) => {
    if (value === 0) return 'bg-gray-200';
    if (value <= 0.25) return 'bg-green-800 text-white';
    if (value <= 0.5) return 'bg-green-500 text-white';
    if (value === 1) return 'bg-gray-100';
    if (value <= 2) return 'bg-red-500 text-white';
    return 'bg-red-800 text-white';
  };

  const renderEffectivenessCell = (values: number[]) => {
    if (!values.length) return null;
    const count = values.length;
    const total = values.reduce((sum, v) => sum + v, 0);
    const average = total / count;

    return (
      <TableCell 
        className={cn(
          "text-center",
          getEffectivenessColor(average)
        )}
      >
        {average.toFixed(2)}x
      </TableCell>
    );
  };

  const team1Defense = calculateTeamDefensiveEffectiveness(team1);
  const team2Defense = calculateTeamDefensiveEffectiveness(team2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type Coverage Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Team 1 Defense</TableHead>
              <TableHead className="text-center">Team 2 Defense</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TYPES.map(type => (
              <TableRow key={type}>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs capitalize",
                      typeColors[type]?.bg,
                      typeColors[type]?.text
                    )}
                  >
                    {type}
                  </Badge>
                </TableCell>
                {renderEffectivenessCell(team1Defense[type])}
                {renderEffectivenessCell(team2Defense[type])}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}