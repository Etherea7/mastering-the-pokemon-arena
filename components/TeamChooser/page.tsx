import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

const BATTLE_FORMATS = ['ou', 'uu', 'ru', 'nu', 'pu'];
const GENERATIONS = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9'];
const USAGE_THRESHOLD = 50;

interface TeamMember {
  slot: number;
  pokemon: string | null;
}

interface Recommendation {
  name: string;
  usage: number;
}

const RecommendationCard = ({ 
    recommendations, 
    onSelect, 
    selectedPokemon,
    title 
  }: { 
    recommendations: Recommendation[],
    onSelect: (pokemon: string) => void,
    selectedPokemon: (string | null)[],
    title: string
  }) => {
    const filteredRecommendations = recommendations.filter(
      rec => !selectedPokemon.includes(rec.name)
    );
  
    if (filteredRecommendations.length === 0) return null;
  
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recommended for {title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filteredRecommendations.map((rec) => (
              <Badge
                key={rec.name}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => onSelect(rec.name)}
              >
                {formatPokemonName(rec.name)} ({rec.usage.toFixed(1)}%)
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

const formatPokemonName = (name: string) => {
  return name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function TeamChooser() {
  const [allPokemon, setAllPokemon] = useState<string[]>([]);
  const [selectedGen, setSelectedGen] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [team1, setTeam1] = useState<TeamMember[]>([
    { slot: 1, pokemon: null },
    { slot: 2, pokemon: null },
    { slot: 3, pokemon: null },
    { slot: 4, pokemon: null }
  ]);
  const [team2, setTeam2] = useState<TeamMember[]>([
    { slot: 1, pokemon: null },
    { slot: 2, pokemon: null },
    { slot: 3, pokemon: null },
    { slot: 4, pokemon: null }
  ]);
  const [recommendations1, setRecommendations1] = useState<Recommendation[]>([]);
  const [recommendations2, setRecommendations2] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function fetchPokemonList() {
      // Only fetch if both generation and format are selected
      if (!selectedGen || !selectedFormat) {
        setAllPokemon([]);
        return;
      }
  
      try {
        const res = await fetch(`/api/pokemon?battle_format=${selectedFormat}&generation=${selectedGen}`);
        const data = await res.json();
        console.log('Pokemon list response:', data);
        
        if (Array.isArray(data)) {
          setAllPokemon(data);
        } else {
          console.error('Unexpected data format:', data);
          setAllPokemon([]);
        }
      } catch (error) {
        console.error('Failed to fetch Pokemon list:', error);
        setAllPokemon([]);
      }
    }
    fetchPokemonList();
  }, [selectedGen, selectedFormat]); // Add dependencies here

  const fetchTeammates = async (pokemon: string) => {
    try {
      const formattedName = pokemon.split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');

      const res = await fetch(
        `/api/pokemon/teammates/${formattedName}?generation=${selectedGen}&battle_format=${selectedFormat}`
      );
      const data = await res.json();
      return data.teammates || [];
    } catch (error) {
      console.error('Failed to fetch teammates:', error);
      return [];
    }
  };

  const updateTeamRecommendations = async (
    team: TeamMember[],
    setRecommendations: React.Dispatch<React.SetStateAction<Recommendation[]>>,
    otherTeam: TeamMember[]
  ) => {
    setLoading(true);
    try {
      const selectedPokemon = team.map(member => member.pokemon).filter(Boolean) as string[];
      if (selectedPokemon.length === 0) {
        setRecommendations([]);
        return;
      }
  
      const allTeammatesPromises = selectedPokemon.map(pokemon => fetchTeammates(pokemon));
      const allTeammatesResults = await Promise.all(allTeammatesPromises);
  
      const teammateUsageMap = new Map<string, number>();
      
      allTeammatesResults.forEach(teammatesList => {
        teammatesList.forEach((teammate: { name: string, usage: number }) => {
          if (!teammateUsageMap.has(teammate.name)) {
            teammateUsageMap.set(teammate.name, teammate.usage);
          } else {
            const currentUsage = teammateUsageMap.get(teammate.name)!;
            teammateUsageMap.set(teammate.name, (currentUsage + teammate.usage) / 2);
          }
        });
      });
  
      // Only filter out Pokémon from the current team, not both teams
      const currentTeamPokemon = team.map(m => m.pokemon)
        .filter(Boolean) as string[];
  
      // Filter recommendations - now only excluding Pokémon from current team
      const filteredRecommendations = Array.from(teammateUsageMap.entries())
        .filter(([name, usage]) => (
          usage >= USAGE_THRESHOLD && 
          !currentTeamPokemon.includes(name)  // Only check against current team
        ))
        .map(([name, usage]) => ({ name, usage }))
        .sort((a, b) => b.usage - a.usage);
  
      setRecommendations(filteredRecommendations);
    } catch (error) {
      console.error('Failed to update recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTeamMember = async (team: 'team1' | 'team2', slot: number, pokemon: string) => {
    // Capitalize the Pokémon name when storing it
    const capitalizedPokemon = pokemon.split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('-');
  
    const updateTeam = team === 'team1' ? setTeam1 : setTeam2;
    const currentTeam = team === 'team1' ? team1 : team2;
    const otherTeam = team === 'team1' ? team2 : team1;
    
    updateTeam(prev => prev.map(member =>
      member.slot === slot ? { ...member, pokemon: capitalizedPokemon } : member
    ));
  
    const updatedTeam = currentTeam.map(member =>
      member.slot === slot ? { ...member, pokemon: capitalizedPokemon } : member
    );
    
    await updateTeamRecommendations(
      updatedTeam,
      team === 'team1' ? setRecommendations1 : setRecommendations2,
      otherTeam
    );
  };

  const getAvailablePokemon = (selectedTeam: TeamMember[], otherTeam: TeamMember[], recommendations: Recommendation[]) => {
    const selectedPokemon = [...selectedTeam, ...otherTeam]
      .map(member => member.pokemon)
      .filter(Boolean) as string[];
    const recommendedPokemon = recommendations.map(rec => rec.name);
    
    return allPokemon.filter(pokemon => 
      !selectedPokemon.includes(pokemon) && 
      !recommendedPokemon.includes(pokemon)
    );
  };

  const renderTeamSelection = (
    team: TeamMember[],
    otherTeam: TeamMember[],
    recommendations: Recommendation[],
    teamName: 'team1' | 'team2'
  ) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team {teamName === 'team1' ? '1' : '2'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {team.map((member) => (
            <div key={member.slot} className="space-y-2">
              <Select
                value={member.pokemon || ''}
                onValueChange={(value) => updateTeamMember(teamName, member.slot, value)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {member.pokemon ? formatPokemonName(member.pokemon) : `Select Pokemon ${member.slot}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-60">
                    {allPokemon.map(pokemon => (
                      <SelectItem
                        key={pokemon}
                        value={pokemon}
                        disabled={
                          team.some(m => m.pokemon === pokemon) ||
                          otherTeam.some(m => m.pokemon === pokemon)
                        }
                      >
                        {formatPokemonName(pokemon)}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">PokeTeam Chooser</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select value={selectedGen} onValueChange={setSelectedGen}>
          <SelectTrigger>
            <SelectValue placeholder="Select Generation" />
          </SelectTrigger>
          <SelectContent>
            {GENERATIONS.map(gen => (
              <SelectItem key={gen} value={gen}>
                {gen.replace('gen', 'Gen ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
          <SelectTrigger>
            <SelectValue placeholder="Select Format" />
          </SelectTrigger>
          <SelectContent>
            {BATTLE_FORMATS.map(format => (
              <SelectItem key={format} value={format}>
                {format.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(!selectedGen || !selectedFormat) ? (
        <Alert>
          <AlertDescription>
            Please select a generation and format to start building your teams
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderTeamSelection(team1, team2, recommendations1, 'team1')}
            {renderTeamSelection(team2, team1, recommendations2, 'team2')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecommendationCard
            recommendations={recommendations1}
            onSelect={(pokemon) => {
                const emptySlot = team1.findIndex(member => !member.pokemon);
                if (emptySlot !== -1) {
                const newTeam = team1.map((member, idx) => 
                    idx === emptySlot ? { ...member, pokemon } : member
                );
                setTeam1(newTeam);
                // Update recommendations with the new team state
                updateTeamRecommendations(newTeam, setRecommendations1, team2);
                }
            }}
            selectedPokemon={[
                ...team1.map(m => m.pokemon),
                ...team2.map(m => m.pokemon)
            ].filter(Boolean) as string[]}
            title="Team 1"
            />
            <RecommendationCard
                recommendations={recommendations2}
                onSelect={(pokemon) => {
                    const emptySlot = team2.findIndex(member => !member.pokemon);
                    if (emptySlot !== -1) {
                    setTeam2(prev => prev.map((member, idx) => 
                        idx === emptySlot ? { ...member, pokemon } : member
                    ));
                    updateTeamMember('team2', emptySlot + 1, pokemon);
                    }
                }}
                selectedPokemon={team2.map(m => m.pokemon).filter(Boolean) as string[]} // Only filter against current team
                title="Team 2"
            />
          </div>
        </>
      )}

      <div className="flex justify-center">
        <Button 
          onClick={() => {
            const team1String = team1.map(member => member.pokemon).filter(Boolean).join(',');
            const team2String = team2.map(member => member.pokemon).filter(Boolean).join(',');
            router.push(`/PokemonTeamAnalyser?team1=${encodeURIComponent(team1String)}&team2=${encodeURIComponent(team2String)}`);
          }} 
          className="bg-blue-500 text-white"
        >
          Analyse Teams
        </Button>
      </div>
    </div>
  );
}