import { cache } from 'react'
import { prisma } from './prisma';
// Core types based on PokeAPI responses
type PokemonType = {
  slot: number;
  type: {
    name: string;
    url: string;
  };
};

type PokemonAbility = {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
};

type PokemonStat = {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
};

type PokemonMove = {
  move: {
    name: string;
    url: string;
  };
};

type PokemonDetails = {
    basics: PokemonResponse;
    evolution_chain?: EvolutionChainResponse;
    competitive_data?: {
      usage_stats: any;  // from your DB
      common_moves: any[];
      common_abilities: any[];
      common_items: any[];
      common_teammates: any[];
    };
  };
  
  type CompetitiveFilters = {
    generation?: string;
    battle_format?: string;
    rating?: number;
    year_month?: string;
  };


// Added AbilityResponse type
export type AbilityResponse = {
  id: number;
  name: string;
  is_main_series: boolean;
  generation: {
    name: string;
    url: string;
  };
  effect_entries: {
    effect: string;
    short_effect: string;
    language: {
      name: string;
      url: string;
    };
  }[];
  pokemon: {
    is_hidden: boolean;
    pokemon: {
      name: string;
      url: string;
    };
  }[];
};

// Main response types
export type PokemonResponse = {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  abilities: PokemonAbility[];
  types: PokemonType[];
  stats: PokemonStat[];
  sprites: {
    front_default: string;
    // Add other sprite fields as needed
  };
  moves: PokemonMove[];
};

export type TypeResponse = {
  id: number;
  name: string;
  damage_relations: {
    double_damage_from: { name: string; url: string; }[];
    double_damage_to: { name: string; url: string; }[];
    half_damage_from: { name: string; url: string; }[];
    half_damage_to: { name: string; url: string; }[];
    no_damage_from: { name: string; url: string; }[];
    no_damage_to: { name: string; url: string; }[];
  };
  pokemon: {
    pokemon: {
      name: string;
      url: string;
    };
  }[];
};

export type MoveResponse = {
  id: number;
  name: string;
  power: number | null;
  pp: number;
  accuracy: number | null;
  type: {
    name: string;
    url: string;
  };
  damage_class: {
    name: string;
    url: string;
  };
  effect_entries: {
    effect: string;
    short_effect: string;
    language: {
      name: string;
      url: string;
    };
  }[];
};

export type ItemResponse = {
  id: number;
  name: string;
  cost: number;
  effect_entries: {
    effect: string;
    short_effect: string;
    language: {
      name: string;
      url: string;
    };
  }[];
  sprites: {
    default: string;
  };
};

export type EvolutionChainResponse = {
  id: number;
  chain: {
    species: {
      name: string;
      url: string;
    };
    evolves_to: {
      species: {
        name: string;
        url: string;
      };
      evolves_to: {
        species: {
          name: string;
          url: string;
        };
      }[];
    }[];
  };
};




class PokeAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'PokeAPIError';
  }
}

const BASE_URL = 'https://pokeapi.co/api/v2';

// Generic fetch function with error handling
async function fetchFromPokeAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  
  if (!response.ok) {
    throw new PokeAPIError(`Failed to fetch from PokeAPI: ${endpoint}`, response.status);
  }
  
  return response.json();
}

// Cached fetchers using React's cache() function
export const pokeapi = {
  getPokemon: cache(async (nameOrId: string | number): Promise<PokemonResponse> => {
    return fetchFromPokeAPI(`/pokemon/${nameOrId.toString().toLowerCase()}`);
  }),
  
  getType: cache(async (nameOrId: string | number): Promise<TypeResponse> => {
    return fetchFromPokeAPI(`/type/${nameOrId.toString().toLowerCase()}`);
  }),
  
  getMove: cache(async (nameOrId: string | number): Promise<MoveResponse> => {
    return fetchFromPokeAPI(`/move/${nameOrId.toString().toLowerCase()}`);
  }),
  
  getItem: cache(async (nameOrId: string | number): Promise<ItemResponse> => {
    return fetchFromPokeAPI(`/item/${nameOrId.toString().toLowerCase()}`);
  }),
  
  getEvolutionChain: cache(async (id: number): Promise<EvolutionChainResponse> => {
    return fetchFromPokeAPI(`/evolution-chain/${id}`);
  }),

  // Added ability endpoint
  getAbility: cache(async (nameOrId: string | number): Promise<AbilityResponse> => {
    return fetchFromPokeAPI(`/ability/${nameOrId.toString().toLowerCase()}`);
  }),

  // Helper function to merge PokeAPI ability data with your usage stats
  getAbilityWithStats: cache(async (name: string, params: {
    generation?: string;
    battle_format?: string;
    rating?: number;
    year_month?: string;
  }) => {
    const [pokeapiData, usageStats] = await Promise.all([
      pokeapi.getAbility(name),
      prisma.pokemonAbilities.findMany({
        where: {
          ability: name,
          ...params
        },
        orderBy: {
          usage: 'desc'
        }
      })
    ]);

    return {
      ...pokeapiData,
      usage_stats: usageStats
    };
  }),

  // Helper function to merge PokeAPI data with your usage stats
  getPokemonWithStats: cache(async (name: string, params: {
    generation?: string;
    battle_format?: string;
    rating?: number;
    year_month?: string;
  }) => {
    const [pokeapiData, usageStats] = await Promise.all([
      pokeapi.getPokemon(name),
      // Use your existing prisma client query here
      prisma.pokemonBase.findFirst({
        where: {
          name,
          ...params
        }
      })
    ]);

    return {
      ...pokeapiData,
      usage_stats: usageStats
    };
  }),

  getCompletePokemonDetails: cache(async (
    nameOrId: string | number,
    filters?: CompetitiveFilters
  ): Promise<PokemonDetails> => {
    const pokemon = await pokeapi.getPokemon(nameOrId);
    
    // Get evolution chain ID from species URL
    const speciesUrl = pokemon.species?.url;
    const evolutionChainId = speciesUrl ? 
      parseInt(speciesUrl.split('/').filter(Boolean).pop() || '1') : 1;

    const [evolutionChain, competitiveData] = await Promise.all([
      pokeapi.getEvolutionChain(evolutionChainId),
      filters ? getPokemonCompetitiveData(pokemon.name, filters) : undefined
    ]);

    return {
      basics: pokemon,
      evolution_chain: evolutionChain,
      competitive_data: competitiveData
    };
  }),

  getTypeMatchups: cache(async (types: string[]): Promise<{
    weaknesses: string[];
    resistances: string[];
    immunities: string[];
  }> => {
    const typeData = await Promise.all(types.map(type => pokeapi.getType(type)));
    
    const weaknesses = new Set<string>();
    const resistances = new Set<string>();
    const immunities = new Set<string>();

    typeData.forEach(type => {
      type.damage_relations.double_damage_from.forEach(t => weaknesses.add(t.name));
      type.damage_relations.half_damage_from.forEach(t => resistances.add(t.name));
      type.damage_relations.no_damage_from.forEach(t => immunities.add(t.name));
    });

    // Remove contradictions (e.g., if second type resists what first type is weak to)
    weaknesses.forEach(weakness => {
      if (resistances.has(weakness) || immunities.has(weakness)) {
        weaknesses.delete(weakness);
      }
    });

    return {
      weaknesses: Array.from(weaknesses),
      resistances: Array.from(resistances),
      immunities: Array.from(immunities)
    };
  }),

  getMoveDetails: cache(async (
    moveName: string,
    filters?: CompetitiveFilters
  ) => {
    const [moveData, usageStats] = await Promise.all([
      pokeapi.getMove(moveName),
      filters ? prisma.pokemonMoves.findMany({
        where: {
          move: moveName,
          ...filters
        },
        orderBy: {
          usage: 'desc'
        },
        take: 10
      }) : Promise.resolve([])
    ]);

    return {
      ...moveData,
      popular_users: usageStats
    };
  }),

  getAbilityAnalysis: cache(async (
    abilityName: string,
    filters?: CompetitiveFilters
  ) => {
    const [abilityData, usageStats] = await Promise.all([
      pokeapi.getAbility(abilityName),
      filters ? prisma.pokemonAbilities.findMany({
        where: {
          ability: abilityName,
          ...filters
        },
        orderBy: {
          usage: 'desc'
        },
        take: 10
      }) : Promise.resolve([])
    ]);

    return {
      ...abilityData,
      competitive_usage: usageStats
    };
  }),

  findCounterPicks: cache(async (
    pokemonName: string,
    filters: CompetitiveFilters
  ) => {
    const [pokemon, counters] = await Promise.all([
      pokeapi.getPokemon(pokemonName),
      prisma.pokemonCounters.findMany({
        where: {
          name: pokemonName,
          ...filters
        },
        orderBy: {
          lose_rate_against_opp: 'desc'
        },
        take: 10
      })
    ]);

    // Get type matchups for additional analysis
    const typeMatchups = await pokeapi.getTypeMatchups(
      pokemon.types.map(t => t.type.name)
    );

    return {
      pokemon_name: pokemonName,
      types: pokemon.types.map(t => t.type.name),
      type_weaknesses: typeMatchups.weaknesses,
      statistical_counters: counters
    };
  })
};

// Private helper function for competitive data
async function getPokemonCompetitiveData(name: string, filters: CompetitiveFilters) {
  const [
    usage_stats,
    common_moves,
    common_abilities,
    common_items,
    common_teammates
  ] = await Promise.all([
    prisma.pokemonBase.findFirst({
      where: { name, ...filters }
    }),
    prisma.pokemonMoves.findMany({
      where: { name, ...filters },
      orderBy: { usage: 'desc' },
      take: 4
    }),
    prisma.pokemonAbilities.findMany({
      where: { name, ...filters },
      orderBy: { usage: 'desc' },
      take: 2
    }),
    prisma.pokemonItems.findMany({
      where: { name, ...filters },
      orderBy: { usage: 'desc' },
      take: 3
    }),
    prisma.pokemonTeammates.findMany({
      where: { name, ...filters },
      orderBy: { usage: 'desc' },
      take: 5
    })
  ]);

  return {
    usage_stats,
    common_moves,
    common_abilities,
    common_items,
    common_teammates
  };

};