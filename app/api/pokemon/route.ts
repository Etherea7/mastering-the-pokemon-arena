import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api'

const POKEMON_FORM_MAPPING: Record<string, string[]> = {
  // Mega Evolutions
  'abomasnow': ['abomasnow', 'abomasnow-mega'],
  'absol': ['absol', 'absol-mega'],
  'aerodactyl': ['aerodactyl', 'aerodactyl-mega'],
  'aggron': ['aggron', 'aggron-mega'],
  'alakazam': ['alakazam', 'alakazam-mega'],
  'altaria': ['altaria', 'altaria-mega'],
  'ampharos': ['ampharos', 'ampharos-mega'],
  'banette': ['banette', 'banette-mega'],
  'blastoise': ['blastoise', 'blastoise-mega'],
  'blaziken': ['blaziken', 'blaziken-mega'],
  'charizard': ['charizard', 'charizard-mega-x', 'charizard-mega-y'],
  'garchomp': ['garchomp', 'garchomp-mega'],
  'gardevoir': ['gardevoir', 'gardevoir-mega'],
  'gengar': ['gengar', 'gengar-mega'],
  'gyarados': ['gyarados', 'gyarados-mega'],
  'heracross': ['heracross', 'heracross-mega'],
  'houndoom': ['houndoom', 'houndoom-mega'],
  'kangaskhan': ['kangaskhan', 'kangaskhan-mega'],
  'latias': ['latias', 'latias-mega'],
  'latios': ['latios', 'latios-mega'],
  'lopunny': ['lopunny', 'lopunny-mega'],
  'lucario': ['lucario', 'lucario-mega'],
  'manectric': ['manectric', 'manectric-mega'],
  'mawile': ['mawile', 'mawile-mega'],
  'medicham': ['medicham', 'medicham-mega'],
  'metagross': ['metagross', 'metagross-mega'],
  'mewtwo': ['mewtwo', 'mewtwo-mega-x', 'mewtwo-mega-y'],
  'pidgeot': ['pidgeot', 'pidgeot-mega'],
  'pinsir': ['pinsir', 'pinsir-mega'],
  'rayquaza': ['rayquaza', 'rayquaza-mega'],
  'sableye': ['sableye', 'sableye-mega'],
  'salamence': ['salamence', 'salamence-mega'],
  'sceptile': ['sceptile', 'sceptile-mega'],
  'scizor': ['scizor', 'scizor-mega'],
  'sharpedo': ['sharpedo', 'sharpedo-mega'],
  'slowbro': ['slowbro', 'slowbro-mega'],
  'steelix': ['steelix', 'steelix-mega'],
  'swampert': ['swampert', 'swampert-mega'],
  'tyranitar': ['tyranitar', 'tyranitar-mega'],
  'venusaur': ['venusaur', 'venusaur-mega'],

  // Special Forms
  'aegislash': ['aegislash-shield', 'aegislash-blade'],
  'basculin': ['basculin-red-striped', 'basculin-blue-striped'],
  'burmy': ['burmy-plant', 'burmy-sandy', 'burmy-trash'],
  'cherrim': ['cherrim-overcast', 'cherrim-sunshine'],
  'darmanitan': ['darmanitan-standard', 'darmanitan-zen'],
  'deoxys': ['deoxys-normal', 'deoxys-attack', 'deoxys-defense', 'deoxys-speed'],
  'eiscue': ['eiscue-ice', 'eiscue-noice'],
  'giratina': ['giratina-altered', 'giratina-origin'],
  'gourgeist': ['gourgeist-average', 'gourgeist-small', 'gourgeist-large', 'gourgeist-super'],
  'hoopa': ['hoopa', 'hoopa-unbound'],
  'keldeo': ['keldeo-ordinary', 'keldeo-resolute'],
  'landorus': ['landorus-incarnate', 'landorus-therian'],
  'lycanroc': ['lycanroc-midday', 'lycanroc-midnight', 'lycanroc-dusk'],
  'meloetta': ['meloetta-aria', 'meloetta-pirouette'],
  'mimikyu': ['mimikyu-disguised', 'mimikyu-busted'],
  'morpeko': ['morpeko-full-belly', 'morpeko-hangry'],
  'pumpkaboo': ['pumpkaboo-average', 'pumpkaboo-small', 'pumpkaboo-large', 'pumpkaboo-super'],
  'shaymin': ['shaymin-land', 'shaymin-sky'],
  'thundurus': ['thundurus-incarnate', 'thundurus-therian'],
  'tornadus': ['tornadus-incarnate', 'tornadus-therian'],
  'toxtricity': ['toxtricity-amped', 'toxtricity-low-key'],
  'urshifu': ['urshifu-single-strike', 'urshifu-rapid-strike'],
  'wishiwashi': ['wishiwashi-solo', 'wishiwashi-school'],
  'wormadam': ['wormadam-plant', 'wormadam-sandy', 'wormadam-trash'],
  'zacian': ['zacian-hero', 'zacian-crowned'],
  'zamazenta': ['zamazenta-hero', 'zamazenta-crowned'],
  'zygarde': ['zygarde-50', 'zygarde-10', 'zygarde-complete']
};

export async function GET(request: NextRequest) {
  try {
    const uniquePokemon = await prisma.pokemonBase.findMany({
      distinct: ['name'],
      select: { name: true },
      orderBy: { name: 'asc' }
    });
    
    // Transform the Pokemon list to include all forms
    const expandedPokemonList = uniquePokemon.flatMap(pokemon => {
      const baseName = pokemon.name.toLowerCase();
      // If the Pokemon has specific forms in our mapping, use those
      if (POKEMON_FORM_MAPPING[baseName]) {
        return POKEMON_FORM_MAPPING[baseName];
      }
      // Otherwise just use the base name
      return [baseName];
    });

    // Sort the list alphabetically
    const sortedList = expandedPokemonList.sort((a, b) => a.localeCompare(b));
    
    return successResponse(sortedList);
  } catch (error) {
    return errorResponse(`Failed to fetch Pokemon list: ${error.message}`);
  }
}