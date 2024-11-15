import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';
import { z } from 'zod';

const aggregateMoveSchema = z.object({
  name: z.string(),
  generation: z.string(),
  format: z.string(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = aggregateMoveSchema.parse(Object.fromEntries(searchParams));

    const { name, generation, format } = params;

    // Changed from _sum to _avg to get average usage rates
    const data = await prisma.pokemonMoves.groupBy({
      by: ['Move', 'year_month'],
      where: {
        name: name,
        generation: generation,
        battle_format: format,
        year_month: {
          gte: '2023-09', // Updated to match actual data range
          lte: '2024-08',
        },
      },
      _avg: {  // Changed from _sum to _avg
        Usage: true,
      },
      orderBy: {
        year_month: 'asc',
      },
    });

    // Transform the data, now using _avg instead of _sum
    const groupedData: Record<string, { year_month: string; usage: number }[]> = {};
    data.forEach(({ Move, year_month, _avg }) => {
      if (!groupedData[Move]) groupedData[Move] = [];
      // Round to 2 decimal places for cleaner numbers
      groupedData[Move].push({ 
        year_month, 
        usage: _avg.Usage ? Number(_avg.Usage.toFixed(2)) : 0 
      });
    });

    // Add some logging to verify the data
    console.log('Sample move usage ranges:', Object.entries(groupedData).map(([move, data]) => ({
      move,
      min: Math.min(...data.map(d => d.usage)),
      max: Math.max(...data.map(d => d.usage)),
      avgPoints: data.length
    })));

    return successResponse({
      data: groupedData,
    });
  } catch (error) {
    console.error('Error in /pokemon/moves/aggregate route:', error);
    return errorResponse('Failed to fetch Pokemon move data');
  }
}

