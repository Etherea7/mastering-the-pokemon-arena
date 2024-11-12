// Type effectiveness chart
export const TYPE_CHART = {
    normal: {
      weakTo: ['fighting'],
      resistantTo: [],
      immuneTo: ['ghost']
    },
    fire: {
      weakTo: ['water', 'ground', 'rock'],
      resistantTo: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
      immuneTo: []
    },
    water: {
      weakTo: ['electric', 'grass'],
      resistantTo: ['fire', 'water', 'ice', 'steel'],
      immuneTo: []
    },
    electric: {
      weakTo: ['ground'],
      resistantTo: ['electric', 'flying', 'steel'],
      immuneTo: []
    },
    grass: {
      weakTo: ['fire', 'ice', 'poison', 'flying', 'bug'],
      resistantTo: ['water', 'electric', 'grass', 'ground'],
      immuneTo: []
    },
    ice: {
      weakTo: ['fire', 'fighting', 'rock', 'steel'],
      resistantTo: ['ice'],
      immuneTo: []
    },
    fighting: {
      weakTo: ['flying', 'psychic', 'fairy'],
      resistantTo: ['bug', 'rock', 'dark'],
      immuneTo: []
    },
    poison: {
      weakTo: ['ground', 'psychic'],
      resistantTo: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
      immuneTo: []
    },
    ground: {
      weakTo: ['water', 'grass', 'ice'],
      resistantTo: ['poison', 'rock'],
      immuneTo: ['electric']
    },
    flying: {
      weakTo: ['electric', 'ice', 'rock'],
      resistantTo: ['grass', 'fighting', 'bug'],
      immuneTo: ['ground']
    },
    psychic: {
      weakTo: ['bug', 'ghost', 'dark'],
      resistantTo: ['fighting', 'psychic'],
      immuneTo: []
    },
    bug: {
      weakTo: ['fire', 'flying', 'rock'],
      resistantTo: ['grass', 'fighting', 'ground'],
      immuneTo: []
    },
    rock: {
      weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'],
      resistantTo: ['normal', 'fire', 'poison', 'flying'],
      immuneTo: []
    },
    ghost: {
      weakTo: ['ghost', 'dark'],
      resistantTo: ['poison', 'bug'],
      immuneTo: ['normal', 'fighting']
    },
    dragon: {
      weakTo: ['ice', 'dragon', 'fairy'],
      resistantTo: ['fire', 'water', 'electric', 'grass'],
      immuneTo: []
    },
    dark: {
      weakTo: ['fighting', 'bug', 'fairy'],
      resistantTo: ['ghost', 'dark'],
      immuneTo: ['psychic']
    },
    steel: {
      weakTo: ['fire', 'fighting', 'ground'],
      resistantTo: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
      immuneTo: ['poison']
    },
    fairy: {
      weakTo: ['poison', 'steel'],
      resistantTo: ['fighting', 'bug', 'dark'],
      immuneTo: ['dragon']
    }
  };
  
  export interface PokemonType {
    name: string;
    url?: string;
  }
  
  /**
   * Calculate type effectiveness of an attacking move against a defending Pokemon
   * @param attackingType The type of the attacking move
   * @param defendingTypes Array of the defending Pokemon's types
   * @returns Effectiveness multiplier (0, 0.5, 1, 2)
   */
  export function calculateTypeEffectiveness(
    attackingType: string,
    defendingTypes: PokemonType[]
  ): number {
    let effectiveness = 1;
    
    // Convert defending types to array of type names
    const defTypes = defendingTypes.map(t => t.name.toLowerCase());
    
    for (const defType of defTypes) {
      // Check immunities first
      if (TYPE_CHART[defType].immuneTo.includes(attackingType)) {
        return 0;
      }
      
      // Check if defending type is weak to attacking type
      if (TYPE_CHART[defType].weakTo.includes(attackingType)) {
        effectiveness *= 2;
      }
      
      // Check if defending type resists attacking type
      if (TYPE_CHART[defType].resistantTo.includes(attackingType)) {
        effectiveness *= 0.5;
      }
    }
    
    return effectiveness;
  }
  
  /**
   * Calculate type coverage for a team
   * @param teamTypes Array of arrays containing each Pokemon's types
   * @returns Object containing offensive and defensive coverage scores
   */
  export function calculateTeamCoverage(teamTypes: PokemonType[][]): {
    offensive: { [key: string]: number },
    defensive: { [key: string]: number }
  } {
    const coverage = {
      offensive: {} as { [key: string]: number },
      defensive: {} as { [key: string]: number }
    };
    
    // Initialize coverage scores
    Object.keys(TYPE_CHART).forEach(type => {
      coverage.offensive[type] = 0;
      coverage.defensive[type] = 0;
    });
    
    // Calculate offensive coverage
    teamTypes.forEach(pokemonTypes => {
      pokemonTypes.forEach(type => {
        Object.keys(TYPE_CHART).forEach(defType => {
          const effectiveness = calculateTypeEffectiveness(type.name.toLowerCase(), [{ name: defType }]);
          coverage.offensive[defType] = Math.max(coverage.offensive[defType], effectiveness);
        });
      });
    });
    
    // Calculate defensive coverage
    Object.keys(TYPE_CHART).forEach(atkType => {
      let bestResistance = 4; // Worse than any possible effectiveness
      teamTypes.forEach(pokemonTypes => {
        const effectiveness = calculateTypeEffectiveness(atkType, pokemonTypes);
        bestResistance = Math.min(bestResistance, effectiveness);
      });
      coverage.defensive[atkType] = 1 / bestResistance; // Invert so higher is better
    });
    
    return coverage;
  }
  
  // Example usage:
  const exampleTypes = [
    [{ name: "water" }], // Water-type Pokemon
    [{ name: "fire" }, { name: "flying" }], // Fire/Flying Pokemon
    [{ name: "grass" }, { name: "poison" }] // Grass/Poison Pokemon
  ];
  
  const coverage = calculateTeamCoverage(exampleTypes);