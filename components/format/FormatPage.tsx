'use client'

import { useEffect, useState, useCallback, useRef } from "react";
import { FormatTypeChart } from "@/components/format/FormatTypeAnalysis";
import FormatParallelAnalysis from "@/components/format/FormatParallelAnalysis";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BATTLE_FORMATS, 
  GENERATIONS,
  type BattleFormat,
  type Generation,
  type FormatPokemonData,
  type FormatUsageResponse,
} from "@/types/format";
import FormatStatsTables from "@/components/format/FormToggle";
import { usePokemonData } from '@/hooks/usePokemonData';

interface ExtendedFormatPokemonData extends FormatPokemonData {
  stats?: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
}

interface FormatControls {
  selectedFormat: BattleFormat;
  selectedGeneration: Generation;
  selectedRating: number | null;
}

const DEFAULT_CONTROLS: FormatControls = {
  selectedFormat: 'ou',
  selectedGeneration: 'gen9',
  selectedRating: 1500
};

interface FormatState {
  pokemonData: ExtendedFormatPokemonData[];
  loading: boolean;
  error: string | null;
  progress: {
    current: number;
    total: number;
  };
}

const INITIAL_STATE: FormatState = {
  pokemonData: [],
  loading: true,
  error: null,
  progress: { current: 0, total: 0 }
};


export default function FormatAnalysisPage({ isVisible }: { isVisible: boolean }) {
  const [controls, setControls] = useState<FormatControls>(DEFAULT_CONTROLS);
  const [state, setState] = useState<FormatState>(INITIAL_STATE);
  const dataFetchingRef = useRef(false);

  const { cache, fetchPokemonBatch } = usePokemonData();

  const aggregateUsageData = useCallback((data: FormatUsageResponse['data']) => {
    const allMonths = new Set(data.map(entry => entry.year_month));
    const totalMonths = allMonths.size;
    const pokemonMap = new Map<string, {
      total_usage: number;
      raw_count: number;
      real_count: number;
      months: Set<string>;
    }>();

    data.forEach(entry => {
      if (!pokemonMap.has(entry.name)) {
        pokemonMap.set(entry.name, {
          total_usage: 0,
          raw_count: 0,
          real_count: 0,
          months: new Set(),
        });
      }

      const stats = pokemonMap.get(entry.name)!;
      stats.total_usage += entry.usage_percent || 0;
      stats.raw_count += entry.raw_count || 0;
      if (entry.real_count) stats.real_count += entry.real_count;
      if (entry.year_month) stats.months.add(entry.year_month);
    });

    return Array.from(pokemonMap.entries())
      .map(([name, stats]) => ({
        name,
        usage_percent: stats.total_usage / stats.months.size,
        raw_count: stats.raw_count,
        real_count: stats.real_count,
        months_present: stats.months.size,
        total_months: totalMonths
      }))
      .filter(pokemon => pokemon.months_present >= totalMonths * 0.5)
      .sort((a, b) => b.usage_percent - a.usage_percent);
  }, []);

  const fetchFormatData = useCallback(async () => {
    if (dataFetchingRef.current) return;
    
    try {
      dataFetchingRef.current = true;
      
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        progress: { current: 0, total: 0 } 
      }));

      const params = new URLSearchParams({
        battle_format: controls.selectedFormat.toLowerCase(),
        generation: controls.selectedGeneration,
        ...(controls.selectedRating && { rating: controls.selectedRating.toString() })
      });

      const usageResponse = await fetch(`/api/pokemon/usage?${params}`);
      
      if (!usageResponse.ok) {
        throw new Error(`Usage data fetch failed: ${usageResponse.status}`);
      }

      const usageData: FormatUsageResponse = await usageResponse.json();
      const aggregatedData = aggregateUsageData(usageData.data);

      if (aggregatedData.length === 0) {
        throw new Error('No Pokemon data found for these parameters');
      }

      setState(prev => ({
        ...prev,
        progress: { current: 0, total: aggregatedData.length }
      }));

      // Filter out Pokemon that need sprite/type data
      const uncachedPokemon = aggregatedData
        .map(p => p.name)
        .filter(name => !cache[name]);

      // Fetch data for uncached Pokemon
      if (uncachedPokemon.length > 0) {
        await fetchPokemonBatch(
          uncachedPokemon,
          (current, total) => {
            setState(prev => ({
              ...prev,
              progress: { current, total }
            }));
          }
        );
      }

      // Create final Pokemon data array using cached data
      const processedResults = aggregatedData.map(pokemon => {
        const cachedData = cache[pokemon.name];
        return {
          ...pokemon,
          types: cachedData?.types || [],
          sprite: cachedData?.sprite,
          stats: cachedData?.stats
        } as ExtendedFormatPokemonData;
      });

      setState(prev => ({
        ...prev,
        loading: false,
        pokemonData: processedResults,
        error: null,
        progress: {
          current: processedResults.length,
          total: aggregatedData.length
        }
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch format data',
        loading: false,
        pokemonData: [],
        progress: { current: 0, total: 0 }
      }));
    } finally {
      dataFetchingRef.current = false;
    }
  }, [controls.selectedFormat, controls.selectedGeneration, controls.selectedRating, aggregateUsageData, cache, fetchPokemonBatch]);
  
  // Update the useEffect to handle initial fetch
  useEffect(() => {
    if (isVisible && controls.selectedFormat && controls.selectedGeneration) {
      fetchFormatData();
    }
    
    return () => {
      dataFetchingRef.current = false;
    };
  }, [fetchFormatData, isVisible, controls.selectedFormat, controls.selectedGeneration]);
  
  // Initialize cache on component mount


  const handleFormatChange = useCallback((format: string) => {
    if ([...BATTLE_FORMATS.SMOGON, ...BATTLE_FORMATS.VGC].includes(format as BattleFormat)) {
      setControls(prev => ({ ...prev, selectedFormat: format as BattleFormat }));
    }
  }, []);

  const handleGenerationChange = useCallback((generation: string) => {
    if (GENERATIONS.includes(generation as Generation)) {
      setControls(prev => ({ ...prev, selectedGeneration: generation as Generation }));
    }
  }, []);

  const handleRatingChange = useCallback((rating: number | null) => {
    setControls(prev => ({ ...prev, selectedRating: rating }));
  }, []);

  const formatVGCName = useCallback((format: string) => {
    return format
      .replace('vgc', 'VGC ')
      .replace('reg', 'Series ')
      .replace('bo3', ' (Best of 3)')
      .toUpperCase();
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Format Analysis Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Generation</label>
              <Select
                value={controls.selectedGeneration}
                onValueChange={handleGenerationChange}
                disabled={state.loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Generation" />
                </SelectTrigger>
                <SelectContent>
                  {GENERATIONS.map((gen) => (
                    <SelectItem key={gen} value={gen}>
                      Generation {gen.slice(3)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Format</label>
              <Select
                value={controls.selectedFormat}
                onValueChange={handleFormatChange}
                disabled={state.loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title" disabled>
                    Smogon Formats
                  </SelectItem>
                  {BATTLE_FORMATS.SMOGON.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                  <SelectItem value="title2" disabled>
                    VGC Formats
                  </SelectItem>
                  {BATTLE_FORMATS.VGC.map((format) => (
                    <SelectItem key={format} value={format}>
                      {formatVGCName(format)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <Select
                value={controls.selectedRating?.toString() ?? ''}
                onValueChange={(value) => handleRatingChange(value ? parseInt(value) : null)}
                disabled={state.loading}
            >
                <SelectTrigger>
                <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="">All Ratings</SelectItem>
                {[1500, 1630, 1695, 1760, 1825].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                    {rating}+
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      
      {state.loading && state.progress.total > 0 && (
        <div className="w-full space-y-2">
          <Progress 
            value={(state.progress.current / state.progress.total) * 100} 
          />
          <p className="text-sm text-muted-foreground text-center">
            Loading format data: {state.progress.current} of {state.progress.total} Pokémon
          </p>
        </div>
      )}

      <FormatTypeChart 
        pokemonData={state.pokemonData}
        selectedFormat={controls.selectedFormat}
        selectedGeneration={controls.selectedGeneration}
        onFormatChange={handleFormatChange}
        onGenerationChange={handleGenerationChange}
        loading={state.loading}
      />
      <FormatParallelAnalysis 
        pokemonData={state.pokemonData}
        selectedFormat={controls.selectedFormat}
        loading={state.loading}
      />
      <FormatStatsTables 
        pokemonData={state.pokemonData}
        loading={state.loading}
      />
    </div>
  );
}