import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import { TeamMember } from "@/types/setup";
import { StatComparison } from "./StatComparison";
import { StatAverages } from "./StatAverages";
import { TypeCoverage } from "./TypeCoverage";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

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

interface ComparedStats {
  stat: string;
  [key: string]: number | string;
}

export function TeamAnalysis({ team1, team2 }: TeamAnalysisProps) {
  const [selectedPokemon1, setSelectedPokemon1] = useState<string | null>(null);
  const [selectedPokemon2, setSelectedPokemon2] = useState<string | null>(null);

  const renderTeamHeader = (team: TeamMember[], teamNumber: number, selectedPokemon: string | null, onSelect: (name: string | null) => void) => {
    const bgColor = teamNumber === 1 ? 'bg-primary/10' : 'bg-accent/10';
    const borderColor = teamNumber === 1 ? 'border-primary/20' : 'border-accent/20';
  
    return (
      <div className={cn("rounded-lg p-6 border", bgColor, borderColor)}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold">Team {teamNumber}</h3>
          <RadioGroup
            value={selectedPokemon || ""}
            onValueChange={(value) => onSelect(value || null)}
          >
            {team.filter(p => p.name).map((pokemon) => (
              <div key={pokemon.slot} className="flex items-center space-x-2">
                <RadioGroupItem value={pokemon.name || ""} id={`team${teamNumber}-${pokemon.slot}`} />
                <Label htmlFor={`team${teamNumber}-${pokemon.slot}`}>{pokemon.name}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="grid grid-cols-4 gap-8">
          {team.map((pokemon) => (
            <div 
              key={pokemon.slot}
              className={cn(
                "flex flex-col items-center",
                selectedPokemon === pokemon.name && "ring-2 ring-offset-2 ring-primary rounded-lg motion-preset-wiggle"
              )}
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

  const getComparisonData = (): ComparedStats[] => {
    const pokemon1 = team1.find(p => p.name === selectedPokemon1)?.stats;
    const pokemon2 = team2.find(p => p.name === selectedPokemon2)?.stats;

    if (!pokemon1 && !pokemon2) return [];

    return [
      { stat: 'HP', ...(pokemon1 && { [selectedPokemon1!]: pokemon1.hp }), ...(pokemon2 && { [selectedPokemon2!]: pokemon2.hp }) },
      { stat: 'Attack', ...(pokemon1 && { [selectedPokemon1!]: pokemon1.attack }), ...(pokemon2 && { [selectedPokemon2!]: pokemon2.attack }) },
      { stat: 'Defense', ...(pokemon1 && { [selectedPokemon1!]: pokemon1.defense }), ...(pokemon2 && { [selectedPokemon2!]: pokemon2.defense }) },
      { stat: 'Sp. Attack', ...(pokemon1 && { [selectedPokemon1!]: pokemon1.special_attack }), ...(pokemon2 && { [selectedPokemon2!]: pokemon2.special_attack }) },
      { stat: 'Sp. Defense', ...(pokemon1 && { [selectedPokemon1!]: pokemon1.special_defense }), ...(pokemon2 && { [selectedPokemon2!]: pokemon2.special_defense }) },
      { stat: 'Speed', ...(pokemon1 && { [selectedPokemon1!]: pokemon1.speed }), ...(pokemon2 && { [selectedPokemon2!]: pokemon2.speed }) },
    ];
  };

  const renderPokemonComparison = () => {
    const comparisonData = getComparisonData();
    if (!selectedPokemon1 && !selectedPokemon2) return null;

    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Pokemon Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={comparisonData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="stat" />
              <PolarRadiusAxis />
              {selectedPokemon1 && (
                <Radar
                  name={selectedPokemon1}
                  dataKey={selectedPokemon1}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              )}
              {selectedPokemon2 && (
                <Radar
                  name={selectedPokemon2}
                  dataKey={selectedPokemon2}
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--accent))"
                  fillOpacity={0.3}
                />
              )}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
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
            <div className="flex items-end justify-between w-full min-h-[120px]">
              {allPokemon.map((pokemon, index) => (
                <div key={index} className="flex flex-col items-center gap-3 motion-preset-slide-left">
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
                  <div 
                    className={cn(
                      "min-w-[60px] text-center py-2 px-3 rounded-md",
                      "text-sm font-medium",
                      pokemon.team === 1 ? "bg-primary/10" : "bg-accent/10"
                    )}
                  >
                    {pokemon.speed}
                  </div>
                </div>
              ))}
            </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderTeamHeader(team1, 1, selectedPokemon1, setSelectedPokemon1)}
        {renderTeamHeader(team2, 2, selectedPokemon2, setSelectedPokemon2)}
      </div>

      {renderPokemonComparison()}
      {renderSpeedRanking()}

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

      <TypeCoverage team1={team1} team2={team2} />
    </div>
  );
}