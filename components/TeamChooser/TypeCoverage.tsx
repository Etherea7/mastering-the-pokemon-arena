import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamMember } from '@/types/setup';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import { useTypeData } from '@/hooks/useTypeData';
import { Loader2 } from "lucide-react";

interface TypeCoverageProps {
  team1: TeamMember[];
  team2: TeamMember[];
}

const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

export function TypeCoverage({ team1, team2 }: TypeCoverageProps) {
  const { typeData, loading, error } = useTypeData();

  // Type effectiveness calculation logic remains the same...
  const calculateTypeEffectiveness = (
    attackingType: string,
    defendingTypes: string[]
  ): number => {
    const typeInfo = typeData.find(t => t.name === attackingType.toLowerCase());
    if (!typeInfo) return 1;

    let multiplier = 1;
    defendingTypes.forEach(defType => {
      if (typeInfo.damage_relations.double_damage_to.some(t => t.name === defType.toLowerCase())) {
        multiplier *= 2;
      } else if (typeInfo.damage_relations.half_damage_to.some(t => t.name === defType.toLowerCase())) {
        multiplier *= 0.5;
      } else if (typeInfo.damage_relations.no_damage_to.some(t => t.name === defType.toLowerCase())) {
        multiplier *= 0;
      }
    });

    return multiplier;
  };

  const calculateTeamEffectiveness = (team: TeamMember[], isOffensive: boolean) => {
    const validPokemon = team.filter(p => p.name && p.types);
    const effectiveness: Record<string, number[]> = {};
    
    TYPES.forEach(type => {
      if (isOffensive) {
        effectiveness[type] = validPokemon.flatMap(p => 
          p.types?.map(pokeType => calculateTypeEffectiveness(pokeType, [type])) || []
        );
      } else {
        effectiveness[type] = validPokemon.map(p => 
          calculateTypeEffectiveness(type, p.types || [])
        );
      }
    });

    return effectiveness;
  };

  const getEffectivenessColor = (value: number, isOffensive: boolean) => {
    if (value === 0) return 'bg-gray-200';
    
    const intensity = Math.abs(1 - value); // How far from neutral (1.0)
    let colorClass = 'bg-gray-100'; // Neutral case

    if (isOffensive) {
      // Offensive: > 1 is good (green), < 1 is bad (red)
      if (value > 1) {
        if (intensity >= 1) return 'bg-green-300';
        if (intensity >= 0.5) return 'bg-green-200';
        return 'bg-green-100';
      } else if (value < 1) {
        if (intensity >= 1) return 'bg-red-300';
        if (intensity >= 0.5) return 'bg-red-200';
        return 'bg-red-100';
      }
    } else {
      // Defensive: < 1 is good (green), > 1 is bad (red)
      if (value < 1) {
        if (intensity >= 1) return 'bg-green-300';
        if (intensity >= 0.5) return 'bg-green-200';
        return 'bg-green-100';
      } else if (value > 1) {
        if (intensity >= 1) return 'bg-red-300';
        if (intensity >= 0.5) return 'bg-red-200';
        return 'bg-red-100';
      }
    }

    return colorClass;
  };

  const renderEffectivenessCell = (values: number[], isOffensive: boolean) => {
    if (!values.length) return null;

    const best = Math.max(...values);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;

    return (
      <TableCell className="p-0">
   
          <div
            className={cn(
              "p-2 text-center border-r",
              getEffectivenessColor(average, isOffensive)
            )}
            title="Average effectiveness"
          >
            {average.toFixed(2)}x
          </div>
         
      </TableCell>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center text-destructive p-4">
          Failed to load type data
        </CardContent>
      </Card>
    );
  }

  const team1Defense = calculateTeamEffectiveness(team1, false);
  const team2Defense = calculateTeamEffectiveness(team2, false);
  const team1Offense = calculateTeamEffectiveness(team1, true);
  const team2Offense = calculateTeamEffectiveness(team2, true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type Coverage Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-4 text-sm">
          <p>Each cell shows: <span className="font-medium">Average</span> | <span className="font-medium">Best</span></p>
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-primary/20" />
              <span>Team 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-accent/20" />
              <span>Team 2</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-1">Defense:</p>
              <div className="flex gap-2 items-center">
                <div className="h-4 w-4 bg-green-200" />
                <span>Resistant (&lt;1x)</span>
                <div className="h-4 w-4 bg-red-200 ml-2" />
                <span>Weak (&gt;1x)</span>
              </div>
            </div>
            <div>
              <p className="font-medium mb-1">Offense:</p>
              <div className="flex gap-2 items-center">
                <div className="h-4 w-4 bg-green-200" />
                <span>Super Effective (&gt;1x)</span>
                <div className="h-4 w-4 bg-red-200 ml-2" />
                <span>Not Very Effective (&lt;1x)</span>
              </div>
            </div>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead 
                className="text-center" 
                colSpan={2}
                style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
              >
                Team 1
              </TableHead>
              <TableHead 
                className="text-center" 
                colSpan={2}
                style={{ backgroundColor: 'hsl(var(--accent) / 0.1)' }}
              >
                Team 2
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead></TableHead>
              <TableHead className="text-center bg-primary/5">Defense</TableHead>
              <TableHead className="text-center bg-primary/5">Offense</TableHead>
              <TableHead className="text-center bg-accent/5">Defense</TableHead>
              <TableHead className="text-center bg-accent/5">Offense</TableHead>
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
                {renderEffectivenessCell(team1Defense[type], false)}
                {renderEffectivenessCell(team1Offense[type], true)}
                {renderEffectivenessCell(team2Defense[type], false)}
                {renderEffectivenessCell(team2Offense[type], true)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}