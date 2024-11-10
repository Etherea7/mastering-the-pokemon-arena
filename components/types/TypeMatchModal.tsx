// components/pokemon/TypeMatchModal.tsx
import { useState, useEffect } from 'react';
import { Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle, } from '@/components/ui/dialog';
import Image from 'next/image';

type Pokemon = {
  name: string;
  sprite: string;
};

const TYPE_COLORS = {
    normal: '#A8A878',
    fighting: '#C03028',
    flying: '#A890F0',
    poison: '#A040A0',
    ground: '#E0C068',
    rock: '#B8A038',
    bug: '#A8B820',
    ghost: '#705898',
    steel: '#B8B8D0',
    fire: '#F08030',
    water: '#6890F0',
    grass: '#78C850',
    electric: '#F8D030',
    psychic: '#F85888',
    ice: '#98D8D8',
    dragon: '#7038F8',
    dark: '#705848',
    fairy: '#EE99AC'
  } as const;

interface TypeMatchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTypes: string[];
}

export default function TypeMatchModal({ isOpen, onOpenChange, selectedTypes }: TypeMatchModalProps) {
  const [matchingPokemon, setMatchingPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPokemonByTypes = async () => {
      if (!isOpen || selectedTypes.length === 0) return;
      
      setIsLoading(true);
      try {
        // Fetch all Pokémon of the first type
        const firstTypeResponse = await fetch(`https://pokeapi.co/api/v2/type/${selectedTypes[0]}`);
        const firstTypeData = await firstTypeResponse.json();
        
        let pokemonList = firstTypeData.pokemon.map((p: any) => p.pokemon);
  
        // If there's a second type, filter for Pokémon that have both types
        if (selectedTypes.length === 2) {
          const secondTypeResponse = await fetch(`https://pokeapi.co/api/v2/type/${selectedTypes[1]}`);
          const secondTypeData = await secondTypeResponse.json();
          const secondTypePokemon = new Set(secondTypeData.pokemon.map((p: any) => p.pokemon.name));
          pokemonList = pokemonList.filter((p:any) => secondTypePokemon.has(p.name));
        }
  
        // Fetch details for each Pokémon to get sprites
        const pokemonDetails = await Promise.all(
          pokemonList.map(async (pokemon: any) => {
            const response = await fetch(pokemon.url);
            const data = await response.json();
            return {
              name: data.name,
              sprite: data.sprites.front_default
            };
          })
        );
  
        setMatchingPokemon(pokemonDetails);
      } catch (error) {
        console.error('Error fetching Pokémon:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPokemonByTypes();
  }, [isOpen, selectedTypes]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Pokémon with type: 
                {selectedTypes.map(type => (
                    <span
                        key={type}
                        className="px-3 py-1 rounded m-1"
                        style={{
                        backgroundColor: TYPE_COLORS[type as keyof typeof TYPE_COLORS],
                        color: ['normal', 'flying', 'ground', 'steel', 'fairy'].includes(type) ? '#000' : '#fff'
                        }}
                    >
                        {type}
                    </span>
                ))}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
            {matchingPokemon.map((pokemon) => (
              <div
                key={pokemon.name}
                className="flex flex-col items-center p-2 border rounded-lg bg-white"
              >
                <div className="w-24 h-24 relative">
                  <Image
                    src={pokemon.sprite || '/placeholder.png'}
                    alt={pokemon.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="mt-2 text-sm font-medium capitalize">
                  {pokemon.name.replace(/-/g, ' ')}
                </span>
              </div>
            ))}
            {matchingPokemon.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-8">
                No Pokémon found with this type combination
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}