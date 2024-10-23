'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock data for the chart
const generateMockData = (startDate: Date, endDate: Date) => {
  const pokemonList = ['Pikachu', 'Charizard', 'Bulbasaur', 'Squirtle', 'Jigglypuff', 'Gengar', 'Gyarados', 'Dragonite', 'Mewtwo', 'Snorlax', 'Vaporeon', 'Arcanine', 'Lapras', 'Venusaur', 'Blastoise']
  const months = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    months.push(new Date(currentDate))
    currentDate.setMonth(currentDate.getMonth() + 1)
  }
  return months.map(date => ({
    month: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
    ...pokemonList.reduce((acc, pokemon) => ({
      ...acc,
      [pokemon]: Math.random() * 100
    }), {})
  }))
}

// Mock data for the stats table
const mockStatsData = [
  { pokemon: 'Pikachu', usage: 85.2, winRate: 62.5 },
  { pokemon: 'Charizard', usage: 72.8, winRate: 58.3 },
  { pokemon: 'Bulbasaur', usage: 68.5, winRate: 55.7 },
  { pokemon: 'Squirtle', usage: 61.3, winRate: 53.2 },
  { pokemon: 'Jigglypuff', usage: 57.9, winRate: 51.8 },
  { pokemon: 'Gengar', usage: 55.6, winRate: 54.1 },
  { pokemon: 'Gyarados', usage: 53.2, winRate: 56.8 },
  { pokemon: 'Dragonite', usage: 51.9, winRate: 57.3 },
  { pokemon: 'Mewtwo', usage: 50.5, winRate: 59.9 },
  { pokemon: 'Snorlax', usage: 49.1, winRate: 52.6 },
  { pokemon: 'Vaporeon', usage: 47.8, winRate: 53.4 },
  { pokemon: 'Arcanine', usage: 46.4, winRate: 51.9 },
  { pokemon: 'Lapras', usage: 45.1, winRate: 50.7 },
  { pokemon: 'Venusaur', usage: 43.7, winRate: 52.2 },
  { pokemon: 'Blastoise', usage: 42.3, winRate: 51.5 },
]

const tiers = ['OU', 'UU', 'RU', 'NU', 'PU']
const pokemonList = mockStatsData.map(data => data.pokemon)

export default function PokemonUsageDashboard() {
  const [selectedTier, setSelectedTier] = useState('OU')
  const [selectedPokemon, setSelectedPokemon] = useState<string[]>(pokemonList.slice(0, 5))
  const [minDate, setMinDate] = useState('2023-01-01')
  const [maxDate, setMaxDate] = useState('2023-12-31')
  const [chartData, setChartData] = useState<any[]>([])
  const [activePreset, setActivePreset] = useState<number>(5);

  useEffect(() => {
    const startDate = new Date(minDate)
    const endDate = new Date(maxDate)
    setChartData(generateMockData(startDate, endDate))
  }, [minDate, maxDate])

  const handlePresetClick = (top: number) => {
    if (top === 5) {
      // Can't deselect top 5 as it's the default
      return;
    }
    if (activePreset === top) {
      // Reset to default (top 5) if a non-5 button is clicked twice
      setSelectedPokemon(pokemonList.slice(0, 5));
      setActivePreset(5);
    } else {
      setSelectedPokemon(pokemonList.slice(0, top));
      setActivePreset(top);
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <div className="container mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pokemon Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  interval={0}
                  tick={{fontSize: 12}}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedPokemon.map((pokemon, index) => (
                  <Line 
                    key={pokemon} 
                    type="monotone" 
                    dataKey={pokemon} 
                    stroke={`hsl(${index * 60}, 70%, 50%)`} 
                    activeDot={{ r: 8 }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Display Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2">Tier</label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map(tier => (
                      <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-2">Min Date</label>
                <Input type="date" value={minDate} onChange={(e) => setMinDate(e.target.value)} />
              </div>
              <div>
                <label className="block mb-2">Max Date</label>
                <Input type="date" value={maxDate} onChange={(e) => setMaxDate(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block mb-2">Preset Options</label>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handlePresetClick(5)} 
                  variant={activePreset === 5 ? "default" : "outline"}
                  disabled={activePreset === 5}
                >
                  Top 5
                </Button>
                <Button 
                  onClick={() => handlePresetClick(10)} 
                  variant={activePreset === 10 ? "default" : "outline"}
                >
                  Top 10
                </Button>
                <Button 
                  onClick={() => handlePresetClick(15)} 
                  variant={activePreset === 15 ? "default" : "outline"}
                >
                  Top 15
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stats Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2">Tier</label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map(tier => (
                      <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-2">Pokemon</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Pokemon" />
                  </SelectTrigger>
                  <SelectContent>
                    {pokemonList.map(pokemon => (
                      <SelectItem key={pokemon} value={pokemon}>{pokemon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pokemon</TableHead>
                  <TableHead>Usage %</TableHead>
                  <TableHead>Win Rate %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockStatsData.map((row, index) => (
                  <TableRow key={row.pokemon} className={index % 2 === 0 ? 'bg-muted' : ''}>
                    <TableCell>{row.pokemon}</TableCell>
                    <TableCell>{row.usage.toFixed(1)}%</TableCell>
                    <TableCell>{row.winRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}