import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api'
import { z } from 'zod'  

const POKEMON_FORM_MAPPING: Record<string, string[]> = {
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

// Query parameter validation schema that makes all fields optional
const querySchema = z.object({
  battle_format: z.string().optional(),
  generation: z.string().optional(),
}).optional();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters if they exist
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams);
    
    // Build where clause only if parameters exist
    const where: any = {};
    if (Object.keys(params).length > 0) {
      const query = querySchema.parse(params);
      if (query?.battle_format) where.battle_format = query.battle_format;
      if (query?.generation) where.generation = query.generation;
    }

    // Get distinct Pokemon names that match the criteria
    const uniquePokemon = await prisma.pokemonBase.findMany({
      where,
      distinct: ['name'],
      select: { name: true },
      orderBy: { name: 'asc' }
    });
    
    // Transform the Pokemon list to include all forms and remove duplicates
    const expandedPokemonSet = new Set(
      uniquePokemon.flatMap(pokemon => {
        const baseName = pokemon.name.toLowerCase();
        // If the Pokemon has specific forms in our mapping, use those
        if (POKEMON_FORM_MAPPING[baseName]) {
          return POKEMON_FORM_MAPPING[baseName];
        }
        // Otherwise just use the base name
        return [baseName];
      })
    );

    // Convert Set back to sorted array
    const sortedList = Array.from(expandedPokemonSet).sort((a, b) => a.localeCompare(b));
    
    return successResponse(sortedList);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid parameters provided');
    }
    return errorResponse(`Failed to fetch Pokemon list: ${error.message}`);
  }
}