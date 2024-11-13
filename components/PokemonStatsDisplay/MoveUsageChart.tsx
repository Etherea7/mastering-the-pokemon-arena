import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MoveUsageData {
  year_month: string;
  usage: number;
}

interface MoveUsageChartProps {
  pokemonName: string;
  generation: string;
  format: string;
}

export default function MoveUsageChart({ pokemonName, generation, format }: MoveUsageChartProps) {
  const [data, setData] = useState<MoveUsageData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMoveUsage() {
      if (!pokemonName || !generation || !format) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/pokemon/moves/aggregate?move=${encodeURIComponent(pokemonName)}&generation=${encodeURIComponent(
            generation
          )}&format=${encodeURIComponent(format)}`
        );
        const result = await res.json();
        setData(result.data);
      } catch (error) {
        console.error('Failed to fetch move usage data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMoveUsage();
  }, [pokemonName, generation, format]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Move Usage Over Time: {pokemonName}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year_month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="usage" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

