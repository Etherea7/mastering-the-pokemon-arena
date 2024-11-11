// app/api/pokemon/stats/[name]/route.ts
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api';

// Define interfaces for our data structures
interface BaseStatsRecord {
  Usage: number | null
  year_month: string
}

interface AbilityRecord extends BaseStatsRecord {
  Ability: string
}

interface ItemRecord extends BaseStatsRecord {
  Item: string
}

interface TeammateRecord extends BaseStatsRecord {
  Teammate: string
}

interface CounterRecord {
  opp_pokemon: string
  Lose_Rate_Against_Opp: number | null
  year_month: string
}

interface UsageRecord {
  usage_percent: number | null
  raw_count: number | null
  year_month: string
}

// Helper function to calculate averages for abilities, items, and teammates
function calculateAverages<T extends BaseStatsRecord>(
  data: T[],
  nameKey: keyof T
): { name: string; usage: number } | null {
  const averages = new Map<string, { total: number; count: number }>();
  
  data.forEach(item => {
    if (item.Usage !== null) {
      const name = item[nameKey] as string;
      const current = averages.get(name) || { total: 0, count: 0 };
      averages.set(name, {
        total: current.total + item.Usage,
        count: current.count + 1
      });
    }
  });

  return Array.from(averages.entries())
    .map(([name, { total, count }]) => ({
      name,
      usage: total / count
    }))
    .sort((a, b) => b.usage - a.usage)[0] || null;
}

// Helper function to calculate counter averages
function calculateCounterAverages(data: CounterRecord[]) {
  const averages = new Map<string, { total: number; count: number }>();
  
  data.forEach(item => {
    if (item.Lose_Rate_Against_Opp !== null) {
      const current = averages.get(item.opp_pokemon) || { total: 0, count: 0 };
      averages.set(item.opp_pokemon, {
        total: current.total + item.Lose_Rate_Against_Opp,
        count: current.count + 1
      });
    }
  });

  return Array.from(averages.entries())
    .map(([name, { total, count }]) => ({
      name,
      winRate: total / count
    }))
    .sort((a, b) => b.winRate - a.winRate)[0] || null;
}

// Helper function to calculate usage averages
function calculateUsageAverages(data: UsageRecord[]) {
  const totals = data.reduce(
    (acc, curr) => {
      return {
        usage_percent: acc.usage_percent + (curr.usage_percent || 0),
        raw_count: acc.raw_count + (curr.raw_count || 0),
        count: acc.count + 1
      };
    },
    { usage_percent: 0, raw_count: 0, count: 0 }
  );

  return {
    percent: totals.count > 0 ? totals.usage_percent / totals.count : 0,
    rawCount: totals.count > 0 ? Math.round(totals.raw_count / totals.count) : 0
  };
}

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const pokemonName = params.name;
    const generation = searchParams.get('generation');
    const battleFormat = searchParams.get('battle_format')?.toLowerCase();
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
    const yearMonthGte = searchParams.get('year_month_gte');
    const yearMonthLte = searchParams.get('year_month_lte');

    if (!pokemonName) {
      return errorResponse('Pokemon name is required');
    }

    const where = {
      name: pokemonName,
      ...(generation && { generation }),
      ...(battleFormat && { battle_format: battleFormat }),
      ...(rating && { rating }),
      ...(yearMonthGte || yearMonthLte) && {
        year_month: {
          ...(yearMonthGte && { gte: yearMonthGte }),
          ...(yearMonthLte && { lte: yearMonthLte })
        }
      }
    };

    // Fetch all relevant data for the date range
    const [abilities, items, teammates, counters, usageStats] = await Promise.all([
      prisma.pokemonAbilities.findMany({
        where,
        select: {
          Ability: true,
          Usage: true,
          year_month: true
        }
      }),

      prisma.pokemonItems.findMany({
        where,
        select: {
          Item: true,
          Usage: true,
          year_month: true
        }
      }),

      prisma.pokemonTeammates.findMany({
        where,
        select: {
          Teammate: true,
          Usage: true,
          year_month: true
        }
      }),

      prisma.pokemonCounters.findMany({
        where,
        select: {
          opp_pokemon: true,
          Lose_Rate_Against_Opp: true,
          year_month: true
        }
      }),

      prisma.pokemonUsage.findMany({
        where,
        select: {
          usage_percent: true,
          raw_count: true,
          year_month: true
        }
      })
    ]);

    // Calculate all averages using the helper functions
    const topAbility = calculateAverages<AbilityRecord>(abilities, 'Ability');
    const topItem = calculateAverages<ItemRecord>(items, 'Item');
    const topTeammate = calculateAverages<TeammateRecord>(teammates, 'Teammate');
    const bestCounter = calculateCounterAverages(counters);
    const averageUsage = calculateUsageAverages(usageStats);

    return successResponse({
      averageUsage,
      topAbility,
      topItem,
      topTeammate,
      bestCounter
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return errorResponse('Failed to fetch Pokemon stats');
  }
}