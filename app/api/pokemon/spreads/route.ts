import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, buildSpreadWhereClause, pokemonSpreadSpecificSchema } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = pokemonSpreadSpecificSchema.parse(Object.fromEntries(searchParams));
    const { name, ...filters } = validatedParams;

    const where = buildSpreadWhereClause(filters);
    if (name) where.name = name;

    const data = await prisma.pokemonSpreads.findMany({
      where,
      select: {
        name: true,
        Nature: true,
        hp_ev: true,
        atk_ev: true,
        def_ev: true,
        spatk_ev: true,
        spdef_ev: true,
        spd_ev: true,
        Usage: true,
      },
      orderBy: {
        Usage: 'desc',
      },
    });

    return successResponse({ data });
  } catch (error) {
    return errorResponse('Failed to fetch Pokemon spreads data');
  }
}