import { NextResponse } from 'next/server'

// Special cases mapping for Pokemon names
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
}

// Forms that should be stripped to base form
const formSuffixesToRemove = [
  'Silvally-',
  'Arceus-',
  'Genesect-',
]

// Regional form mappings
const regionalForms = {
  'Alolan': 'alola',
  'Galarian': 'galar',
  'Hisuian': 'hisui',
  'Paldean': 'paldea'
}

function formatPokemonNameForApi(name: string): string {
  // Check special cases first
  if (specialCases[name]) {
    return specialCases[name]
  }

  // Handle forms that need to be removed
  for (const prefix of formSuffixesToRemove) {
    if (name.startsWith(prefix)) {
      return prefix.slice(0, -1).toLowerCase()
    }
  }

  // Handle regional forms
  for (const [form, region] of Object.entries(regionalForms)) {
    if (name.includes(form)) {
      const baseName = name.split('-')[0].toLowerCase()
      return `${baseName}-${region}`
    }
  }

  // Default formatting: lowercase and replace spaces with hyphens
  let formattedName = name.toLowerCase().replace(/\s+/g, '-')
  
  // Remove special characters except hyphens
  formattedName = formattedName.replace(/[^a-z0-9-]/g, '')

  return formattedName
}

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const pokemonName = params.name
    if (!pokemonName) {
      return NextResponse.json(
        { error: 'Pokemon name is required' },
        { status: 400 }
      )
    }

    const formattedName = formatPokemonNameForApi(pokemonName)
    
    // Try to fetch the Pokemon data with the formatted name
    let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${formattedName}`)
    
    // If not found, try with the base form
    if (!response.ok) {
      const baseName = pokemonName.split('-')[0].toLowerCase()
      response = await fetch(`https://pokeapi.co/api/v2/pokemon/${baseName}`)
      
      if (!response.ok) {
        console.warn(`Pokemon data not found for ${pokemonName} (tried: ${formattedName} and ${baseName})`)
        return NextResponse.json(
          { error: 'Pokemon not found' },
          { status: 404 }
        )
      }
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      name: pokemonName,
      sprite: data.sprites.front_default || '',
      types: data.types.map((t: any) => t.type.name)
    })

  } catch (error) {
    console.error('Error fetching Pokemon sprite:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Pokemon sprite' },
      { status: 500 }
    )
  }
}