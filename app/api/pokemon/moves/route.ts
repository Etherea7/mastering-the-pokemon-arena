import { prisma } from '@/lib/prisma'
import { commonQuerySchema, errorResponse, successResponse, getPaginationParams, buildWhereClause } from '@/lib/api'
import { z } from 'zod'

const moveQuerySchema = commonQuerySchema.extend({
  name: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = moveQuerySchema.parse(Object.fromEntries(searchParams));
    const { pagination, filters } = getPaginationParams(params);

    // Start with base where clause
    const where = buildWhereClause(filters);
    
    // Only add name filter if it's provided
    if (params.name) {
      where.name = params.name;
    }

    // If querying for a specific Pokemon, take the top moves
    const take = params.name ? 10 : pagination.take;

    const [data, total] = await Promise.all([
      prisma.pokemonMoves.findMany({
        where,
        orderBy: { usage: 'desc' },
        take,
        skip: params.name ? 0 : pagination.skip, // Skip pagination if querying specific Pokemon
      }),
      prisma.pokemonMoves.count({
        where,
      }),
    ]);

    return successResponse({
      data,
      pagination: {
        total,
        take,
        skip: params.name ? 0 : pagination.skip,
      },
    });
  } catch (error) {
    console.error('Error in pokemon/moves route:', error);
    return errorResponse('Failed to fetch Pokemon moves data');
  }
}