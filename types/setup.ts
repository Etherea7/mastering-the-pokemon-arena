export interface PokemonSetup {
    ability: string;
    item: string;
    moves: string[];
    nature: Nature;
    evs: EVs;
    stats: PokemonStats;
  }



  interface PokemonStats {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  }
  
export interface EVs {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  }
  
export  interface Nature {
    name: string;
    increased?: keyof PokemonStats;
    decreased?: keyof PokemonStats;
  }
  
export interface AbilityData {
      name: string;
      Ability: string;
      Usage: number;
    }
    
export interface ItemData {
      name: string;
      Item: string;
      Usage: number;
    }
    
export interface MoveData {
      name: string;
      Move: string;
      Usage: number;
    }
    
export interface SpreadData {
      name: string;
      Nature: string;
      hp_ev: number;
      atk_ev: number;
      def_ev: number;
      spatk_ev: number;
      spdef_ev: number;
      spd_ev: number;
      Usage: number;
    }