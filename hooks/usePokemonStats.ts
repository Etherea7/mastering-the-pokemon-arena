import { useState, useEffect } from 'react'

interface PokemonStatsData {
  averageUsage: {
    percent: number
    rawCount: number
  }
  topAbility: {
    name: string
    usage: number
  } | null
  topItem: {
    name: string
    usage: number
  } | null
  topTeammate: {
    name: string
    usage: number
  } | null
  bestCounter: {
    name: string
    winRate: number
  } | null
}

interface PokemonStats extends PokemonStatsData {
  pokemon: string
}

export function usePokemonStats(
    selectedPokemon: string[], 
    selectedGeneration: string,
    battleFormat: string,
    rating?: number,
    yearMonthGte?: string,
    yearMonthLte?: string
  ) {
  const [statsData, setStatsData] = useState<PokemonStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedPokemon.length > 0) {
      const fetchStatsData = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
              generation: selectedGeneration,
              battle_format: battleFormat,
              ...(rating !== undefined && { rating: rating.toString() }),
              ...(yearMonthGte && { year_month_gte: yearMonthGte }),
              ...(yearMonthLte && { year_month_lte: yearMonthLte })
            })
          
          const promises = selectedPokemon.map(pokemon =>
            fetch(`/api/pokemon/stats/${pokemon}?${params}`)
              .then(res => res.json())
          )
          
          const results = await Promise.all(promises)
          
          const validResults = results
            .filter(result => result && !result.error)
            .map((result, index) => ({
              pokemon: selectedPokemon[index],
              ...result
            }))
      
          setStatsData(validResults)
        } catch (error) {
          console.error('Error fetching stats data:', error)
          setStatsData([])
        } finally {
          setLoading(false)
        }
      }

      fetchStatsData()
    } else {
      setStatsData([])
      setLoading(false)
    }
  }, [selectedPokemon, selectedGeneration, battleFormat, rating, yearMonthGte, yearMonthLte])

  return { statsData, loading }
}