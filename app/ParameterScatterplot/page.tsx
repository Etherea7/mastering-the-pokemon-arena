'use client'

import React, { useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const tierData = {
  'Tier 1': [
    { speed: 10, attack: 20, hp: 100, defence: 15 },
    { speed: 15, attack: 25, hp: 90, defence: 20 },
    { speed: 20, attack: 15, hp: 110, defence: 10 },
    { speed: 12, attack: 18, hp: 95, defence: 18 },
    { speed: 18, attack: 22, hp: 105, defence: 12 },
  ],
  'Tier 2': [
    { speed: 25, attack: 30, hp: 120, defence: 25 },
    { speed: 30, attack: 35, hp: 110, defence: 30 },
    { speed: 35, attack: 25, hp: 130, defence: 20 },
    { speed: 28, attack: 32, hp: 115, defence: 28 },
    { speed: 32, attack: 28, hp: 125, defence: 22 },
  ],
  'Tier 3': [
    { speed: 40, attack: 45, hp: 140, defence: 35 },
    { speed: 45, attack: 40, hp: 150, defence: 30 },
    { speed: 50, attack: 35, hp: 160, defence: 25 },
    { speed: 42, attack: 43, hp: 145, defence: 33 },
    { speed: 48, attack: 38, hp: 155, defence: 28 },
  ],
}

const data = {
  'All Tiers': [...tierData['Tier 1'], ...tierData['Tier 2'], ...tierData['Tier 3']],
  ...tierData
}

const scatterPlotParameters = [
  { label: 'Speed vs Attack', x: 'speed', y: 'attack' },
  { label: 'HP vs Defence', x: 'hp', y: 'defence' },
]

const colors = {
  'Tier 1': "#8884d8",
  'Tier 2': "#82ca9d",
  'Tier 3': "#ffc658"
}

export default function Component() {
  const [selectedTier, setSelectedTier] = useState('All Tiers')
  const [selectedParameter, setSelectedParameter] = useState(scatterPlotParameters[0])

  const handleTierChange = (value: string) => {
    setSelectedTier(value)
  }

  const handleParameterChange = (value: string) => {
    setSelectedParameter(scatterPlotParameters.find(param => param.label === value) || scatterPlotParameters[0])
  }

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen pb-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Character Stats Visualizer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey={selectedParameter.x} 
                  name={selectedParameter.x.toUpperCase()} 
                  label={{ value: selectedParameter.x.toUpperCase(), position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey={selectedParameter.y} 
                  name={selectedParameter.y.toUpperCase()} 
                  label={{ value: selectedParameter.y.toUpperCase(), angle: -90, position: 'insideLeft' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                {selectedTier === 'All Tiers' ? (
                  Object.entries(tierData).map(([tier, tierData]) => (
                    <Scatter 
                      key={tier} 
                      name={tier} 
                      data={tierData} 
                      fill={colors[tier]} 
                    />
                  ))
                ) : (
                  <Scatter name={selectedTier} data={data[selectedTier]} fill={colors[selectedTier] || "#8884d8"} />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {selectedTier === 'All Tiers' && (
            <div className="flex justify-center items-center mt-4 space-x-4">
              {Object.entries(colors).map(([tier, color]) => (
                <div key={tier} className="flex items-center">
                  <div className="w-4 h-4 mr-2" style={{ backgroundColor: color }}></div>
                  <span>{tier}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Display Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tier-select" className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <Select onValueChange={handleTierChange} defaultValue={selectedTier}>
                <SelectTrigger id="tier-select">
                  <SelectValue placeholder="Select a tier" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(data).map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="parameter-select" className="block text-sm font-medium text-gray-700 mb-1">Scatterplot Parameters</label>
              <Select onValueChange={handleParameterChange} defaultValue={selectedParameter.label}>
                <SelectTrigger id="parameter-select">
                  <SelectValue placeholder="Select parameters" />
                </SelectTrigger>
                <SelectContent>
                  {scatterPlotParameters.map((param) => (
                    <SelectItem key={param.label} value={param.label}>
                      {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}