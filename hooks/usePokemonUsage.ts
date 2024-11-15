import { useState, useEffect } from 'react'

interface PokemonUsageData {
  name: string;
  generation: string;
  year_month: string;
  usage_percent: number;
  rank?: number;
  raw_count?: number;
}

interface MonthlyData {
  month: string;
  [pokemonName: string]: string | number | null;
}

interface PokemonAverageData {
  totalUsage: number;
  months: number;
  monthlyData: Record<string, number>;
}

interface UsePokemonUsageProps {
  selectedTier: string;
  selectedGeneration: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  activePreset: number;
  customSelectedPokemon: string[];
  selectionMode: 'preset' | 'custom';
  rating?: number;
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
  selectionMode,
  rating
}: UsePokemonUsageProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<string[]>([])
  const [chartData, setChartData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true)
        
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
          ...(rating !== undefined && { rating: rating.toString() })
        })
        
        const response = await fetch(`/api/pokemon/usage?${params}`)
        const result = await response.json()
        
        if (result.data) {
          const allMonths = Array.from(new Set(
            (result.data as PokemonUsageData[]).map(item => item.year_month)
          )).sort()
          
          const generationData = (result.data as PokemonUsageData[]).filter(item => 
            item.generation === selectedGeneration
          )

          let pokemonToDisplay: string[] = []

          if (selectionMode === 'preset') {
            const pokemonAverages = generationData.reduce((acc: Record<string, PokemonAverageData>, curr) => {
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
            }, {})

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

          setSelectedPokemon(pokemonToDisplay)
          
          if (pokemonToDisplay.length > 0) {
            const transformedData: MonthlyData[] = allMonths.map(month => {
              const monthData: MonthlyData = { month }
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
        setSelectedPokemon([])
        setChartData([])
      } finally {
        setLoading(false)
      }
    }
    fetchUsageData()
  }, [selectedTier, selectedGeneration, startMonth, startYear, endMonth, endYear, 
      activePreset, customSelectedPokemon, selectionMode, rating])

  return { selectedPokemon, chartData, loading }
}