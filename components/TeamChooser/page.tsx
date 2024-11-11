'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface TeamMember {
  slot: number;
  pokemon: string | null;
}

export default function TeamChooser() {
  // Simpler state - just array of strings
  const [allPokemon, setAllPokemon] = useState([]);
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

  const router = useRouter()

  useEffect(() => {
    async function fetchPokemonList() {
      try {
        const res = await fetch('/api/pokemon');
        const data = await res.json();
        console.log(data);
        
        if (Array.isArray(data)) {
          // data.data will be array of strings like ["aegislash-shield", "abomasnow", "abomasnow-mega", ...]
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
  }, []);

  const formatPokemonName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Group Pokemon by their base name for the dropdown
  const groupedPokemon = allPokemon.reduce((acc: { [key: string]: string[] }, name: string) => {
    const baseName = name.split('-')[0];
    if (!acc[baseName]) {
      acc[baseName] = [];
    }
    acc[baseName].push(name);
    return acc;
  }, {});

  const updateTeamMember = (team: 'team1' | 'team2', slot: number, pokemon: string) => {
    if (team === 'team1') {
      setTeam1(prev => prev.map(member =>
        member.slot === slot ? { ...member, pokemon } : member
      ));
    } else {
      setTeam2(prev => prev.map(member =>
        member.slot === slot ? { ...member, pokemon } : member
      ));
    }
  };

  const isDisabled = (team: TeamMember[], pokemon: string) => {
    return team.some(member => member.pokemon === pokemon);
  };

  const handleAnalyseTeams = () => {
    const team1String = team1.map(member => member.pokemon).filter(Boolean).join(',');
    const team2String = team2.map(member => member.pokemon).filter(Boolean).join(',');
    router.push(`/PokemonTeamAnalyser?team1=${encodeURIComponent(team1String)}&team2=${encodeURIComponent(team2String)}`);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">PokeTeam Chooser</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team 1 Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Team 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {team1.map((member) => (
              <div key={member.slot} className="space-y-2">
                <Select
                  value={member.pokemon || ''}
                  onValueChange={(value) => updateTeamMember('team1', member.slot, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select Pokemon ${member.slot}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-60">
                      {Object.entries(groupedPokemon).map(([baseName, forms]) => (
                        <React.Fragment key={baseName}>
                          {forms.length > 1 ? (
                            <>
                              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                {formatPokemonName(baseName)}
                              </div>
                              {forms.map(form => (
                                <SelectItem
                                  key={form}
                                  value={form}
                                  disabled={isDisabled(team1, form)}
                                  className="pl-4"
                                >
                                  {formatPokemonName(form)}
                                </SelectItem>
                              ))}
                            </>
                          ) : (
                            <SelectItem
                              key={forms[0]}
                              value={forms[0]}
                              disabled={isDisabled(team1, forms[0])}
                            >
                              {formatPokemonName(forms[0])}
                            </SelectItem>
                          )}
                        </React.Fragment>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team 2 Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Team 2</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {team2.map((member) => (
              <div key={member.slot} className="space-y-2">
                <Select
                  value={member.pokemon || ''}
                  onValueChange={(value) => updateTeamMember('team2', member.slot, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select Pokemon ${member.slot}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-60">
                      {Object.entries(groupedPokemon).map(([baseName, forms]) => (
                        <React.Fragment key={baseName}>
                          {forms.length > 1 ? (
                            <>
                              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                {formatPokemonName(baseName)}
                              </div>
                              {forms.map(form => (
                                <SelectItem
                                  key={form}
                                  value={form}
                                  disabled={isDisabled(team2, form)}
                                  className="pl-4"
                                >
                                  {formatPokemonName(form)}
                                </SelectItem>
                              ))}
                            </>
                          ) : (
                            <SelectItem
                              key={forms[0]}
                              value={forms[0]}
                              disabled={isDisabled(team2, forms[0])}
                            >
                              {formatPokemonName(forms[0])}
                            </SelectItem>
                          )}
                        </React.Fragment>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleAnalyseTeams} className="bg-blue-500 text-white">
          Analyse Teams!
        </Button>
      </div>
    </div>
  );

}