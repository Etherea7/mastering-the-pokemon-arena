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
  type PokemonSpriteData,
} from "@/types/format";
import FormatStatsTables from "@/components/format/FormToggle";


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
    selectedRating: number | null;  // Add this
  }
  
  const DEFAULT_CONTROLS: FormatControls = {
    selectedFormat: 'ou',
    selectedGeneration: 'gen9',
    selectedRating: 1500  // Default rating threshold
  };

  interface FormatState {
    pokemonData: ExtendedFormatPokemonData[];  // Changed from FormatPokemonData
    loading: boolean;
    error: string | null;
    progress: {
      current: number;
      total: number;
    };
  }

interface AggregatedUsageData {
  name: string;
  usage_percent: number;
  raw_count: number;
  real_count?: number;
  months_present: number;
  total_months: number;
}


const INITIAL_STATE: FormatState = {
  pokemonData: [],
  loading: true,
  error: null,
  progress: { current: 0, total: 0 }
};

const CACHE_KEY = 'pokemon-sprite-cache';
const MAX_CONCURRENT_REQUESTS = 50; // Increased from 10



const initializeCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        Object.entries(parsedCache).forEach(([key, value]) => {
          spriteCache.set(key, value as PokemonSpriteData);
        });
      }
    } catch (error) {
      console.warn('Failed to load sprite cache:', error);
    }
  };
  
  // Save cache to localStorage
  const saveCache = () => {
    try {
      const cacheObj = Object.fromEntries(spriteCache.entries());
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('Failed to save sprite cache:', error);
    }
  };
  
  // Concurrent fetch helper
  async function fetchConcurrent<T>(
    items: T[],
    fn: (item: T) => Promise<any>,
    maxConcurrent: number,
    onProgress?: (current: number) => void
  ): Promise<any[]> {
    const results: any[] = [];
    const inProgress = new Set<Promise<void>>();
    const queue = [...items];
    let completed = 0;
  
    async function processItem(item: T) {
      try {
        const result = await fn(item);
        results.push(result);
        completed++;
        onProgress?.(completed);
      } catch (error) {
        console.error('Error processing item:', error);
      }
    }
  
    while (queue.length > 0 || inProgress.size > 0) {
      while (inProgress.size < maxConcurrent && queue.length > 0) {
        const item = queue.shift()!;
        const promise = processItem(item);
        inProgress.add(promise);
        // Remove promise from inProgress when done
        promise.finally(() => inProgress.delete(promise));
      }
      // Wait for at least one promise to complete
      if (inProgress.size > 0) {
        await Promise.race(inProgress);
      }
    }
  
    return results;
  }
// Global sprite cache to persist between re-renders
const spriteCache = new Map<string, PokemonSpriteData>();

export default function FormatAnalysisPage({ isVisible }: { isVisible: boolean }) {
  const [controls, setControls] = useState<FormatControls>(DEFAULT_CONTROLS);
  const [state, setState] = useState<FormatState>(INITIAL_STATE);
  const dataFetchingRef = useRef(false);

  const fetchPokemonSprite = async (name: string): Promise<PokemonSpriteData | null> => {
    try {
      // Check memory cache first
      if (spriteCache.has(name)) {
        console.log(`Cache hit for ${name}`);
        return spriteCache.get(name)!;
      }
  
      console.log(`Fetching sprite data for ${name}...`);
      const response = await fetch(`/api/pokeapi/sprites/${encodeURIComponent(name)}`);
      
      if (!response.ok) {
        console.error(`Sprite fetch failed for ${name}:`, response.status);
        return null;
      }
      
      const data = await response.json();
      console.log(`Received sprite data for ${name}:`, data);
      
      // Validate the data structure
      if (!data.sprite || !Array.isArray(data.types)) {
        console.error(`Invalid sprite data for ${name}:`, data);
        return null;
      }
  
      spriteCache.set(name, data);
      setTimeout(saveCache, 1000);
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch sprite for ${name}:`, error);
      return null;
    }
  };

  const aggregateUsageData = useCallback((data: FormatUsageResponse['data']): AggregatedUsageData[] => {
    const allMonths = new Set(data.map(entry => entry.year_month));
    const totalMonths = allMonths.size;
    const pokemonMap = new Map<string, {
      total_usage: number;
      raw_count: number;
      real_count: number;
      months: Set<string>;
    }>();
  
    // Group by Pokemon and aggregate monthly data
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
        // We need to average the usage here
        usage_percent: stats.total_usage / stats.months.size,  // Fix: Average by months present
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
  
      console.log('Fetching data with params:', Object.fromEntries(params));
  
      const usageResponse = await fetch(`/api/pokemon/usage?${params}`);
      
      if (!usageResponse.ok) {
        console.error('Usage response not OK:', await usageResponse.text());
        throw new Error(`Usage data fetch failed: ${usageResponse.status}`);
      }
  
      const usageData: FormatUsageResponse = await usageResponse.json();
      console.log('Received usage data:', usageData);
  
      if (!usageData.data || !Array.isArray(usageData.data)) {
        console.error('Invalid usage data format:', usageData);
        throw new Error('Invalid usage data format received');
      }
  
      const aggregatedData = aggregateUsageData(usageData.data);
      console.log('Aggregated data:', aggregatedData);
  
      if (aggregatedData.length === 0) {
        throw new Error('No Pokemon data found for these parameters');
      }
  
      setState(prev => ({
        ...prev,
        progress: { 
          current: 0,
          total: aggregatedData.length 
        }
      }));
  
      let completedRequests = 0;
      const processedResults = await fetchConcurrent(
        aggregatedData,
        async (pokemon) => {
          try {
            console.log(`Processing ${pokemon.name}...`);
            const spriteData = await fetchPokemonSprite(pokemon.name);
            
            if (!spriteData) {
              console.warn(`No sprite data returned for ${pokemon.name}`);
              return null;
            }
  
            completedRequests++;
            setState(prev => ({
              ...prev,
              progress: {
                ...prev.progress,
                current: completedRequests
              }
            }));
  
            const result = {
              ...pokemon,
              types: spriteData.types,
              sprite: spriteData.sprite,
              stats: spriteData.stats
            } as ExtendedFormatPokemonData;
  
            console.log(`Successfully processed ${pokemon.name}:`, result);
            return result;
  
          } catch (error) {
            console.error(`Error processing pokemon ${pokemon.name}:`, error);
            return null;
          }
        },
        MAX_CONCURRENT_REQUESTS
      );
  
      const validResults = processedResults.filter((result): result is ExtendedFormatPokemonData => {
        const isValid = result !== null && result.stats !== undefined;
        if (!isValid) {
          console.warn('Invalid result:', result);
        }
        return isValid;
      });
  
      console.log(`Processed ${validResults.length} valid results out of ${aggregatedData.length} total`);
  
      if (validResults.length === 0) {
        throw new Error('Failed to process any Pokemon data');
      }
  
      setState(prev => ({
        ...prev,
        loading: false,
        pokemonData: validResults,
        error: null,
        progress: {
          current: validResults.length,
          total: aggregatedData.length
        }
      }));
  
    } catch (error) {
      console.error('Error in fetchFormatData:', error);
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
  }, [controls.selectedFormat, controls.selectedGeneration, controls.selectedRating, aggregateUsageData]);
  
  // Update the useEffect to handle initial fetch
  useEffect(() => {
    // Only fetch if component is visible and we have valid controls
    if (isVisible && controls.selectedFormat && controls.selectedGeneration) {
      console.log('Initiating data fetch...');
      fetchFormatData();
    }
    
    return () => {
      dataFetchingRef.current = false;
    };
  }, [fetchFormatData, isVisible, controls.selectedFormat, controls.selectedGeneration]);
  
  // Initialize cache on component mount
  useEffect(() => {
    initializeCache();
  }, []);


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