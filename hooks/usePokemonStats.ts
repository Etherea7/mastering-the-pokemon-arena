import { useState, useEffect } from 'react'

interface PokemonStats {
  pokemon: string
  usage: number | null
  winRate: number | null
}

export function usePokemonStats(selectedPokemon: string[], selectedGeneration: string) { // Added selectedGeneration parameter
  const [statsData, setStatsData] = useState<PokemonStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedPokemon.length > 0) {
      const fetchStatsData = async () => {
        try {
          setLoading(true)
          const promises = selectedPokemon.map(pokemon =>
            fetch(`/api/pokemon/stats/${pokemon}?generation=${selectedGeneration}`)
              .then(res => res.json())
          )
          
          const results = await Promise.all(promises)
          
          const validResults = results
            .filter(result => {
              return result && result.id && result.name
            })
            .map(result => ({
              pokemon: result.name,
              usage: result.raw_count !== undefined ? parseInt(result.raw_count) : null,
              winRate: result.viability_ceiling !== undefined ? parseInt(result.viability_ceiling) : null
            }))
      
          setStatsData(validResults)
        } catch (error) {
          console.error('Error fetching stats data:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchStatsData()
    }
  }, [selectedPokemon, selectedGeneration]) // Added selectedGeneration to dependencies

  return { statsData, loading }
}