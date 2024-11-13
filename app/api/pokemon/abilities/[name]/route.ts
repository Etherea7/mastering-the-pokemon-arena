// app/api/pokemon/abilities/[name]/route.ts
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const successResponse = (data: any) => NextResponse.json(data);
const errorResponse = (message: string, status = 400) => 
  NextResponse.json({ error: message }, { status });

const querySchema = z.object({
  generation: z.string(),
  battle_format: z.string(),
});

const capitalizeFirstLetter = (name: string) => {
  return name.split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('-');
};

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      generation: searchParams.get('generation'),
      battle_format: searchParams.get('battle_format'),
    });

    const capitalizedName = capitalizeFirstLetter(params.name);

    const abilities = await prisma.pokemonAbilities.findMany({
      where: {
        name: capitalizedName,
        generation: query.generation,
        battle_format: query.battle_format,
      },
      select: {
        Ability: true,
        Usage: true,
      },
    });

    // Group abilities and calculate average usage
    const abilityMap = abilities.reduce((acc, curr) => {
      if (!acc[curr.Ability]) {
        acc[curr.Ability] = {
          total: 0,
          count: 0
        };
      }
      if (curr.Usage) {
        acc[curr.Ability].total += curr.Usage;
        acc[curr.Ability].count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Convert to array and calculate averages
    const aggregatedAbilities = Object.entries(abilityMap)
      .map(([ability, stats]) => ({
        ability,
        usage: Number((stats.total / stats.count).toFixed(2))
      }))
      .sort((a, b) => b.usage - a.usage); // Sort by usage descending

    return successResponse({
      pokemon: capitalizedName,
      generation: query.generation,
      battle_format: query.battle_format,
      data: aggregatedAbilities
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid parameters provided', 400);
    }
    return errorResponse('Failed to fetch ability data', 500);
  }
}