import { useState, useEffect } from 'react'

interface UsePokemonUsageProps {
  selectedTier: string
  selectedGeneration: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  activePreset: number
}

export function usePokemonUsage({
  selectedTier,
  selectedGeneration,
  startMonth,
  startYear,
  endMonth,
  endYear,
  activePreset
}: UsePokemonUsageProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<string[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true)
        // Add generation to URL params
        const params = new URLSearchParams({
          battle_format: selectedTier.toLowerCase(),
          generation: selectedGeneration,
          year_month_gte: `${startYear}-${startMonth}`,
          year_month_lte: `${endYear}-${endMonth}`,
        })
        
        console.log('Fetching with params:', params.toString()) // Debug log
        
        const response = await fetch(`/api/pokemon/usage?${params}`)
        const result = await response.json()
        
        if (result.data) {
          // Get all unique months
          const allMonths = [...new Set(result.data.map((item: any) => item.year_month))].sort()
          
          // Filter data by generation first
          const generationData = result.data.filter((item: any) => 
            item.generation === selectedGeneration
          )

          console.log('Filtered generation data count:', generationData.length) // Debug log
          
          // Calculate averages using the filtered data
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
          }, {})
    
          const pokemonRankings = Object.entries(pokemonAverages)
            .map(([name, data]: [string, any]) => ({
              name,
              averageUsage: data.totalUsage / data.months,
              monthsPresent: data.months,
              totalMonths: allMonths.length
            }))
            .filter(p => p.monthsPresent >= allMonths.length * 0.5)
            .sort((a, b) => b.averageUsage - a.averageUsage)
    
          console.log('Pokemon rankings:', pokemonRankings.slice(0, activePreset)) // Debug log
    
          const topPokemon = pokemonRankings
            .slice(0, activePreset)
            .map(p => p.name)
    
          setSelectedPokemon(topPokemon)
          
          const transformedData = allMonths.map(month => {
            const monthData = { month }
            topPokemon.forEach(pokemon => {
              const record = generationData.find(item => 
                item.name === pokemon && item.year_month === month
              )
              monthData[pokemon] = record ? record.usage_percent : null
            })
            return monthData
          })
    
          setChartData(transformedData)
        }
      } catch (error) {
        console.error('Error fetching usage data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsageData()
  }, [selectedTier, selectedGeneration, startMonth, startYear, endMonth, endYear, activePreset])

  return { selectedPokemon, chartData, loading }
}