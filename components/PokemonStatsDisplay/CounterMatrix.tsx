import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CounterMatrixProps {
  pokemonName: string;
  generation?: string;
  battleFormat?: string;
}

const CounterMatrix = ({ 
  pokemonName,
  generation,
  battleFormat
}: CounterMatrixProps) => {
  const [countersData, setCountersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCounterData() {
      if (!pokemonName) return;
      
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          generation: generation || 'gen9',
          battle_format: battleFormat || 'ou',
        });

        const response = await fetch(`/api/pokemon/counters/${pokemonName}?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch counter data');
        }
        const data = await response.json();
        console.log('Fetched data:', data); // Debug log
        setCountersData(data.data || []);
      } catch (err) {
        console.error('Error fetching counter data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch counter data');
      } finally {
        setLoading(false);
      }
    }

    fetchCounterData();
  }, [pokemonName, generation, battleFormat]);

  if (error) {
    return (
      <Card className="w-full bg-card">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full bg-card">
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-lg text-foreground">Loading counter data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!countersData.length) {
    return (
      <Card className="w-full bg-card">
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-lg text-foreground">No counter data available</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate aggregated data
  const processedData = countersData
    .sort((a, b) => b.lose_rate_against_opp - a.lose_rate_against_opp);

  // Get top 4 strongest counters and weakest matchups
  const strongestCounters = processedData.slice(0, 4);
  const weakestCounters = [...processedData]
    .sort((a, b) => a.lose_rate_against_opp - b.lose_rate_against_opp)
    .slice(0, 4);

  const formatPokemonName = (name) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-center text-foreground">
          {formatPokemonName(pokemonName)} Matchups
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Strong Against (Counters) Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-red-400">
              Strong Counters
            </h3>
            {strongestCounters.map((counter) => (
              <div 
                key={counter.opp_pokemon}
                className="flex items-center justify-between p-2 rounded-lg bg-red-950/50 border border-red-800"
              >
                <span className="font-medium text-foreground">
                  {formatPokemonName(counter.opp_pokemon)}
                </span>
                <div className="text-sm text-right">
                  <div className="text-foreground">Win: {counter.lose_rate_against_opp.toFixed(1)}%</div>
                  <div className="text-muted-foreground">
                    KO: {counter.ko_percent.toFixed(1)}% / Switch: {counter.switch_percent.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Weak Against Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-green-400">
              Weak Matchups
            </h3>
            {weakestCounters.map((counter) => (
              <div 
                key={counter.opp_pokemon}
                className="flex items-center justify-between p-2 rounded-lg bg-green-950/50 border border-green-800"
              >
                <span className="font-medium text-foreground">
                  {formatPokemonName(counter.opp_pokemon)}
                </span>
                <div className="text-sm text-right">
                  <div className="text-foreground">Loss: {counter.lose_rate_against_opp.toFixed(1)}%</div>
                  <div className="text-muted-foreground">
                    KO: {counter.ko_percent.toFixed(1)}% / Switch: {counter.switch_percent.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CounterMatrix;