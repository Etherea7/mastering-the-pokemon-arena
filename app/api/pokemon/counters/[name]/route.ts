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

    // Get all data for this Pokemon
    const counters = await prisma.pokemonCounters.findMany({
      where: {
        name: formattedName,
        ...(query.generation && { generation: query.generation }),
        ...(query.battle_format && { battle_format: query.battle_format }),
        ...(query.rating && { rating: query.rating }),
      },
      select: {
        opp_pokemon: true,
        Lose_Rate_Against_Opp: true,
        KO_Percent: true,
        Switch_Percent: true,
        year_month: true,
        generation: true,
        battle_format: true,
        Mean: true,
        Std_Dev: true,
      },
    });

    if (counters.length === 0) {
      return NextResponse.json({
        pokemon: formattedName,
        message: "No data found for this Pokemon",
        data: []
      });
    }

    // Get unique generations and formats
    const availableGenerations = Array.from(new Set(counters.map(c => c.generation)));
    const availableFormats = Array.from(new Set(counters.map(c => c.battle_format)));

    // Get properly ordered date range
    const dates = counters.map(c => c.year_month).sort();
    const samplePeriod = {
      start: dates[0],
      end: dates[dates.length - 1]
    };

    // Aggregate data by opponent Pokemon
    const aggregatedData = counters.reduce((acc, counter) => {
      const key = counter.opp_pokemon;
      if (!acc[key]) {
        acc[key] = {
          opp_pokemon: key,
          lose_rate_sum: 0,
          ko_percent_sum: 0,
          switch_percent_sum: 0,
          mean_sum: 0,
          std_dev_sum: 0,
          count: 0
        };
      }
      
      acc[key].lose_rate_sum += counter.Lose_Rate_Against_Opp || 0;
      acc[key].ko_percent_sum += counter.KO_Percent || 0;
      acc[key].switch_percent_sum += counter.Switch_Percent || 0;
      acc[key].mean_sum += counter.Mean || 0;
      acc[key].std_dev_sum += counter.Std_Dev || 0;
      acc[key].count++;
      
      return acc;
    }, {} as Record<string, {
      opp_pokemon: string;
      lose_rate_sum: number;
      ko_percent_sum: number;
      switch_percent_sum: number;
      mean_sum: number;
      std_dev_sum: number;
      count: number;
    }>);

    // Calculate averages and format the data
    const processedCounters = Object.values(aggregatedData)
      .map(data => ({
        opp_pokemon: data.opp_pokemon,
        lose_rate_against_opp: Number((data.lose_rate_sum / data.count).toFixed(2)),
        ko_percent: Number((data.ko_percent_sum / data.count).toFixed(2)),
        switch_percent: Number((data.switch_percent_sum / data.count).toFixed(2)),
        mean: Number((data.mean_sum / data.count).toFixed(2)),
        std_dev: Number((data.std_dev_sum / data.count).toFixed(2)),
        sample_size: data.count
      }))
      .sort((a, b) => b.lose_rate_against_opp - a.lose_rate_against_opp)
      .slice(0, 10); // Get top 10 counters

    const latestEntry = counters[0];

    return NextResponse.json({
      pokemon: formattedName,
      generation: latestEntry.generation,
      battle_format: latestEntry.battle_format,
      available_generations: availableGenerations,
      available_formats: availableFormats,
      sample_period: samplePeriod,
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