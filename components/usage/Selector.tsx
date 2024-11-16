import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePokemonData } from '@/hooks/usePokemonData'
import { typeColors } from '@/constants/gendata'

interface PokemonSelectorProps {
    selectedPokemon: string[]
    onPokemonChange: (pokemon: string[]) => void
    generation: string
    battleFormat: string
    startMonth: string
    startYear: string
    endMonth: string
    endYear: string
    rating?: number  // Added rating
  }

  interface PokemonData {
    name: string;
    usedCount: number;
    types: string[];
    spriteUrl?: string;
    averageUsage?: number;
  }
  
  interface AggregatedStats {
    totalUsage: number;
    totalCount: number;
    realCount: number;
  }
  


// // Helper function to get sprite URL from PokeAPI
// function chunkArray<T>(array: T[], size: number): T[][] {
//     const chunks: T[][] = [];
//     for (let i = 0; i < array.length; i += size) {
//       chunks.push(array.slice(i, i + size));
//     }
//     return chunks;
//   }
  
//   // Helper function to add delay between requests
//   const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
//   // Modified getPokemonSprite function
//   async function getPokemonData(
//     name: string, 
//     signal: AbortSignal,
//     retries = 3
//   ): Promise<{ spriteUrl: string; types: string[] }> {
//     try {
//       const response = await fetch(
//         `/api/pokeapi/sprites/${encodeURIComponent(name)}`,
//         { signal }
//       );
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const data = await response.json();
//       return {
//         spriteUrl: data.sprite,
//         types: data.types
//       };
//     } catch (error: any) {
//       if (error.name === 'AbortError') {
//         throw error; // Re-throw abort errors
//       }
      
//       if (retries > 0) {
//         await delay(1000);
//         return getPokemonData(name, signal, retries - 1);
//       }
//       console.error(`Error fetching Pokemon data for ${name}:`, error);
//       return { spriteUrl: '', types: [] };
//     }
//   }
  
  // TypeBadge component for consistent type display
  function TypeBadge({ type }: { type: string }) {
    const colors = typeColors[type] || { bg: "bg-gray-500", text: "text-white" };
    
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
    );
  }
  
  // Type color mapping
  

export function PokemonSelector({
    selectedPokemon,
    onPokemonChange,
    generation,
    battleFormat,
    startMonth,
    startYear,
    endMonth,
    endYear,
    rating
  }: PokemonSelectorProps) {
    const [pokemonList, setPokemonList] = useState<PokemonData[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10


    const { cache, loading: cacheLoading, fetchPokemonBatch } = usePokemonData()

    useEffect(() => {
        let isMounted = true;

        const fetchPokemonList = async () => {
          if (!generation || !battleFormat) return;
          
          try {
            setLoading(true);
            const params = new URLSearchParams({
              battle_format: battleFormat.toLowerCase(),
              generation: generation,
              year_month_gte: `${startYear}-${startMonth}`,
              year_month_lte: `${endYear}-${endMonth}`,
              ...(rating !== undefined && { rating: rating.toString() }),
            });

            const response = await fetch(`/api/pokemon/usage?${params}`);
            const result = await response.json();
            
            if (!isMounted) return;

            if (result.data && Array.isArray(result.data)) {
              const aggregatedData = result.data.reduce((acc: Map<string, AggregatedStats>, item: any) => {
                if (!acc.has(item.name)) {
                  acc.set(item.name, {
                    totalUsage: item.usage_percent || 0,
                    totalCount: 1,
                    realCount: item.real_count || 0
                  });
                } else {
                  const current = acc.get(item.name)!;
                  acc.set(item.name, {
                    totalUsage: current.totalUsage + (item.usage_percent || 0),
                    totalCount: current.totalCount + 1,
                    realCount: current.realCount + (item.real_count || 0)
                  });
                }
                return acc;
              }, new Map<string, AggregatedStats>());
              
              const topPokemon = Array.from(aggregatedData.entries() as [string, AggregatedStats][])
                .map(([name, stats]) => {
                  const cachedData = cache[name];
                  return {
                    name,
                    usedCount: stats.realCount,
                    averageUsage: stats.totalUsage / stats.totalCount,
                    types: cachedData?.types || [],
                    spriteUrl: cachedData?.sprite
                  };
                })
                .sort((a, b) => (b.averageUsage || 0) - (a.averageUsage || 0))
                .slice(0, 200);

              setPokemonList(topPokemon);

              // Fetch data for uncached Pokemon
              const uncachedPokemon = topPokemon
                .filter(p => !cache[p.name])
                .map(p => p.name);

              if (uncachedPokemon.length > 0) {
                await fetchPokemonBatch(
                  uncachedPokemon,
                  (current, total) => {
                    // Progress callback if needed
                  }
                );

                // Update the list with cached data
                if (isMounted) {
                  setPokemonList(prevList => 
                    prevList.map(pokemon => ({
                      ...pokemon,
                      types: cache[pokemon.name]?.types || pokemon.types,
                      spriteUrl: cache[pokemon.name]?.sprite || pokemon.spriteUrl
                    }))
                  );
                }
              }
            }
          } catch (error) {
            console.error('Error fetching Pokemon list:', error);
            if (isMounted) setPokemonList([]);
          } finally {
            if (isMounted) setLoading(false);
          }
        };

    fetchPokemonList();

    return () => {
      isMounted = false;
    };
  }, [generation, battleFormat, startMonth, startYear, endMonth, endYear, rating, cache, fetchPokemonBatch]);
      
      

  const togglePokemon = (pokemonName: string) => {
    if (selectedPokemon.includes(pokemonName)) {
      onPokemonChange(selectedPokemon.filter(p => p !== pokemonName))
    } else if (selectedPokemon.length < 10) {
      onPokemonChange([...selectedPokemon, pokemonName])
    }
  }

  const filteredPokemon = pokemonList.filter(pokemon => 
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredPokemon.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPokemon = filteredPokemon.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-4">
      {/* Selected Pokemon Badges */}
      <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
        {selectedPokemon.map(pokemon => {
          const pokemonData = pokemonList.find(p => p.name === pokemon)
          return (
            <Badge 
              key={pokemon} 
              variant="secondary"
              className="text-sm flex items-center gap-1"
            >
              {pokemonData?.spriteUrl && (
                <Image
                  src={pokemonData.spriteUrl}
                  alt={pokemon}
                  width={20}
                  height={20}
                  className=""
                />
              )}
              {pokemon}
              <button
                type="button"
                className="ml-1 ring-offset-background hover:bg-muted rounded-full"
                onClick={() => togglePokemon(pokemon)}
              >
                ×
              </button>
            </Badge>
          )
        })}
      </div>

      {/* Search Input */}
      <Input
        placeholder="Search Pokemon..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setCurrentPage(1)
        }}
        className="mb-4"
      />

      {/* Pokemon List */}
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Pokemon</TableHead>
                <TableHead className="w-[300px]">Types</TableHead>
                <TableHead className="text-right">Used Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPokemon.map((pokemon) => (
                <TableRow 
                  key={pokemon.name}
                  className={`cursor-pointer hover:bg-muted transition-colors ${
                    selectedPokemon.includes(pokemon.name) ? 'bg-muted' : ''
                  }`}
                  onClick={() => togglePokemon(pokemon.name)}
                >
                  <TableCell className="flex items-center gap-2">
                    {pokemon.spriteUrl && (
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <Image
                          src={pokemon.spriteUrl}
                          alt={pokemon.name}
                          fill
                          sizes="32px"
                          className=""
                          priority
                        />
                      </div>
                    )}
                    <span>{pokemon.name}</span>
                   
                  </TableCell>
                  <TableCell>
                  {pokemon.types.map(type => (
                      <TypeBadge key={type} type={type} />
                    ))}
                  </TableCell>
                  <TableCell className="text-right">
                    {pokemon.usedCount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                const nearCurrent = Math.abs(page - currentPage) <= 1
                const isFirstOrLast = page === 1 || page === totalPages
                return nearCurrent || isFirstOrLast
              })
              .map((page, index, array) => {
                const showEllipsis = index > 0 && page - array[index - 1] > 1

                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </div>
                )
              })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Max Selection Warning */}
      {selectedPokemon.length >= 10 && (
        <p className="text-sm text-muted-foreground">
          Maximum of 10 Pokemon selected
        </p>
      )}
    </div>
  )
}