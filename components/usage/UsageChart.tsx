import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface UsageChartProps {
  loading: boolean
  chartData: any[]
  selectedPokemon: string[]
}

export function UsageChart({ loading, chartData, selectedPokemon }: UsageChartProps) {
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pokemon Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle empty state
  if (!selectedPokemon?.length) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pokemon Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No Pokemon selected. Please select Pokemon to view usage data.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Pokemon Usage Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
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
                offset: 0
              }}
              tickFormatter={(value) => `${value*100}%`}
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
                                {entry.value ? `${(entry.value*100).toFixed(2)}%` : 'No data'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => (
                <span className="text-sm font-medium">{value}</span>
              )}
            />
            {(selectedPokemon || []).map((pokemon, index) => (
              <Line 
                key={pokemon} 
                type="monotone" 
                dataKey={pokemon} 
                stroke={`hsl(${(index * 360) / selectedPokemon.length}, 70%, 50%)`}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}