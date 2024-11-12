import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const successResponse = (data: any) => NextResponse.json(data);
const errorResponse = (message: string, status = 400) => 
  NextResponse.json({ error: message }, { status });

const querySchema = z.object({
  generation: z.string(),
  battle_format: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
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
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
    });

    let whereClause: any = {
      name: params.name,
      generation: query.generation,
      battle_format: query.battle_format,
    };

    // Add date range if provided
    if (query.start_date || query.end_date) {
      whereClause.year_month = {};
      if (query.start_date) whereClause.year_month.gte = query.start_date;
      if (query.end_date) whereClause.year_month.lte = query.end_date;
    }

    const teammates = await prisma.pokemonTeammates.findMany({
      where: whereClause,
      select: {
        teammate: true,
        usage: true,
        year_month: true
      },
      orderBy: {
        usage: 'desc'
      }
    });

    // Group by teammate and take highest usage
    const teammateMap = new Map();
    teammates.forEach(t => {
      if (!teammateMap.has(t.teammate) || teammateMap.get(t.teammate).usage < t.usage) {
        teammateMap.set(t.teammate, {
          name: t.teammate,
          usage: t.usage ? Number(t.usage.toFixed(2)) : 0,
          year_month: t.year_month
        });
      }
    });

    // Convert map to array and sort by usage
    const uniqueTeammates = Array.from(teammateMap.values())
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    return successResponse({
      pokemon: params.name,
      generation: query.generation,
      battle_format: query.battle_format,
      date_range: {
        start: query.start_date || 'any',
        end: query.end_date || 'any'
      },
      teammates: uniqueTeammates
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid parameters provided', 400);
    }
    return errorResponse('Failed to fetch teammate data: ' + (error as Error).message, 500);
  }
}
