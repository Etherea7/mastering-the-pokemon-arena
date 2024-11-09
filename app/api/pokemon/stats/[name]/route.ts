import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const pokemonName = params.name;

    if (!pokemonName) {
      return errorResponse('Pokemon name is required');
    }

    const pokemon = await prisma.pokemonBase.findFirst({
      where: {
        name: pokemonName,
      }
    });

    if (!pokemon) {
      console.error(`Pokemon not found: ${pokemonName}`);
      return errorResponse(`Pokemon '${pokemonName}' not found`);
    }

    return successResponse({
      id: pokemon.id,
      name: pokemon.name,
      generation: pokemon.generation,
      battle_format: pokemon.battle_format,
      rating: pokemon.rating,
      raw_count: pokemon.raw_count,
      avg_weight: pokemon.avg_weight,
      viability_ceiling: pokemon.viability_ceiling,
      year_month: pokemon.year_month
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return errorResponse('Failed to fetch Pokemon data');
  }
}
