// app/api/pokemon/stats/[name]/route.ts
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Define interfaces for our data structures
interface BaseStatsRecord {
  usage: number | null
  year_month: string
}

interface AbilityRecord extends BaseStatsRecord {
  ability: string
}

interface ItemRecord extends BaseStatsRecord {
  item: string
}

interface TeammateRecord extends BaseStatsRecord {
  teammate: string
}

interface CounterRecord {
  opp_pokemon: string
  lose_rate_against_opp: number | null
  year_month: string
}

interface UsageRecord {
  usage_percent: number | null
  raw_count: bigint | number | null
  year_month: string
}

// Helper function to calculate averages for abilities, items, and teammates
function calculateAverages<T extends BaseStatsRecord>(
  data: T[],
  nameKey: keyof T
): { name: string; usage: number } | null {
  const averages = new Map<string, { total: number; count: number }>();
  
  data.forEach(item => {
    if (item.usage !== null) {
      const name = item[nameKey] as string;
      const current = averages.get(name) || { total: 0, count: 0 };
      averages.set(name, {
        total: current.total + item.usage,
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
    if (item.lose_rate_against_opp !== null) {
      const current = averages.get(item.opp_pokemon) || { total: 0, count: 0 };
      averages.set(item.opp_pokemon, {
        total: current.total + item.lose_rate_against_opp,
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
      const currRawCount = curr.raw_count === null ? 0 : (typeof curr.raw_count === 'bigint' ? Number(curr.raw_count) : curr.raw_count);
      return {
        usage_percent: acc.usage_percent + (curr.usage_percent || 0),
        raw_count: acc.raw_count + currRawCount,
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

    // Create a cache key based on the request parameters
    const cacheKey = `pokemon-stats:${pokemonName}:${generation}:${battleFormat}:${rating}:${yearMonthGte}:${yearMonthLte}`;

    // Try to get data from cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return successResponse(cachedData);
    }

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
          ability: true,
          usage: true,
          year_month: true
        }
      }),

      prisma.pokemonItems.findMany({
        where,
        select: {
          item: true,
          usage: true,
          year_month: true
        }
      }),

      prisma.pokemonTeammates.findMany({
        where,
        select: {
          teammate: true,
          usage: true,
          year_month: true
        }
      }),

      prisma.pokemonCounters.findMany({
        where,
        select: {
          opp_pokemon: true,
          lose_rate_against_opp: true,
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
    const topAbility = calculateAverages<AbilityRecord>(abilities, 'ability');
    const topItem = calculateAverages<ItemRecord>(items, 'item');
    const topTeammate = calculateAverages<TeammateRecord>(teammates, 'teammate');
    const bestCounter = calculateCounterAverages(counters);
    const averageUsage = calculateUsageAverages(usageStats);

    const data = {
      averageUsage,
      topAbility,
      topItem,
      topTeammate,
      bestCounter
    };

    // Cache the data for 1 hour
    await redis.set(cacheKey, data, { ex: 3600 });

    return successResponse(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return errorResponse('Failed to fetch Pokemon stats');
  }
}