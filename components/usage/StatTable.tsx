// hooks/usePokemonStats.ts
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
  }, [selectedPokemon, selectedGeneration, yearMonthGte, yearMonthLte])

  return { statsData, loading }
}

// components/usage/StatTable.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsTableProps {
  loading: boolean
  statsData: PokemonStats[]
}

function UsageIndicator({ value }: { value: number }) {
  if (value*100 > 15) {
    return <ArrowUpIcon className="h-4 w-4 text-green-500" />
  } else if (value*100 < 5) {
    return <ArrowDownIcon className="h-4 w-4 text-red-500" />
  }
  return <MinusIcon className="h-4 w-4 text-yellow-500" />
}

export function StatsTable({ loading, statsData }: StatsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pokemon Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!statsData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pokemon Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Select Pokemon to view their statistics
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pokemon Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Pokemon</TableHead>
                <TableHead className="w-[150px]">Usage</TableHead>
                <TableHead className="w-[200px]">Most Used Ability</TableHead>
                <TableHead className="w-[200px]">Most Used Item</TableHead>
                <TableHead className="w-[200px]">Best Teammate</TableHead>
                <TableHead className="w-[200px]">Top Counter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statsData.map((row) => (
                <TableRow key={row.pokemon}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{row.pokemon}</span>
                      <UsageIndicator value={row.averageUsage.percent} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {(row.averageUsage.percent*100).toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.averageUsage.rawCount.toLocaleString()} battles
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.topAbility ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {row.topAbility.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.topAbility.usage.toFixed(1)}% usage
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.topItem ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {row.topItem.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.topItem.usage.toFixed(1)}% usage
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.topTeammate ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {row.topTeammate.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.topTeammate.usage.toFixed(1)}% paired
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.bestCounter ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {row.bestCounter.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.bestCounter.winRate.toFixed(1)}% lose rate
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}