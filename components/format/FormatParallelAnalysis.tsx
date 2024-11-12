import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import  FormatUsageChart  from './FormatUsageParallel';
import { FormatStatsChart } from './FormatStatsParallel';
import { FormatPokemonData } from "@/types/format";

interface FormatParallelProps {
  pokemonData: FormatPokemonData[];
  selectedFormat: string;
  loading: boolean;
}

export default function FormatParallelAnalysis({ 
  pokemonData,
  selectedFormat,
  loading 
}: FormatParallelProps) {
  const [activeChart, setActiveChart] = useState<'usage' | 'stats'>('usage');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Format Analysis</CardTitle>
          <Tabs value={activeChart} onValueChange={(value) => setActiveChart(value as 'usage' | 'stats')}>
            <TabsList>
              <TabsTrigger value="usage">Usage Analysis</TabsTrigger>
              <TabsTrigger value="stats">Stats Analysis</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {activeChart === 'usage' ? (
          <FormatUsageChart 
            pokemonData={pokemonData}
            selectedFormat={selectedFormat}
            loading={loading}
          />
        ) : (
          <FormatStatsChart
            pokemonData={pokemonData}
            selectedFormat={selectedFormat}
            loading={loading}
          />
        )}
      </CardContent>
    </Card>
  );
}