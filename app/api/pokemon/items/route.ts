import { prisma } from '@/lib/prisma';
import { pokemonSpecificSchema, errorResponse, successResponse, buildWhereClause } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = pokemonSpecificSchema.parse(Object.fromEntries(searchParams));
    const { name, ...filters } = validatedParams;

    const where = buildWhereClause(filters);
    if (name) where.name = name;

    const data = await prisma.pokemonItems.findMany({
      where,
      select: {
        name: true,
        item: true,
        usage: true,
      },
      orderBy: {
        usage: 'desc',
      },
    });

    return successResponse({ data });
  } catch (error) {
    return errorResponse('Failed to fetch Pokemon items data');
  }
}