import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { commonQuerySchema, errorResponse, successResponse, buildWhereClause } from '@/lib/api'

const pokemonDetailSchema = commonQuerySchema.extend({
  name: z.string(),
});

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = pokemonDetailSchema.parse({
      ...Object.fromEntries(searchParams),
      name: params.name,
    });
    const { name, ...filters } = validatedParams;

    const where = buildWhereClause(filters);
    where.name = name;

    const [base, moves, abilities, items, spreads, teammates, counters] = await Promise.all([
      prisma.pokemonBase.findFirst({ where }),
      prisma.pokemonMoves.findMany({ where, orderBy: { Usage: 'desc' }, take: 10 }),
      prisma.pokemonAbilities.findMany({ where, orderBy: { Usage: 'desc' }, take: 5 }),
      prisma.pokemonItems.findMany({ where, orderBy: { Usage: 'desc' }, take: 5 }),
      prisma.pokemonSpreads.findMany({ where, orderBy: { Usage: 'desc' }, take: 5 }),
      prisma.pokemonTeammates.findMany({ where, orderBy: { Usage: 'desc' }, take: 6 }),
      prisma.pokemonCounters.findMany({ where, orderBy: { Lose_Rate_Against_Opp: 'desc' }, take: 10 }),
    ]);

    return successResponse({
      base,
      moves,
      abilities,
      items,
      spreads,
      teammates,
      counters,
    });
  } catch (error) {
    return errorResponse(`Failed to fetch details for Pokemon: ${params.name}`);
  }
}

