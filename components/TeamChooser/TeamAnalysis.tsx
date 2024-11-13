import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import { TeamMember } from "@/types/setup";
import { StatComparison } from "./StatComparison";
import { StatAverages } from "./StatAverages";
import { TypeCoverage } from "./TypeCoverage";
import { ChevronRight } from "lucide-react";

interface TeamAnalysisProps {
  team1: TeamMember[];
  team2: TeamMember[];
}

interface SpeedRanking {
  name: string | null;
  speed: number;
  sprite?: string;
  team: number;
}

export function TeamAnalysis({ team1, team2 }: TeamAnalysisProps) {
  const renderPokemonCard = (pokemon: TeamMember) => (
    <div 
      key={pokemon.slot}
      className="flex flex-col items-center bg-background rounded-lg p-4 w-[140px] h-[140px] border shadow-sm"
    >
      <div className="flex-1 flex items-center justify-center">
        {pokemon.sprite ? (
          <div className="relative w-16 h-16">
            <Image
              src={pokemon.sprite}
              alt={pokemon.name || ''}
              fill
              className="object-contain pixelated"
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-muted rounded-lg" />
        )}
      </div>
      <div className="w-full text-center">
        <span className="text-sm font-medium block truncate">
          {pokemon.name || 'Empty'}
        </span>
        <div className="flex gap-1 justify-center mt-1">
          {pokemon.types?.map(type => (
            <Badge
              key={type}
              variant="secondary"
              className={cn(
                "text-xs",
                typeColors[type.toLowerCase()]?.bg,
                typeColors[type.toLowerCase()]?.text
              )}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTeamHeader = (team: TeamMember[], teamNumber: number) => {
    const bgColor = teamNumber === 1 ? 'bg-primary/10' : 'bg-accent/10';
    const borderColor = teamNumber === 1 ? 'border-primary/20' : 'border-accent/20';
  
    return (
      <div className={cn("rounded-lg p-6 border", bgColor, borderColor)}>
        <h3 className="font-semibold mb-6">Team {teamNumber}</h3>
        <div className="grid grid-cols-4 gap-8">
          {team.map((pokemon) => (
            <div 
              key={pokemon.slot}
              className="flex flex-col items-center"
            >
              {pokemon.sprite ? (
                <div className="relative w-20 h-20 mb-3">
                  <Image
                    src={pokemon.sprite}
                    alt={pokemon.name || ''}
                    fill
                    className="object-contain pixelated"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 mb-3 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Empty</span>
                </div>
              )}
              {pokemon.name && (
                <>
                  <span className="text-sm font-medium mb-1 text-center">
                    {pokemon.name}
                  </span>
                  <div className="flex gap-1 flex-wrap justify-center">
                    {pokemon.types?.map(type => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          typeColors[type.toLowerCase()]?.bg,
                          typeColors[type.toLowerCase()]?.text
                        )}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSpeedRanking = () => {
    const allPokemon: SpeedRanking[] = [
      ...team1.map(p => ({
        name: p.name,
        speed: p.stats?.speed || 0,
        sprite: p.sprite,
        team: 1
      })),
      ...team2.map(p => ({
        name: p.name,
        speed: p.stats?.speed || 0,
        sprite: p.sprite,
        team: 2
      }))
    ]
    .filter(p => p.name)
    .sort((a, b) => b.speed - a.speed);
  
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Speed Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative px-8 py-4">
            {/* Main Pokemon speed display */}
            <div className="flex items-end justify-between w-full min-h-[120px]">
              {allPokemon.map((pokemon, index) => (
                <div key={index} className="flex flex-col items-center gap-3">
                  {/* Pokemon sprite */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    {pokemon.sprite && (
                      <Image
                        src={pokemon.sprite}
                        alt={pokemon.name || ''}
                        fill
                        className="object-contain pixelated"
                      />
                    )}
                  </div>
                  {/* Speed value */}
                  <div 
                    className={cn(
                      "min-w-[60px] text-center py-2 px-3 rounded-md",
                      "text-sm font-medium",
                      pokemon.team === 1 ? "bg-primary/10" : "bg-accent/10"
                    )}
                  >
                    {pokemon.speed}
                  </div>
  
                  {/* Chevron */}
                  {index < allPokemon.length - 1 && (
                    <div 
                      className="absolute top-[42px]" 
                      style={{ 
                        left: `calc(${(100 * (index + 1))/allPokemon.length}% - 12px)`
                      }}
                    >
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
  
            {/* Labels with decorative lines */}
            <div className="flex justify-between mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-muted-foreground/50" />
                <span className="text-muted-foreground font-medium">Fastest</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">Slowest</span>
                <div className="h-px w-8 bg-muted-foreground/50" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Team Headers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderTeamHeader(team1, 1)}
        {renderTeamHeader(team2, 2)}
      </div>

      {/* Speed Ranking */}
      {renderSpeedRanking()}

      {/* Stats Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Team Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <StatComparison team1={team1} team2={team2} />
            <StatAverages team1={team1} team2={team2} />
          </div>
        </CardContent>
      </Card>

      {/* Type Coverage */}
      <TypeCoverage team1={team1} team2={team2} />
    </div>
  );
}