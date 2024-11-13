'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PokemonModalSelector } from './TeamSelecter';
import { PokemonSetupModal } from './PokemonSetupModal';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { X } from "lucide-react";
import { BATTLE_FORMATS, GENERATIONS } from '@/types/format';
import {cn} from "@/lib/utils";
import { typeColors } from '@/constants/gendata';
import { usePokemonData } from '@/hooks/usePokemonData';
import { PokemonSetup } from '@/types/setup';

interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

interface TeamMember {
  slot: number;
  name: string | null;
  stats?: PokemonStats;
  types?: string[];
  sprite?: string;
  setup?: PokemonSetup;
}

interface TeammateData {
  teammate: string;
  usage: number;
  year_month: string;
}

interface AggregatedTeammate {
  name: string;
  totalUsage: number;
  dataPoints: number;
  avgUsage: number;
  recommendedFor: string[];
}

interface Recommendation {
  name: string;
  usage: number;
}

interface FormatUsageResponse {
  data: {
    name: string;
    usage_percent: number;
    raw_count: number;
    rank?: number;
    real_count?: number;
    year_month?: string;
  }[];
}
const aggregateTeammatesData = (
  teammatesList: TeammateData[][],
  sourcePokemons: string[]
): AggregatedTeammate[] => {
  const teammateMap = new Map<string, {
    totalUsage: number;
    dataPoints: number;
    recommendedFor: Set<string>;
  }>();

  // Process each Pokemon's teammates
  teammatesList.forEach((teamGroup, pokemonIndex) => {
    const sourcePokemon = sourcePokemons[pokemonIndex];
    
    teamGroup.forEach(data => {
      if (!teammateMap.has(data.teammate)) {
        teammateMap.set(data.teammate, {
          totalUsage: 0,
          dataPoints: 0,
          recommendedFor: new Set()
        });
      }
      
      const stats = teammateMap.get(data.teammate)!;
      stats.totalUsage += data.usage;
      stats.dataPoints += 1;
      stats.recommendedFor.add(sourcePokemon);
    });
  });

  // Convert to array and calculate averages
  return Array.from(teammateMap.entries())
    .map(([name, stats]) => ({
      name,
      totalUsage: stats.totalUsage,
      dataPoints: stats.dataPoints,
      avgUsage: (stats.totalUsage / stats.dataPoints),
      recommendedFor: Array.from(stats.recommendedFor)
    }))
    .filter(teammate => teammate.avgUsage >= 0.5) // 50% threshold
    .sort((a, b) => b.avgUsage - a.avgUsage);
};


const USAGE_THRESHOLD = 50;

export default function TeamChooser() {
  const [allPokemon, setAllPokemon] = useState<string[]>([]);
  const [selectedGen, setSelectedGen] = useState('gen9');
  const [pokemonProgress, setPokemonProgress] = useState({ current: 0, total: 0 });
  const fetchedRef = useRef<{[key: string]: boolean}>({});
  const { cache, loading: cacheLoading, fetchPokemonBatch, getPokemonData } = usePokemonData();
  const [selectedFormat, setSelectedFormat] = useState('ou');
  const [setupModal, setSetupModal] = useState<{
    isOpen: boolean;
    team: 'team1' | 'team2';
    slot: number;
  } | null>(null);
  const [team1, setTeam1] = useState<TeamMember[]>([
    { slot: 1, name: null },
    { slot: 2, name: null },
    { slot: 3, name: null },
    { slot: 4, name: null }
  ]);
  const [team2, setTeam2] = useState<TeamMember[]>([
    { slot: 1, name: null },
    { slot: 2, name: null },
    { slot: 3, name: null },
    { slot: 4, name: null }
  ]);
  const [recommendations1, setRecommendations1] = useState<Recommendation[]>([]);
  const [recommendations2, setRecommendations2] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSetupClick = (team: 'team1' | 'team2', slot: number) => {
    setSetupModal({ isOpen: true, team, slot });
  };

  // Add handler for setup completion
  const handleSetupComplete = (setup: PokemonSetup) => {
    if (!setupModal) return;

    const { team, slot } = setupModal;
    const updateTeam = team === 'team1' ? setTeam1 : setTeam2;

    updateTeam(prev => prev.map(member => 
      member.slot === slot ? {
        ...member,
        setup,
        stats: setup.stats  // Update the displayed stats with the new calculated stats
      } : member
    ));

    setSetupModal(null);
  };

  useEffect(() => {
    console.log('Cache updated:', {
      size: Object.keys(cache || {}).length,
      sampleKeys: Object.keys(cache || {}).slice(0, 3)
    });
  }, [cache]);
  
  useEffect(() => {
    console.log('AllPokemon updated:', {
      length: allPokemon?.length || 0,
      samplePokemon: allPokemon?.slice(0, 3)
    });
  }, [allPokemon]);

  
  const fetchPokemonList = useCallback(async () => {
    // Create a unique key for this generation/format combination
    const fetchKey = `${selectedGen}-${selectedFormat}`;
    
    console.log('Fetching Pokemon list...', { fetchKey, cached: fetchedRef.current[fetchKey] });
    console.log('Current cache state:', cache);
  
    if (fetchedRef.current[fetchKey]) {
      return;
    }
  
    setLoading(true);
    try {
      const params = new URLSearchParams({
        battle_format: selectedFormat.toLowerCase(),
        generation: selectedGen,
      });
  
      const response = await fetch(`/api/pokemon/usage?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Pokemon data');
      }
  
      const data: FormatUsageResponse = await response.json();
      console.log('Usage data received:', data.data.length, 'Pokemon');
      
      const uniquePokemon = Array.from(new Set(
        data.data.map(entry => entry.name)
      )).sort();
  
      console.log('Unique Pokemon:', uniquePokemon.length);
      setAllPokemon(uniquePokemon);
  
      // Mark this combination as fetched
      fetchedRef.current[fetchKey] = true;
  
      // Only fetch uncached Pokemon
      const uncachedPokemon = uniquePokemon.filter(name => !cache[name]);
      console.log('Uncached Pokemon:', uncachedPokemon.length);
      
      if (uncachedPokemon.length > 0) {
        await fetchPokemonBatch(
          uncachedPokemon,
          (current, total) => {
            console.log(`Fetching Pokemon data: ${current}/${total}`);
            setPokemonProgress({ current, total });
          }
        );
      }
    } catch (error) {
      console.error('Failed to fetch Pokemon list:', error);
      setAllPokemon([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGen, selectedFormat, cache, fetchPokemonBatch]);
  // Fetch available Pokemon when generation/format changes
  useEffect(() => {
    if (!selectedGen || !selectedFormat) {
      setAllPokemon([]);
      return;
    }

    fetchPokemonList();
  }, [selectedGen, selectedFormat, fetchPokemonList]);


  const updateTeamRecommendations = async (
    team: TeamMember[],
    setRecommendations: React.Dispatch<React.SetStateAction<Recommendation[]>>,
    otherTeam: TeamMember[]
  ) => {
    setLoading(true);
    try {
      const selectedPokemon = team.map(member => member.name).filter(Boolean) as string[];
      if (selectedPokemon.length === 0) {
        setRecommendations([]);
        return;
      }
  
      const allTeammatesPromises = selectedPokemon.map(async pokemon => {
        try {
          const formattedName = pokemon.split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('-');
  
          const res = await fetch(
            `/api/pokemon/teammates/${formattedName}?generation=${selectedGen}&battle_format=${selectedFormat.toLowerCase()}`
          );
          const data = await res.json();
          return data.teammates || [];
        } catch (error) {
          console.error(`Failed to fetch teammates for ${pokemon}:`, error);
          return [];
        }
      });
  
      const allTeammatesResults = await Promise.all(allTeammatesPromises);
      
      // Use the updated aggregation function with source Pokemon information
      const aggregatedTeammates = aggregateTeammatesData(allTeammatesResults, selectedPokemon);
  
      // Filter out Pokemon that are already in either team
      const currentTeamPokemon = [...team, ...otherTeam]
        .map(m => m.name)
        .filter(Boolean) as string[];
  
      const recommendations = aggregatedTeammates
        .filter(teammate => !currentTeamPokemon.includes(teammate.name))
        .map(teammate => ({
          name: teammate.name,
          usage: teammate.avgUsage, // Convert to percentage
          recommendedFor: teammate.recommendedFor // Include this in the UI if desired
        }));
  
      setRecommendations(recommendations);
  
    } catch (error) {
      console.error('Failed to update recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePokemonSelect = async (team: 'team1' | 'team2', slot: number, pokemonName: string) => {
    const pokemonData = await getPokemonData(pokemonName);
    if (!pokemonData) return;
    
    try {
      const updateTeam = team === 'team1' ? setTeam1 : setTeam2;
      const currentTeam = team === 'team1' ? team1 : team2;
      const otherTeam = team === 'team1' ? team2 : team1;
      
     
        updateTeam(prev => prev.map(member =>
          member.slot === slot ? {
            ...member,
            name: pokemonData.name,
            stats: pokemonData.stats,
            types: pokemonData.types,
            sprite: pokemonData.sprite
          } : member
        ));

        const updatedTeam = currentTeam.map(member =>
          member.slot === slot ? {
            ...member,
            name: pokemonName,
            stats: pokemonData.stats,
            types: pokemonData.types,
            sprite: pokemonData.sprite
          } : member
        );
        
        await updateTeamRecommendations(
          updatedTeam,
          team === 'team1' ? setRecommendations1 : setRecommendations2,
          otherTeam
        );
      
    } catch (error) {
      console.error('Failed to select Pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePokemonRemove = async (team: 'team1' | 'team2', slot: number) => {
    const updateTeam = team === 'team1' ? setTeam1 : setTeam2;
    const currentTeam = team === 'team1' ? team1 : team2;
    const otherTeam = team === 'team1' ? team2 : team1;

    updateTeam(prev => prev.map(member =>
      member.slot === slot ? { slot: member.slot, name: null } : member
    ));

    const updatedTeam = currentTeam.map(member =>
      member.slot === slot ? { slot: member.slot, name: null } : member
    );

    await updateTeamRecommendations(
      updatedTeam,
      team === 'team1' ? setRecommendations1 : setRecommendations2,
      otherTeam
    );
  };

  const formatPokemonName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderTeamSelection = (
    team: TeamMember[],
    recommendations: Recommendation[],
    teamName: 'team1' | 'team2'
  ) => {
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team {teamName === 'team1' ? '1' : '2'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {team.map((member) => (
            <div key={member.slot} className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 h-auto py-2"
                onClick={() => setSelectedSlot(member.slot)}
                disabled={loading}
              >
                {member.name ? (
                  <div className="flex items-center gap-2 w-full">
                    {member.sprite && (
                      <div className="relative w-8 h-8">
                        <Image
                          src={member.sprite}
                          alt={member.name}
                          fill
                          className="object-contain pixelated"
                        />
                      </div>
                    )}
                    <span>{member.name}</span>
                    <div className="flex gap-1 ml-auto">
                      {member.types?.map(type => (
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
                      {member.setup && (
                        <Badge variant="outline" className="ml-2">
                          Custom
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  `Select Pokemon ${member.slot}`
                )}
              </Button>
              {member.name && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePokemonRemove(teamName, member.slot)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                disabled={!member.name}
                onClick={() => handleSetupClick(teamName, member.slot)}
              >
                Setup
              </Button>
            </div>
          ))}
  
          {recommendations.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Recommended Teammates:</h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.map((rec) => (
                  <Badge
                    key={rec.name}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => {
                      const emptySlot = team.findIndex(member => !member.name);
                      if (emptySlot !== -1) {
                        handlePokemonSelect(teamName, emptySlot + 1, rec.name);
                      }
                    }}
                  >
                    {formatPokemonName(rec.name)} ({rec.usage.toFixed(1)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
  
          <PokemonModalSelector
            open={selectedSlot !== null}
            onClose={() => setSelectedSlot(null)}
            onSelect={(value) => {
              if (selectedSlot !== null) {
                handlePokemonSelect(teamName, selectedSlot, value);
                setSelectedSlot(null);
              }
            }}
            options={allPokemon.map(name => {
              const pokemonData = cache[name] || {};
              const usage = recommendations.find(r => r.name === name)?.usage;
              return {
                name,
                sprite: pokemonData.sprite || undefined,
                types: pokemonData.types || [],
                usage: usage || 0
              };
            })}
            disabled={loading}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-8">

      <h1 className="text-2xl font-bold">Pokemon Team Chooser</h1>
      
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
            {BATTLE_FORMATS.SMOGON.map(format => (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {renderTeamSelection(team1, recommendations1, 'team1')}
          </div>
          <div className="space-y-8">
            {renderTeamSelection(team2, recommendations2, 'team2')}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button 
          onClick={() => {
            const team1String = team1.map(member => member.name).filter(Boolean).join(',');
            const team2String = team2.map(member => member.name).filter(Boolean).join(',');
            router.push(`/analyze-teams?team1=${encodeURIComponent(team1String)}&team2=${encodeURIComponent(team2String)}`);
          }} 
          className="bg-primary"
        >
          Analyse Teams
        </Button>
      </div>

      {setupModal && (
    <PokemonSetupModal
      open={true}
      onClose={() => setSetupModal(null)}
      pokemon={{
        name: (setupModal.team === 'team1' ? team1 : team2).find(
          member => member.slot === setupModal.slot
        )?.name || '',  // Ensure we have a string for name
        sprite: (setupModal.team === 'team1' ? team1 : team2).find(
          member => member.slot === setupModal.slot
        )?.sprite,
        types: (setupModal.team === 'team1' ? team1 : team2).find(
          member => member.slot === setupModal.slot
        )?.types,
        stats: (setupModal.team === 'team1' ? team1 : team2).find(
          member => member.slot === setupModal.slot
        )?.stats || {  // Provide default stats if none exist
          hp: 0,
          attack: 0,
          defense: 0,
          special_attack: 0,
          special_defense: 0,
          speed: 0
        }
      }}
      generation={selectedGen}
      format={selectedFormat}
      onSetupComplete={handleSetupComplete}
    />
  )}
    </div>
  );
}