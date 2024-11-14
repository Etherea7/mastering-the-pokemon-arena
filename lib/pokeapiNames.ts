// utils/pokemon-name.ts

// Special cases mapping for Pokemon names
export const POKEMON_NAME_SPECIAL_CASES: { [key: string]: string } = {
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
    'Tatsugiri': 'tatsugiri-curly',
    'Thundurus': 'thundurus-incarnate',
    'Tornadus': 'tornadus-incarnate',
    'Enamorus': 'enamorus-incarnate',
    'Keldeo': 'keldeo-ordinary',
    'Shaymin': 'shaymin-land',
    'Meloetta': 'meloetta-aria',
    'Maushold': 'maushold-family-of-four',
    'Maushold-Four': 'maushold-family-of-four',
    'Maushold-Three': 'maushold-family-of-three',
    'Squawkabilly': 'squawkabilly-green-plumage',
    'Squawkabilly-Green': 'squawkabilly-green-plumage',
    'Squawkabilly-Blue': 'squawkabilly-blue-plumage',
    'Squawkabilly-Yellow': 'squawkabilly-yellow-plumage',
    'Squawkabilly-White': 'squawkabilly-white-plumage',
  };
  
  // Helper function to format Pokemon names for API calls
  export function formatPokemonNameForApi(name: string): string {
    // Check special cases first
    const specialCase = POKEMON_NAME_SPECIAL_CASES[name];
    if (specialCase) {
      return specialCase;
    }
  
    // Default formatting: lowercase and replace spaces with hyphens
    return name.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Helper function to format Pokemon names for display
  export function formatPokemonNameForDisplay(name: string): string {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Helper function to get the base form of a Pokemon name
  export function getPokemonBaseForm(name: string): string {
    return name.split('-')[0].toLowerCase();
  }