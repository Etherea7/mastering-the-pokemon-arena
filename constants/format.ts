export const BATTLE_FORMATS = {
    SMOGON: ['OU', 'UU', 'RU', 'NU', 'PU'] as const,
    VGC: ['vgc2024reggbo3', 'vgc2024regf', 'vgc2024regg', 'vgc2024regfbo3'] as const
  } as const;
  
  export type SmogonFormat = typeof BATTLE_FORMATS.SMOGON[number];
  export type VGCFormat = typeof BATTLE_FORMATS.VGC[number];
  export type BattleFormat = SmogonFormat | VGCFormat;
  
  export const GENERATIONS = ['gen9', 'gen8', 'gen7', 'gen6', 'gen5', 'gen4', 'gen3','gen2','gen1'] as const;
  export type Generation = typeof GENERATIONS[number];