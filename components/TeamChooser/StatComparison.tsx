import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMember } from '@/types/setup';
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface StatComparisonProps {
  team1: TeamMember[];
  team2: TeamMember[];
}

export function StatComparison({ team1, team2 }: StatComparisonProps) {
  const calculateTeamStats = (team: TeamMember[]) => {
    const validPokemon = team.filter(p => p.name && p.stats);
    if (!validPokemon.length) return null;

    return {
      hp: validPokemon.reduce((sum, p) => sum + (p.stats?.hp || 0), 0),
      attack: validPokemon.reduce((sum, p) => sum + (p.stats?.attack || 0), 0),
      defense: validPokemon.reduce((sum, p) => sum + (p.stats?.defense || 0), 0),
      special_attack: validPokemon.reduce((sum, p) => sum + (p.stats?.special_attack || 0), 0),
      special_defense: validPokemon.reduce((sum, p) => sum + (p.stats?.special_defense || 0), 0),
      speed: validPokemon.reduce((sum, p) => sum + (p.stats?.speed || 0), 0),
    };
  };

  const renderComparisonBar = (stat1: number, stat2: number, label: string, subtitle?: string) => {
    const total = stat1 + stat2;
    const percent1 = (stat1 / total) * 100;
    const percent2 = (stat2 / total) * 100;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium">{label}</span>
            {subtitle && (
              <span className="text-xs text-muted-foreground ml-2">
                ({subtitle})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm",
              stat1 > stat2 ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {stat1}
            </span>
            <ArrowRight className={cn(
              "h-4 w-4",
              stat1 === stat2 ? "text-muted-foreground" : "text-primary",
              stat1 < stat2 && "rotate-180 text-accent"
            )} />
            <span className={cn(
              "text-sm",
              stat1 < stat2 ? "text-accent font-medium" : "text-muted-foreground"
            )}>
              {stat2}
            </span>
          </div>
        </div>
        <div className="h-4 flex rounded-full overflow-hidden">
          <div 
            className="bg-primary transition-all duration-300" 
            style={{ width: `${percent1}%` }}
          />
          <div 
            className="bg-accent transition-all duration-300" 
            style={{ width: `${percent2}%` }}
          />
        </div>
      </div>
    );
  };

  const team1Stats = calculateTeamStats(team1);
  const team2Stats = calculateTeamStats(team2);

  if (!team1Stats || !team2Stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground">
          Add Pokémon to both teams to see stat comparison
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Team Stats Comparison</span>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span>Team 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-full" />
              <span>Team 2</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Basic Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Base Stats</h3>
          {renderComparisonBar(team1Stats.hp, team2Stats.hp, "HP")}
          {renderComparisonBar(team1Stats.speed, team2Stats.speed, "Speed")}
        </div>

        {/* Team 1 Offense vs Team 2 Defense */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Team 1 Offense vs Team 2 Defense</h3>
          {renderComparisonBar(
            team1Stats.attack, 
            team2Stats.defense, 
            "Physical",
            "Attack vs Defense"
          )}
          {renderComparisonBar(
            team1Stats.special_attack, 
            team2Stats.special_defense, 
            "Special",
            "Sp. Attack vs Sp. Defense"
          )}
        </div>

        {/* Team 2 Offense vs Team 1 Defense */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Team 2 Offense vs Team 1 Defense</h3>
          {renderComparisonBar(
            team2Stats.attack, 
            team1Stats.defense, 
            "Physical",
            "Attack vs Defense"
          )}
          {renderComparisonBar(
            team2Stats.special_attack, 
            team1Stats.special_defense, 
            "Special",
            "Sp. Attack vs Sp. Defense"
          )}
        </div>
      </CardContent>
    </Card>
  );
}