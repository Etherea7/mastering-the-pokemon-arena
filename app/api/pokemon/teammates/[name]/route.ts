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

    // Get teammates with averaged usage rates
    const teammates = await prisma.pokemonTeammates.groupBy({
      by: ['teammate'],
      where: {
        name: params.name,
        generation: query.generation,
        battle_format: query.battle_format,
      },
      _avg: {
        usage: true,
      },
      orderBy: {
        _avg: {
          usage: 'desc'
        }
      },
      having: {
        usage: {
          _avg: {
            gt: 0  // Filter out zero usage
          }
        }
      }
    });

    // Transform the data to match expected format
    const formattedTeammates = teammates.map(t => ({
      name: t.teammate,
      usage: Number((t._avg.usage || 0).toFixed(2))
    }));

    return successResponse({
      pokemon: params.name,
      generation: query.generation,
      battle_format: query.battle_format,
      teammates: formattedTeammates
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid parameters provided', 400);
    }
    return errorResponse('Failed to fetch teammate data: ' + (error as Error).message, 500);
  }
}