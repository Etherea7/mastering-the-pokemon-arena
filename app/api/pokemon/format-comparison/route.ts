import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { commonQuerySchema, errorResponse, successResponse } from '@/lib/api'

const pokemonComparisonSchema = commonQuerySchema.extend({
  name: z.string(),
});

// Route: /api/pokemon/format-comparison/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = pokemonComparisonSchema.parse(
      Object.fromEntries(searchParams)
    );
    
    const { name } = validatedParams;
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    const formatData = await prisma.pokemonBase.findMany({
      where: {
        name: formattedName,
      },
      select: {
        battle_format: true,
        viability_ceiling: true,
        year_month: true,
      },
      orderBy: {
        viability_ceiling: 'desc',
      }
    });

    if (!formatData.length) {
      return errorResponse(`No format data found for Pokemon: ${formattedName}`);
    }

    // Normalize viability ceiling to 1-4 scale
    const normalizeViability = (value: number): number => {
      if (value >= 90) return 4;  // S tier (90-100)
      if (value >= 80) return 3;  // A tier (80-89)
      if (value >= 70) return 2;  // B tier (70-79)
      return 1;                   // C tier (below 70)
    };

    // Process formats by normalized viability with unique values
    const formatsByViability = {
      S_tier: Array.from(new Set(
        formatData
          .filter(d => normalizeViability(d.viability_ceiling) === 4)
          .map(d => d.battle_format)
      )),
      A_tier: Array.from(new Set(
        formatData
          .filter(d => normalizeViability(d.viability_ceiling) === 3)
          .map(d => d.battle_format)
      )),
      B_tier: Array.from(new Set(
        formatData
          .filter(d => normalizeViability(d.viability_ceiling) === 2)
          .map(d => d.battle_format)
      )),
      C_tier: Array.from(new Set(
        formatData
          .filter(d => normalizeViability(d.viability_ceiling) === 1)
          .map(d => d.battle_format)
      )),
    };

    // Get the most recent data period
    const latestPeriod = formatData[0]?.year_month;

    // Calculate percentage of formats at each viability level using unique formats
    const totalUniqueFormats = Object.values(formatsByViability)
      .reduce((acc, curr) => acc + curr.length, 0);
      
    const viabilityDistribution = {
      S_tier: Number(((formatsByViability.S_tier.length / totalUniqueFormats) * 100).toFixed(1)),
      A_tier: Number(((formatsByViability.A_tier.length / totalUniqueFormats) * 100).toFixed(1)),
      B_tier: Number(((formatsByViability.B_tier.length / totalUniqueFormats) * 100).toFixed(1)),
      C_tier: Number(((formatsByViability.C_tier.length / totalUniqueFormats) * 100).toFixed(1)),
    };

    // Find best and most challenging formats with unique values
    const bestFormats = formatData.filter(d => d.viability_ceiling === Math.max(...formatData.map(v => v.viability_ceiling)));
    const challengingFormats = formatData.filter(d => d.viability_ceiling === Math.min(...formatData.map(v => v.viability_ceiling)));

    // Calculate average using normalized values
    const avgViability = Number((formatData.reduce((acc, curr) => 
      acc + normalizeViability(curr.viability_ceiling), 0) / formatData.length).toFixed(2));

    // Create a Map to store the most recent data for each format
    const formatMap = new Map();
    formatData.forEach(d => {
      const existing = formatMap.get(d.battle_format);
      if (!existing || new Date(d.year_month) > new Date(existing.period)) {
        formatMap.set(d.battle_format, {
          format: d.battle_format,
          viability_ceiling: normalizeViability(d.viability_ceiling),
          period: d.year_month
        });
      }
    });

    return successResponse({
      pokemon: formattedName,
      formats_compared: formatMap.size, // Use unique format count
      data_period: latestPeriod,
      format_stats: {
        distribution: viabilityDistribution,
        format_tiers: formatsByViability,
      },
      analysis: {
        best_performing_formats: {
          viability_ceiling: normalizeViability(bestFormats[0]?.viability_ceiling || 0),
          formats: Array.from(new Set(bestFormats.map(f => f.battle_format)))
        },
        most_challenging_formats: {
          viability_ceiling: normalizeViability(challengingFormats[0]?.viability_ceiling || 0),
          formats: Array.from(new Set(challengingFormats.map(f => f.battle_format)))
        },
        average_viability: avgViability
      },
      detailed_format_data: Array.from(formatMap.values()) // Use the most recent data for each format
    });
  } catch (error) {
    return errorResponse('Failed to fetch format comparison data');
  }
}