import { useState, useEffect } from 'react'

interface UsePokemonUsageProps {
  selectedTier: string
  selectedGeneration: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  activePreset: number
  customSelectedPokemon: string[]
  selectionMode: 'preset' | 'custom'
}

export function usePokemonUsage({
  selectedTier,
  selectedGeneration,
  startMonth,
  startYear,
  endMonth,
  endYear,
  activePreset,
  customSelectedPokemon,
  selectionMode
}: UsePokemonUsageProps) {
  // Initialize with empty arrays to prevent undefined
  const [selectedPokemon, setSelectedPokemon] = useState<string[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true)
        
        // If in custom mode and no Pokemon selected, reset data and return
        if (selectionMode === 'custom' && customSelectedPokemon.length === 0) {
          setSelectedPokemon([])
          setChartData([])
          setLoading(false)
          return
        }

        const params = new URLSearchParams({
          battle_format: selectedTier.toLowerCase(),
          generation: selectedGeneration,
          year_month_gte: `${startYear}-${startMonth}`,
          year_month_lte: `${endYear}-${endMonth}`,
        })
        
        const response = await fetch(`/api/pokemon/usage?${params}`)
        const result = await response.json()
        
        if (result.data) {
          // Get all unique months
          const allMonths = [...new Set(result.data.map((item: any) => item.year_month))].sort()
          
          // Filter data by generation
          const generationData = result.data.filter((item: any) => 
            item.generation === selectedGeneration
          )

          let pokemonToDisplay: string[] = []

          if (selectionMode === 'preset') {
            // Calculate averages and get top Pokemon
            const pokemonAverages = generationData.reduce((acc, curr) => {
              if (!acc[curr.name]) {
                acc[curr.name] = {
                  totalUsage: curr.usage_percent,
                  months: 1,
                  monthlyData: { [curr.year_month]: curr.usage_percent }
                }
              } else {
                if (!acc[curr.name].monthlyData[curr.year_month]) {
                  acc[curr.name].totalUsage += curr.usage_percent
                  acc[curr.name].months += 1
                  acc[curr.name].monthlyData[curr.year_month] = curr.usage_percent
                }
              }
              return acc
            }, {} as Record<string, any>)

            const pokemonRankings = Object.entries(pokemonAverages)
              .map(([name, data]) => ({
                name,
                averageUsage: data.totalUsage / data.months,
                monthsPresent: data.months,
                totalMonths: allMonths.length
              }))
              .filter(p => p.monthsPresent >= allMonths.length * 0.5)
              .sort((a, b) => b.averageUsage - a.averageUsage)

            pokemonToDisplay = pokemonRankings
              .slice(0, activePreset)
              .map(p => p.name)
          } else {
            pokemonToDisplay = [...customSelectedPokemon]
          }

          // Ensure we always set an array, even if empty
          setSelectedPokemon(pokemonToDisplay)
          
          // Only transform data if we have Pokemon to display
          if (pokemonToDisplay.length > 0) {
            const transformedData = allMonths.map(month => {
              const monthData = { month }
              pokemonToDisplay.forEach(pokemon => {
                const record = generationData.find(item => 
                  item.name === pokemon && item.year_month === month
                )
                monthData[pokemon] = record ? record.usage_percent : null
              })
              return monthData
            })
            setChartData(transformedData)
          } else {
            setChartData([])
          }
        }
      } catch (error) {
        console.error('Error fetching usage data:', error)
        // Set empty arrays on error
        setSelectedPokemon([])
        setChartData([])
      } finally {
        setLoading(false)
      }
    }
    fetchUsageData()
  }, [selectedTier, selectedGeneration, startMonth, startYear, endMonth, endYear, activePreset, customSelectedPokemon, selectionMode])

  return { selectedPokemon, chartData, loading }
}