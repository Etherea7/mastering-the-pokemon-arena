import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from 'react'


// Type color mapping for type badges
const typeColors: { [key: string]: { bg: string, text: string } } = {
  normal: { bg: "bg-gray-400", text: "text-white" },
  fire: { bg: "bg-red-500", text: "text-white" },
  water: { bg: "bg-blue-500", text: "text-white" },
  electric: { bg: "bg-yellow-400", text: "text-black" },
  grass: { bg: "bg-green-500", text: "text-white" },
  ice: { bg: "bg-blue-200", text: "text-black" },
  fighting: { bg: "bg-red-700", text: "text-white" },
  poison: { bg: "bg-purple-500", text: "text-white" },
  ground: { bg: "bg-amber-600", text: "text-white" },
  flying: { bg: "bg-indigo-300", text: "text-black" },
  psychic: { bg: "bg-pink-500", text: "text-white" },
  bug: { bg: "bg-lime-500", text: "text-white" },
  rock: { bg: "bg-yellow-700", text: "text-white" },
  ghost: { bg: "bg-purple-700", text: "text-white" },
  dragon: { bg: "bg-indigo-600", text: "text-white" },
  dark: { bg: "bg-gray-700", text: "text-white" },
  steel: { bg: "bg-gray-400", text: "text-white" },
  fairy: { bg: "bg-pink-300", text: "text-black" },
}

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

interface StatsTableProps {
  loading: boolean
  statsData: PokemonStats[]
}

// TypeBadge component for consistent type display
function TypeBadge({ type }: { type: string }) {
  const colors = typeColors[type] || { bg: "bg-gray-500", text: "text-white" }
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "ml-1 text-xs capitalize",
        colors.bg,
        colors.text
      )}
    >
      {type}
    </Badge>
  )
}

// PokemonDisplay component for consistent Pokemon display with sprite and types
function PokemonDisplay({ name }: { name: string }) {
  const [spriteData, setSpriteData] = useState<{ spriteUrl: string, types: string[] }>({
    spriteUrl: '',
    types: []
  })

  useEffect(() => {
    const fetchSpriteData = async () => {
      try {
        const response = await fetch(`/api/pokeapi/sprites/${encodeURIComponent(name)}`)
        if (response.ok) {
          const data = await response.json()
          setSpriteData({
            spriteUrl: data.sprite,
            types: data.types
          })
        }
      } catch (error) {
        console.error(`Error fetching sprite data for ${name}:`, error)
      }
    }

    fetchSpriteData()
  }, [name])

  return (
    <div className="flex items-center gap-2">
      {spriteData.spriteUrl && (
        <div className="w-8 h-8 relative flex-shrink-0">
          <Image
            src={spriteData.spriteUrl}
            alt={name}
            fill
            sizes="32px"
            className="pixelated"
            priority
          />
        </div>
      )}
      <div>
        <div className="font-medium">{name}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {spriteData.types.map(type => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>
    </div>
  )
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
                <TableHead className="w-[250px]">Pokemon</TableHead>
                <TableHead className="w-[150px]">Usage</TableHead>
                <TableHead className="w-[200px]">Most Used Ability</TableHead>
                <TableHead className="w-[200px]">Most Used Item</TableHead>
                <TableHead className="w-[250px]">Best Teammate</TableHead>
                <TableHead className="w-[250px]">Top Counter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statsData.map((row) => (
                <TableRow key={row.pokemon}>
                  <TableCell>
                    <PokemonDisplay name={row.pokemon} />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {(row.averageUsage.percent*100).toFixed(2)}%
                        <UsageIndicator value={row.averageUsage.percent} />
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
                      <PokemonDisplay name={row.topTeammate.name} />
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.bestCounter ? (
                      <PokemonDisplay name={row.bestCounter.name} />
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