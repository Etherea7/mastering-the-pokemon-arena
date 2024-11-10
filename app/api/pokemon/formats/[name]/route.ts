import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { commonQuerySchema, errorResponse, successResponse } from '@/lib/api'

const pokemonFormatsSchema = commonQuerySchema.extend({
  name: z.string(),
});

// Route: /api/pokemon/formats/[name]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    // Get the Pokemon name from route params and capitalize first letter
    const name = params.name.charAt(0).toUpperCase() + params.name.slice(1).toLowerCase();

    // Get unique battle formats for this Pokemon
    const formats = await prisma.pokemonBase.findMany({
      where: {
        name: name, // Now using properly capitalized name
      },
      select: {
        battle_format: true,
      },
      distinct: ['battle_format'],
      orderBy: {
        battle_format: 'asc'
      }
    });

    // If no formats found
    if (!formats.length) {
      return errorResponse(`No battle formats found for Pokemon: ${name}`);
    }

    return successResponse({
      pokemon: name,
      formats: formats.map(f => f.battle_format),
      count: formats.length
    });

  } catch (error) {
    return errorResponse('Failed to fetch battle formats');
  }
}