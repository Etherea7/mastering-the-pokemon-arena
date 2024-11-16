import { prisma } from '@/lib/prisma';
import { pokemonSpecificSchema, errorResponse, successResponse, buildWhereClause, commonQuerySchema } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = commonQuerySchema.parse(Object.fromEntries(searchParams));
    const name = searchParams.get('name');

    const where = buildWhereClause(validatedParams);
    if (name) where.name = name;

    const data = await prisma.pokemonMoves.findMany({
      where,
      select: {
        name: true,
        move: true,
        usage: true,
      },
      orderBy: {
        usage: 'desc',
      },
    });

    return successResponse({ data });
  } catch (error) {
    return errorResponse('Failed to fetch Pokemon moves data');
  }
}