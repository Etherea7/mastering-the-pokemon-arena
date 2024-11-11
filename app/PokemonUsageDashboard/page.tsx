'use client'

import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { UsageChart } from '@/components/usage/UsageChart'
import { UsageControls } from '@/components/usage/UsageControl'
import { StatsTable } from '@/components/usage/StatTable'
import { usePokemonUsage } from '@/hooks/usePokemonUsage'
import { usePokemonStats } from '@/hooks/usePokemonStats'

export default function PokemonUsagePage() {
  const [selectedTier, setSelectedTier] = useState('OU')
  const [selectedGeneration, setSelectedGeneration] = useState('gen9') // Added this
  const [startMonth, setStartMonth] = useState('11')
  const [startYear, setStartYear] = useState('2022')
  const [endMonth, setEndMonth] = useState('02')
  const [endYear, setEndYear] = useState('2024')
  const [activePreset, setActivePreset] = useState<number>(5)

  const handlePresetClick = (top: number) => {
    if (top === activePreset) return
    setActivePreset(top)
  }

  const { selectedPokemon, chartData, loading: usageLoading } = usePokemonUsage({
    selectedTier,
    selectedGeneration, // Added this
    startMonth,
    startYear,
    endMonth,
    endYear,
    activePreset
  })

  const { statsData, loading: statsLoading } = usePokemonStats(selectedPokemon)

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
          selectedGeneration={selectedGeneration} // Added this
          setSelectedGeneration={setSelectedGeneration} // Added this
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

        <StatsTable 
          loading={statsLoading}
          statsData={statsData}
        />
      </div>
    </ScrollArea>
  )
}