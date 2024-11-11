'use client'

import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { UsageChart } from '@/components/usage/UsageChart'
import { UsageControls } from '@/components/usage/UsageControl'
import { StatsTable } from '@/components/usage/StatTable'
import { usePokemonUsage } from '@/hooks/usePokemonUsage'
import { usePokemonStats } from '@/hooks/usePokemonStats'
import { PokemonSelector } from '@/components/usage/Selector'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'

export default function PokemonUsagePage() {
  const [selectedTier, setSelectedTier] = useState('OU')
  const [selectedGeneration, setSelectedGeneration] = useState('gen9')
  const [startMonth, setStartMonth] = useState('11')
  const [startYear, setStartYear] = useState('2022')
  const [endMonth, setEndMonth] = useState('02')
  const [endYear, setEndYear] = useState('2024')
  const [activePreset, setActivePreset] = useState<number>(5)
  const [selectionMode, setSelectionMode] = useState<'preset' | 'custom'>('preset')
  const [customSelectedPokemon, setCustomSelectedPokemon] = useState<string[]>([])

  const handlePresetClick = (top: number) => {
    if (top === activePreset) return
    setActivePreset(top)
    setSelectionMode('preset')
  }

  const handleCustomPokemonChange = (pokemon: string[]) => {
    setCustomSelectedPokemon(pokemon)
    setSelectionMode('custom')
  }

  const { selectedPokemon, chartData, loading: usageLoading } = usePokemonUsage({
    selectedTier,
    selectedGeneration,
    startMonth,
    startYear,
    endMonth,
    endYear,
    activePreset,
    customSelectedPokemon,
    selectionMode
  })

  const { statsData, loading: statsLoading } = usePokemonStats(selectedPokemon, selectedGeneration)

  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <div className="container mx-auto p-4">
        <UsageChart 
          loading={usageLoading}
          chartData={chartData}
          selectedPokemon={selectedPokemon}
        />

        <UsageControls 
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
          selectedGeneration={selectedGeneration}
          setSelectedGeneration={setSelectedGeneration}
          startMonth={startMonth}
          setStartMonth={setStartMonth}
          startYear={startYear}
          setStartYear={setStartYear}
          endMonth={endMonth}
          setEndMonth={setEndMonth}
          endYear={endYear}
          setEndYear={setEndYear}
          activePreset={activePreset}
          handlePresetClick={handlePresetClick}
        />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pokemon Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectionMode} onValueChange={(value: 'preset' | 'custom') => setSelectionMode(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preset">Preset Top Pokemon</TabsTrigger>
                <TabsTrigger value="custom">Custom Selection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preset" className="mt-4">
                <div className="flex space-x-2">
                  {[5, 10, 15].map((preset) => (
                    <Button 
                      key={preset}
                      onClick={() => handlePresetClick(preset)} 
                      variant={activePreset === preset ? "default" : "outline"}
                    >
                      Top {preset}
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="mt-4">
                <PokemonSelector
                    selectedPokemon={customSelectedPokemon}
                    onPokemonChange={setCustomSelectedPokemon}
                    generation={selectedGeneration}
                    battleFormat={selectedTier}
                    startMonth={startMonth}
                    startYear={startYear}
                    endMonth={endMonth}
                    endYear={endYear}
                  />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <StatsTable 
          loading={statsLoading}
          statsData={statsData}
        />
      </div>
    </ScrollArea>
  )
}