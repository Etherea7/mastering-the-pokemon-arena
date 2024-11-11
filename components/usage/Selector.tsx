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
  }

interface PokemonData {
    name: string
    usedCount: number
    spriteUrl?: string
    types: string[]
  }

// Helper function to get sprite URL from PokeAPI
function formatPokemonNameForApi(name: string): string {
    // Special cases mapping
    const specialCases: { [key: string]: string } = {
      'Tapu Koko': 'tapu-koko',
      'Tapu Lele': 'tapu-lele',
      'Tapu Bulu': 'tapu-bulu',
      'Tapu Fini': 'tapu-fini',
      'Mr. Mime': 'mr-mime',
      'Mr. Mime-Galar': 'mr-mime-galar',
      'Mr. Rime': 'mr-rime',
      'Type: Null': 'type-null',
      'Mime Jr.': 'mime-jr',
      'Nidoran♀': 'nidoran-f',
      'Nidoran♂': 'nidoran-m',
      'Flabébé': 'flabebe',
      'Great Tusk': 'great-tusk',
      'Scream Tail': 'scream-tail',
      'Brute Bonnet': 'brute-bonnet',
      'Flutter Mane': 'flutter-mane',
      'Sandy Shocks': 'sandy-shocks',
      'Iron Treads': 'iron-treads',
      'Iron Bundle': 'iron-bundle',
      'Iron Hands': 'iron-hands',
      'Iron Jugulis': 'iron-jugulis',
      'Iron Moth': 'iron-moth',
      'Iron Thorns': 'iron-thorns',
      'Roaring Moon': 'roaring-moon',
      'Iron Valiant': 'iron-valiant',
      'Walking Wake': 'walking-wake',
      'Iron Leaves': 'iron-leaves',
      'Ting-Lu': 'ting-lu',
      'Chien-Pao': 'chien-pao',
      'Wo-Chien': 'wo-chien',
      'Chi-Yu': 'chi-yu',
      'Tauros-Paldea-Combat': 'tauros-paldean-combat',
      'Tauros-Paldea-Blaze': 'tauros-paldean-blaze',
      'Tauros-Paldea-Aqua': 'tauros-paldean-aqua',
      'Tauros-Paldea-Water': 'tauros-paldean-water',
      'Tauros-Paldea-Fire': 'tauros-paldean-fire',
      'Oinkologne-F': 'oinkologne-female',
      'Meowstic-F': 'meowstic-female',
      'Indeedee-F': 'indeedee-female',
      'Basculegion-F': 'basculegion-female',
      'Ogerpon-Hearthflame': 'ogerpon-hearthflame-mask',
      'Ogerpon-Cornerstone': 'ogerpon-cornerstone-mask',
      'Ogerpon-Wellspring': 'ogerpon-wellspring-mask',
      'Oinkologne': 'oinkologne-male',
      'Meowstic': 'meowstic-male',
      'Indeedee': 'indeedee-male',
      'Basculegion': 'basculegion-male',
      'Basculin': 'basculin-red-striped',
      'Oricorio': 'oricorio-baile',
      'Lycanroc': 'lycanroc-midday',
      'Minior': 'minior-red-meteor',
      'Mimikyu': 'mimikyu-disguised',
      'Toxtricity': 'toxtricity-amped',
      'Eiscue': 'eiscue-ice',
      'Morpeko': 'morpeko-full-belly',
      'Dudunsparce': 'dudunsparce-two-segment',
      'Palafin': 'palafin-zero',
      'Maushold': 'maushold-family4',
      'Squawkabilly': 'squawkabilly-green',
      'Tatsugiri': 'tatsugiri-curly',
      'Thundurus': 'thundurus-incarnate',
      'Tornadus': 'tornadus-incarnate',
      'Enamorus': 'enamorus-incarnate',
      'Keldeo': 'keldeo-ordinary',
      'Shaymin': 'shaymin-land',
      'Meloetta': 'meloetta-aria',
    };
    
    const formSuffixesToRemove = [
        'Silvally-',
        'Arceus-',
        'Genesect-',
      ];

    if (specialCases[name]) {
        return specialCases[name];
    }

    // Handle forms that need to be removed
    for (const prefix of formSuffixesToRemove) {
        if (name.startsWith(prefix)) {
            return prefix.slice(0, -1).toLowerCase();
        }
    }

    // Handle regional forms
    const regionalForms = {
        'Alolan': 'alola',
        'Galarian': 'galar',
        'Hisuian': 'hisui',
        'Paldean': 'paldea'
    };

    for (const [form, region] of Object.entries(regionalForms)) {
        if (name.includes(form)) {
          const baseName = name.split('-')[0].toLowerCase();
          return `${baseName}-${region}`;
        }
      }
    
      // Default formatting: lowercase and replace spaces with hyphens
      let formattedName = name.toLowerCase().replace(/\s+/g, '-');
      
      // Remove special characters except hyphens
      formattedName = formattedName.replace(/[^a-z0-9-]/g, '');
    
      return formattedName;
    // Handle forms and regional variants

  }
  
  // Modified getPokemonSprite function
  async function getPokemonData(name: string): Promise<{ spriteUrl: string, types: string[] }> {
    try {
      const formattedName = formatPokemonNameForApi(name);
      
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${formattedName}`);
      
      if (!response.ok) {
        const baseName = name.split('-')[0].toLowerCase();
        const fallbackResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${baseName}`);
        
        if (!fallbackResponse.ok) {
          console.warn(`Pokemon data not found for ${name} (tried: ${formattedName} and ${baseName})`);
          return { spriteUrl: '', types: [] };
        }
        
        const fallbackData = await fallbackResponse.json();
        return {
          spriteUrl: fallbackData.sprites.front_default || '',
          types: fallbackData.types.map((t: any) => t.type.name)
        };
      }
  
      const data = await response.json();
      return {
        spriteUrl: data.sprites.front_default || '',
        types: data.types.map((t: any) => t.type.name)
      };
    } catch (error) {
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
    endYear
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
    
              // Fetch sprites and types for each Pokemon
              const pokemonWithData = await Promise.all(
                (aggregatedPokemon as PokemonData[]).map(async (pokemon: PokemonData) => {
                  const data = await getPokemonData(pokemon.name)
                  return {
                    ...pokemon,
                    spriteUrl: data.spriteUrl,
                    types: data.types
                  }
                })
              )
    
              setPokemonList(pokemonWithData)
            }
          } catch (error) {
            console.error('Error fetching Pokemon list:', error)
            setPokemonList([])
          } finally {
            setLoading(false)
          }
        }
    
        fetchPokemonList()
      }, [generation, battleFormat, startMonth, startYear, endMonth, endYear])

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