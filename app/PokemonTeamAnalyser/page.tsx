'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

const pokemonData = [
  { id: 1, name: 'Pikachu', stats: { hp: 35, attack: 55, defense: 40, speed: 90, special: 50 }, types: ['Electric'] },
  { id: 2, name: 'Charizard', stats: { hp: 78, attack: 84, defense: 78, speed: 100, special: 85 }, types: ['Fire', 'Flying'] },
  { id: 3, name: 'Bulbasaur', stats: { hp: 45, attack: 49, defense: 49, speed: 45, special: 65 }, types: ['Grass', 'Poison'] },
  { id: 4, name: 'Squirtle', stats: { hp: 44, attack: 48, defense: 65, speed: 43, special: 50 }, types: ['Water'] },
  { id: 5, name: 'Jigglypuff', stats: { hp: 115, attack: 45, defense: 20, speed: 20, special: 25 }, types: ['Normal', 'Fairy'] },
  { id: 6, name: 'Gengar', stats: { hp: 60, attack: 65, defense: 60, speed: 110, special: 130 }, types: ['Ghost', 'Poison'] },
  { id: 7, name: 'Gyarados', stats: { hp: 95, attack: 125, defense: 79, speed: 81, special: 100 }, types: ['Water', 'Flying'] },
  { id: 8, name: 'Machamp', stats: { hp: 90, attack: 130, defense: 80, speed: 55, special: 65 }, types: ['Fighting'] },
]

const team1 = pokemonData.slice(0, 4)
const team2 = pokemonData.slice(4, 8)

const allTypes = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 
  'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
]

const typeEffectiveness = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Fighting: 0, Poison: 0.5, Bug: 0.5, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
}

export default function PokemonTeamAnalyser() {
  const [selectedPokemon1, setSelectedPokemon1] = useState<number | null>(null)
  const [selectedPokemon2, setSelectedPokemon2] = useState<number | null>(null)

  const getRadarData = (pokemonId: number | null) => {
    const pokemon = pokemonData.find(p => p.id === pokemonId)
    if (!pokemon) return []
    return Object.entries(pokemon.stats).map(([key, value]) => ({
      stat: key,
      [pokemon.name]: value,
    }))
  }

  const radarData = [
    ...getRadarData(selectedPokemon1),
    ...getRadarData(selectedPokemon2),
  ].reduce((acc, curr) => {
    const existingItem = acc.find(item => item.stat === curr.stat)
    if (existingItem) {
      return acc.map(item => 
        item.stat === curr.stat ? { ...item, ...curr } : item
      )
    }
    return [...acc, curr]
  }, [])

  const getTypeEffectiveness = (attackingType: string, defendingType: string) => {
    return typeEffectiveness[attackingType]?.[defendingType] || 1
  }

  const getCellColor = (effectiveness: number) => {
    if (effectiveness === 0) return 'bg-red-500'
    if (effectiveness === 0.5) return 'bg-orange-300'
    if (effectiveness === 1) return 'bg-gray-100'
    if (effectiveness === 2) return 'bg-green-300'
    return 'bg-gray-100'
  }

  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Pokemon Team Analyzer</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Team 1</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup onValueChange={(value) => setSelectedPokemon1(Number(value))}>
                {team1.map(pokemon => (
                  <div key={pokemon.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={pokemon.id.toString()} id={`team1-${pokemon.id}`} />
                    <Label htmlFor={`team1-${pokemon.id}`}>{pokemon.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-1">
            <CardHeader>
              <CardTitle>Comparative Radar Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="stat" />
                  <PolarRadiusAxis />
                  {selectedPokemon1 && (
                    <Radar
                      name={pokemonData.find(p => p.id === selectedPokemon1)?.name}
                      dataKey={pokemonData.find(p => p.id === selectedPokemon1)?.name}
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  )}
                  {selectedPokemon2 && (
                    <Radar
                      name={pokemonData.find(p => p.id === selectedPokemon2)?.name}
                      dataKey={pokemonData.find(p => p.id === selectedPokemon2)?.name}
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                    />
                  )}
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Team 2</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup onValueChange={(value) => setSelectedPokemon2(Number(value))}>
                {team2.map(pokemon => (
                  <div key={pokemon.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={pokemon.id.toString()} id={`team2-${pokemon.id}`} />
                    <Label htmlFor={`team2-${pokemon.id}`}>{pokemon.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Type Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row">
              <div className="overflow-x-auto flex-grow">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">Type</TableHead>
                      {team1.concat(team2).map(pokemon => (
                        <TableHead key={pokemon.id} className="px-2 py-1 text-xs">{pokemon.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTypes.map(type => (
                      <TableRow key={type}>
                        <TableCell className="sticky left-0 bg-background font-medium">{type}</TableCell>
                        {team1.concat(team2).map(pokemon => {
                          const effectiveness = Math.min(
                            ...pokemon.types.map(pokeType => getTypeEffectiveness(type, pokeType))
                          )
                          return (
                            <TableCell key={`${type}-${pokemon.id}`} className={`${getCellColor(effectiveness)} w-8 h-8 p-0`}>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:w-48 mt-4 md:mt-0 md:ml-4">
                <h3 className="font-semibold mb-2">Effectiveness Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-red-500 mr-2"></div>
                    <span className="text-sm">No effect (0x)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-orange-300 mr-2"></div>
                    <span className="text-sm">Not very effective (0.5x)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-100 mr-2"></div>
                    <span className="text-sm">Normal (1x)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-300 mr-2"></div>
                    <span className="text-sm">Super effective (2x)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}