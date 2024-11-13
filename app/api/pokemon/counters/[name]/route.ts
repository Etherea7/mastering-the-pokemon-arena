import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const querySchema = z.object({
  generation: z.string().nullable(),
  battle_format: z.string().nullable(),
  rating: z.coerce.number().int().min(0).optional().nullable(),
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
      rating: searchParams.get('rating'),
    });

    // Format the name with first letter capitalized
    const formattedName = params.name.charAt(0).toUpperCase() + params.name.slice(1).toLowerCase();

    // Get all data for this Pokemon first
    const counters = await prisma.pokemonCounters.findMany({
      where: {
        name: formattedName,
        ...(query.generation && { generation: query.generation }),
        ...(query.battle_format && { battle_format: query.battle_format }),
        ...(query.rating && { rating: query.rating }),
      },
      select: {
        opp_pokemon: true,
        lose_rate_against_opp: true,
        ko_percent: true,
        switch_percent: true,
        year_month: true,
        generation: true,
        battle_format: true,
        mean: true,
        std_dev: true,
      },
      orderBy: [
        { year_month: 'desc' },
        { lose_rate_against_opp: 'desc' },
      ],
    });

    if (counters.length === 0) {
      return NextResponse.json({
        pokemon: formattedName,
        message: "No data found for this Pokemon",
        data: []
      });
    }

    // Get the most recent year_month's data
    const latestYearMonth = counters[0].year_month;
    const latestData = counters.filter(c => c.year_month === latestYearMonth);

    // Get unique generations and formats
    const availableGenerations = [...new Set(counters.map(c => c.generation))];
    const availableFormats = [...new Set(counters.map(c => c.battle_format))];

    const processedCounters = latestData.map(counter => ({
      opp_pokemon: counter.opp_pokemon,
      lose_rate_against_opp: counter.lose_rate_against_opp || 0,
      ko_percent: counter.ko_percent || 0,
      switch_percent: counter.switch_percent || 0,
      mean: counter.mean || 0,
      std_dev: counter.std_dev || 0,
    }));

    return NextResponse.json({
      pokemon: formattedName,
      generation: latestData[0].generation,
      battle_format: latestData[0].battle_format,
      year_month: latestYearMonth,
      available_generations: availableGenerations,
      available_formats: availableFormats,
      data: processedCounters
    });

  } catch (error) {
    console.error('Error details:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters provided', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch counter data', details: String(error) },
      { status: 500 }
    );
  }
}