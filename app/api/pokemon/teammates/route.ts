import { prisma } from '@/lib/prisma'
import { commonQuerySchema, errorResponse, successResponse, getPaginationParams, buildWhereClause } from '@/lib/api'

export async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const params = commonQuerySchema.parse(Object.fromEntries(searchParams));
      const { pagination, filters } = getPaginationParams(params);
  
      const [data, total] = await Promise.all([
        prisma.pokemonTeammates.findMany({
          where: buildWhereClause(filters),
          orderBy: { usage: 'desc' },
          ...pagination,
        }),
        prisma.pokemonTeammates.count({
          where: buildWhereClause(filters),
        }),
      ]);
  
      return successResponse({
        data,
        pagination: {
          total,
          ...pagination,
        },
      });
    } catch (error) {
      return errorResponse('Failed to fetch Pokemon teammates data');
    }
  }