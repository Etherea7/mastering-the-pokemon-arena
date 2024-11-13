// components/TeamAnalysis/StatAverages.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamMember } from '@/types/setup';
import {cn } from "@/lib/utils";
interface StatAveragesProps {
  team1: TeamMember[];
  team2: TeamMember[];
}

interface AverageStats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

export function StatAverages({ team1, team2 }: StatAveragesProps) {
  const calculateAverageStats = (team: TeamMember[]): AverageStats => {
    const validPokemon = team.filter(p => p.name && p.stats);
    if (!validPokemon.length) return {
      hp: 0,
      attack: 0,
      defense: 0,
      special_attack: 0,
      special_defense: 0,
      speed: 0
    };

    

    const total = {
      hp: validPokemon.reduce((sum, p) => sum + (p.stats?.hp || 0), 0),
      attack: validPokemon.reduce((sum, p) => sum + (p.stats?.attack || 0), 0),
      defense: validPokemon.reduce((sum, p) => sum + (p.stats?.defense || 0), 0),
      special_attack: validPokemon.reduce((sum, p) => sum + (p.stats?.special_attack || 0), 0),
      special_defense: validPokemon.reduce((sum, p) => sum + (p.stats?.special_defense || 0), 0),
      speed: validPokemon.reduce((sum, p) => sum + (p.stats?.speed || 0), 0),
    };

    return Object.entries(total).reduce((avg, [key, value]) => ({
      ...avg,
      [key]: Math.round(value / validPokemon.length)
    }), {} as AverageStats);
  };

  const getAdvantageIndicator = (advantage: number) => {
    if (Math.abs(advantage) < 0.1) return '−'; // Minus for very close to even
    return '▲'; // Triangle up for advantage (regardless of team)
  };

  const calculateDifference = (stat1: number, stat2: number): string => {
    const diff = ((stat1 - stat2) / stat2 * 100).toFixed(1);
    return diff.startsWith('-') ? diff : `+${diff}`;
  };

  const team1Averages = calculateAverageStats(team1);
  const team2Averages = calculateAverageStats(team2);

  const statLabels = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    special_attack: 'Sp. Attack',
    special_defense: 'Sp. Defense',
    speed: 'Speed'
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Base Stats Comparison</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Stat</TableHead>
              <TableHead className="text-center text-primary">Team 1</TableHead>
              <TableHead className="text-center">Difference</TableHead>
              <TableHead className="text-center text-accent">Team 2</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Object.entries(statLabels) as [keyof AverageStats, string][]).map(([key, label]) => (
              <TableRow key={key}>
                <TableCell className="font-medium">{label}</TableCell>
                <TableCell 
                  className={`text-center font-semibold ${
                    team1Averages[key] > team2Averages[key] ? 'text-green-600' : 
                    team1Averages[key] < team2Averages[key] ? 'text-red-600' : ''
                  }`}
                >
                  {team1Averages[key]}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {calculateDifference(team1Averages[key], team2Averages[key])}%
                </TableCell>
                <TableCell 
                  className={`text-center font-semibold ${
                    team2Averages[key] > team1Averages[key] ? 'text-green-600' : 
                    team2Averages[key] < team1Averages[key] ? 'text-red-600' : ''
                  }`}
                >
                  {team2Averages[key]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>

        <div>
        <h3 className="font-semibold mb-2">Offensive vs Defensive Matchups</h3>
        <Table>
            <TableHeader>
                <TableRow className="border-b-2">
                <TableHead>Matchup Type</TableHead>
                <TableHead className="text-center">
                    <span className="text-primary">Team 1</span> vs <span className="text-accent">Team 2</span>
                </TableHead>
                <TableHead className="text-center">Advantage</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {/* Physical Matchup */}
                <TableRow>
                <TableCell className="font-medium">
                    Physical (Atk vs Def)
                </TableCell>
                <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                    <span className="text-primary font-medium">
                        {team1Averages.attack}
                    </span>
                    <span className="text-sm text-muted-foreground">vs</span>
                    <span className="text-accent font-medium">
                        {team2Averages.defense}
                    </span>
                    </div>
                    <div className="mt-1 border-t pt-1">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-accent font-medium">
                        {team2Averages.attack}
                        </span>
                        <span className="text-sm text-muted-foreground">vs</span>
                        <span className="text-primary font-medium">
                        {team1Averages.defense}
                        </span>
                    </div>
                    </div>
                </TableCell>
                <TableCell>
                    {(() => {
                    const physicalAdvantage = (
                        team1Averages.attack / team2Averages.defense -
                        team2Averages.attack / team1Averages.defense
                    ) * 100;
                    
                    return (
                        <div className={cn(
                        "text-center font-semibold",
                        physicalAdvantage > 0 ? "text-primary" : 
                        physicalAdvantage < 0 ? "text-accent" : "text-muted-foreground"
                        )}>
                        {getAdvantageIndicator(Math.abs(physicalAdvantage))}
                        {' '}
                        {Math.abs(physicalAdvantage).toFixed(1)}%
                        {' '}
                        {physicalAdvantage > 0 ? "Team 1" : 
                        physicalAdvantage < 0 ? "Team 2" : "Even"}
                        </div>
                    );
                    })()}
                </TableCell>
                </TableRow>

                {/* Special Matchup */}
                <TableRow>
                <TableCell className="font-medium">
                    Special (SpA vs SpD)
                </TableCell>
                <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                    <span className="text-primary font-medium">
                        {team1Averages.special_attack}
                    </span>
                    <span className="text-sm text-muted-foreground">vs</span>
                    <span className="text-accent font-medium">
                        {team2Averages.special_defense}
                    </span>
                    </div>
                    <div className="mt-1 border-t pt-1">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-accent font-medium">
                        {team2Averages.special_attack}
                        </span>
                        <span className="text-sm text-muted-foreground">vs</span>
                        <span className="text-primary font-medium">
                        {team1Averages.special_defense}
                        </span>
                    </div>
                    </div>
                </TableCell>
                <TableCell>
                    {(() => {
                    const specialAdvantage = (
                        team1Averages.special_attack / team2Averages.special_defense -
                        team2Averages.special_attack / team1Averages.special_defense
                    ) * 100;
                    
                    return (
                        <div className={cn(
                        "text-center font-semibold",
                        specialAdvantage > 0 ? "text-primary" : 
                        specialAdvantage < 0 ? "text-accent" : "text-muted-foreground"
                        )}>
                        {getAdvantageIndicator(Math.abs(specialAdvantage))}
                        {' '}
                        {Math.abs(specialAdvantage).toFixed(1)}%
                        {' '}
                        {specialAdvantage > 0 ? "Team 1" : 
                        specialAdvantage < 0 ? "Team 2" : "Even"}
                        </div>
                    );
                    })()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}