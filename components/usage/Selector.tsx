import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    name: string
    usedCount: number
    spriteUrl?: string
    types: string[]
  }

// Helper function to get sprite URL from PokeAPI
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  // Helper function to add delay between requests
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  // Modified getPokemonSprite function
  async function getPokemonData(name: string, retries = 3): Promise<{ spriteUrl: string, types: string[] }> {
    try {
      const response = await fetch(`/api/pokeapi/sprites/${encodeURIComponent(name)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        spriteUrl: data.sprite,
        types: data.types
      };
    } catch (error) {
      if (retries > 0) {
        await delay(1000); // Wait 1 second before retrying
        return getPokemonData(name, retries - 1);
      }
      console.error(`Error fetching Pokemon data for ${name}:`, error);
      return { spriteUrl: '', types: [] };
    }
  }
  
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
  };
  

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

    useEffect(() => {
        const fetchPokemonList = async () => {
          if (!generation || !battleFormat) return
          
          try {
            setLoading(true)
            const params = new URLSearchParams({
              battle_format: battleFormat.toLowerCase(),
              generation: generation,
              year_month_gte: `${startYear}-${startMonth}`,
              year_month_lte: `${endYear}-${endMonth}`,
              ...(rating !== undefined && { rating: rating.toString() }),
            })
            const response = await fetch(`/api/pokemon/usage?${params}`)
            const result = await response.json()
            
            if (result.data && Array.isArray(result.data)) {
              // Group by Pokemon name and sum raw_counts
              const pokemonMap = result.data.reduce((acc: Map<string, PokemonData>, item: any) => {
                if (!acc.has(item.name)) {
                  acc.set(item.name, {
                    name: item.name,
                    usedCount: item.real_count || 0,
                    types: []
                  })
                } else {
                  const existing = acc.get(item.name)!
                  acc.set(item.name, {
                    ...existing,
                    usedCount: existing.usedCount + (item.real_count || 0)
                  })
                }
                return acc
              }, new Map())
    
              // Convert to array and sort by usedCount
              const aggregatedPokemon = Array.from(pokemonMap.values())
                .sort((a, b) => b.usedCount - a.usedCount)
    
                setPokemonList(aggregatedPokemon)

                // Fetch sprites in batches
                const BATCH_SIZE = 5;
                const DELAY_BETWEEN_BATCHES = 500; // 500ms delay between batches
                
                const pokemonChunks = chunkArray(aggregatedPokemon, BATCH_SIZE);
                
                for (const chunk of pokemonChunks) {
                  const updatedPokemonData = await Promise.all(
                    chunk.map(async (pokemon) => {
                      const data = await getPokemonData(pokemon.name);
                      return {
                        ...pokemon,
                        spriteUrl: data.spriteUrl,
                        types: data.types
                      };
                    })
                  );
                  
                  setPokemonList(currentList => {
                    const newList = [...currentList];
                    updatedPokemonData.forEach(updatedPokemon => {
                      const index = newList.findIndex(p => p.name === updatedPokemon.name);
                      if (index !== -1) {
                        newList[index] = updatedPokemon;
                      }
                    });
                    return newList;
                  });
                  
                  await delay(DELAY_BETWEEN_BATCHES);
                }
              }
          } catch (error) {
            console.error('Error fetching Pokemon list:', error)
            setPokemonList([])
          } finally {
            setLoading(false)
          }
        }
    
        fetchPokemonList()
      }, [generation, battleFormat, startMonth, startYear, endMonth, endYear, rating])

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
                  className="pixelated"
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
                          className="pixelated"
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