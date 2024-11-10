// app/pokemon-usage/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" // Commented out
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"

const years = ['2023', '2024'];
const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const tiers = ['OU', 'UU', 'RU', 'NU', 'PU'];

export default function PokemonUsagePage() {
  const [selectedTier, setSelectedTier] = useState('OU')
  const [selectedPokemon, setSelectedPokemon] = useState<string[]>([])
  const [startMonth, setStartMonth] = useState('11')
  const [startYear, setStartYear] = useState('2022')
  const [endMonth, setEndMonth] = useState('02')
  const [endYear, setEndYear] = useState('2024')
  const [chartData, setChartData] = useState<any[]>([])
  const [statsData, setStatsData] = useState<any[]>([]) // Commented out
  const [activePreset, setActivePreset] = useState<number>(5)
  const [loading, setLoading] = useState(true)

  // Fetch usage data for chart
  // Keep all your existing imports and constants, but update the fetchUsageData function:

  

  

  // Fetch data when filters change
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          battle_format: selectedTier.toLowerCase(),
          year_month_gte: `${startYear}-${startMonth}`,
          year_month_lte: `${endYear}-${endMonth}`,
        })
        
        console.log('Fetching data for:', selectedTier, 'from:', `${startYear}-${startMonth}`, 'to:', `${endYear}-${endMonth}`)
        
        const response = await fetch(`/api/pokemon/usage?${params}`)
        const result = await response.json()
        
        if (result.data) {
          // Get all unique months
          const allMonths = [...new Set(result.data.map((item: any) => item.year_month))].sort()
          
          // Calculate average usage for each Pokemon across the selected period
          const pokemonAverages = result.data.reduce((acc, curr) => {
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
    
          // Convert to array and calculate true averages
          const pokemonRankings = Object.entries(pokemonAverages)
            .map(([name, data]: [string, any]) => ({
              name,
              averageUsage: data.totalUsage / data.months,
              monthsPresent: data.months,
              totalMonths: allMonths.length
            }))
            // Sort by average usage and filter for Pokemon present in at least half the months
            .filter(p => p.monthsPresent >= allMonths.length * 0.5)
            .sort((a, b) => b.averageUsage - a.averageUsage)
    
          console.log('Top Pokemon average usage across period:', 
            pokemonRankings.slice(0, activePreset)
              .map(p => `${p.name}: ${p.averageUsage.toFixed(2)}% (present in ${p.monthsPresent}/${p.totalMonths} months)`)
          )
    
          // Get top Pokemon names
          const topPokemon = pokemonRankings
            .slice(0, activePreset)
            .map(p => p.name)
    
          setSelectedPokemon(topPokemon)
          
          // Create monthly data points for top Pokemon
          const transformedData = allMonths.map(month => {
            const monthData = { month }
            topPokemon.forEach(pokemon => {
              const record = result.data.find(item => 
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
  }, [selectedTier, startMonth, startYear, endMonth, endYear, activePreset])

  /* stats effect */
  useEffect(() => {
    if (selectedPokemon.length > 0) {
      const fetchStatsData = async () => {
        try {
          setLoading(true)
          const promises = selectedPokemon.map(pokemon =>
            fetch(`/api/pokemon/stats/${pokemon}`).then(res => res.json())
          )
          const results = await Promise.all(promises)
          console.log("Raw API results:", results)
      
          const validResults = results
            .filter(result => {
              return result && result.id && result.name
            })
            .map(result => ({
              pokemon: result.name,
              usage: result.raw_count !== undefined ? parseInt(result.raw_count) : null,
              winRate: result.viability_ceiling !== undefined ? parseInt(result.viability_ceiling) : null
            }))
      
          console.log("Filtered and mapped results:", validResults)
          setStatsData(validResults)
        } catch (error) {
          console.error('Error fetching stats data:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchStatsData()
    }
  }, [selectedPokemon])

  const handlePresetClick = (top: number) => {
    if (top === activePreset) return
    setActivePreset(top)
  }

  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <div className="container mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pokemon Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
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
                  <YAxis 
                    label={{ 
                      value: 'Usage %', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: 10
                    }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border rounded-lg shadow-lg p-3">
                            <p className="font-medium text-sm mb-2">{label}</p>
                            <div className="space-y-1">
                              {payload
                                .sort((a, b) => (b.value as number) - (a.value as number))
                                .map((entry, index) => (
                                  <div 
                                    key={`tooltip-${index}`}
                                    className="flex items-center gap-2"
                                  >
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm font-medium">{entry.name}:</span>
                                    <span className="text-sm">
                                      {entry.value ? `${entry.value.toFixed(2)}%` : 'No data'}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value, entry) => (
                      <span className="text-sm font-medium">{value}</span>
                    )}
                  />
                  {selectedPokemon.map((pokemon, index) => (
                    <Line 
                      key={pokemon} 
                      type="monotone" 
                      dataKey={pokemon} 
                      stroke={`hsl(${(index * 360) / selectedPokemon.length}, 70%, 50%)`}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ 
                        r: 6,
                        onMouseOver: (props) => {
                          // Optional: Add hover effects or interactions
                        }
                      }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
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
                <label className="block mb-2">Start Date</label>
                <div className="flex gap-2">
                  <Select value={startYear} onValueChange={setStartYear}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={startMonth} onValueChange={setStartMonth}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block mb-2">End Date</label>
                <div className="flex gap-2">
                  <Select value={endYear} onValueChange={setEndYear}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={endMonth} onValueChange={setEndMonth}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block mb-2">Preset Options</label>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handlePresetClick(5)} 
                  variant={activePreset === 5 ? "default" : "outline"}
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
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pokemon</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead>Viability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData.map((row, index) => (
                    <TableRow key={row.pokemon} className={index % 2 === 0 ? 'bg-muted' : ''}>
                      <TableCell>{row.pokemon}</TableCell>
                      <TableCell>{row.usage?.toLocaleString() ?? 'N/A'}</TableCell>
                      <TableCell>{row.winRate ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          
      </div>
    </ScrollArea>
  )
}