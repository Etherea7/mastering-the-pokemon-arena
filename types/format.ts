export interface FormatUsageResponse {
    data: {
        name: string;
        usage_percent: number;
        raw_count: number;
        rank?: number;
        real_count?: number;
        year_month?: string;
    }[];
}

export const BATTLE_FORMATS = {
SMOGON: ['ou', 'uu', 'ru', 'nu', 'pu'] as const,
VGC: ['vgc2024reggbo3', 'vgc2024regf', 'vgc2024regg', 'vgc2024regfbo3'] as const
} as const;

export const GENERATIONS = ['gen9', 'gen8', 'gen7', 'gen6', 'gen5', 'gen4', 'gen3','gen2','gen1'] as const;

// Derive types from the constants
export type SmogonFormat = (typeof BATTLE_FORMATS.SMOGON)[number];
export type VGCFormat = (typeof BATTLE_FORMATS.VGC)[number];
export type BattleFormat = SmogonFormat | VGCFormat;
export type Generation = (typeof GENERATIONS)[number];

export interface FormatPokemonData {
    name: string;
    types: string[];
    sprite: string;
    usage_percent: number;
    raw_count: number;
    rank?: number;
    real_count?: number;
    year_month?: string;
}

export interface PokemonSpriteData {
    name: string;
    sprite: string;
    types: string[];
    stats: {
      hp: number;
      attack: number;
      defense: number;
      special_attack: number;
      special_defense: number;
      speed: number;
    };
  }