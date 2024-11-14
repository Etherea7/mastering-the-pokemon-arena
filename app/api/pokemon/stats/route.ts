import { prisma } from '@/lib/prisma'
import { commonQuerySchema, errorResponse, successResponse, getPaginationParams, buildWhereClause } from '@/lib/api'

export async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const params = commonQuerySchema.parse(Object.fromEntries(searchParams));
      const { filters } = getPaginationParams(params);
      const where = buildWhereClause(filters);
  
      const [
        totalPokemon,
        totalMoves,
        totalAbilities,
        totalItems,
        mostUsedPokemon,
        mostUsedAbility,
        mostUsedItem,
      ] = await Promise.all([
        prisma.pokemonBase.count({ where }),
        prisma.pokemonMoves.count({ where }),
        prisma.pokemonAbilities.count({ where }),
        prisma.pokemonItems.count({ where }),
        prisma.pokemonUsage.findFirst({
          where,
          orderBy: { usage_percent: 'desc' },
        }),
        prisma.pokemonAbilities.findFirst({
          where,
          orderBy: { Usage: 'desc' },
        }),
        prisma.pokemonItems.findFirst({
          where,
          orderBy: { Usage: 'desc' },
        }),
      ]);
  
      return successResponse({
        statistics: {
          totalPokemon,
          totalMoves,
          totalAbilities,
          totalItems,
          mostUsedPokemon,
          mostUsedAbility,
          mostUsedItem,
        },
      });
    } catch (error) {
      return errorResponse('Failed to fetch Pokemon statistics');
    }
  }