// utils/api.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Common query parameter validation schema
export const commonQuerySchema = z.object({
  generation: z.string().optional(),
  battle_format: z.string().optional(),
  rating: z.coerce.number().int().min(0).optional(),
  year_month: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Additional schema for specific Pokemon queries
export const pokemonSpecificSchema = commonQuerySchema.extend({
  name: z.string(),
});


// Schema for spread queries with EV validation
export const spreadQuerySchema = commonQuerySchema.extend({
  nature: z.string().optional(),
  min_ev: z.coerce.number().int().min(0).max(252).optional(),
  max_ev: z.coerce.number().int().min(0).max(252).optional(),
});

export const pokemonSpreadSpecificSchema = spreadQuerySchema.extend({
  name: z.string(),
});
// Schema for counter queries
export const counterQuerySchema = commonQuerySchema.extend({
  min_lose_rate: z.coerce.number().min(0).max(100).optional(),
  max_lose_rate: z.coerce.number().min(0).max(100).optional(),
});

// Type for common query parameters
export type CommonQueryParams = z.infer<typeof commonQuerySchema>;
export type PokemonSpecificParams = z.infer<typeof pokemonSpecificSchema>;
export type SpreadQueryParams = z.infer<typeof spreadQuerySchema>;
export type CounterQueryParams = z.infer<typeof counterQuerySchema>;

// Error response helper
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Success response helper
export function successResponse<T>(data: T) {
  return NextResponse.json(data);
}

// Pagination helper
export function getPaginationParams(params: CommonQueryParams) {
  const { limit, offset, ...filters } = params;
  return {
    pagination: {
      take: limit,
      skip: offset,
    },
    filters: {
      ...filters,
    },
  };
}

// Common where clause builder
export function buildWhereClause(filters: Omit<CommonQueryParams, 'limit' | 'offset'>) {
  const where: any = {};
  
  if (filters.generation) where.generation = filters.generation;
  if (filters.battle_format) where.battle_format = filters.battle_format;
  if (filters.rating) where.rating = filters.rating;
  if (filters.year_month) where.year_month = filters.year_month;
  
  return where;
}

// Build where clause for spreads with EV filtering
export function buildSpreadWhereClause(params: SpreadQueryParams) {
  const where = buildWhereClause(params);
  
  if (params.nature) where.nature = params.nature;
  if (params.min_ev || params.max_ev) {
    const evFields = ['hp_ev', 'atk_ev', 'def_ev', 'spatk_ev', 'spdef_ev', 'spd_ev'];
    evFields.forEach(field => {
      where[field] = {};
      if (params.min_ev) where[field].gte = params.min_ev;
      if (params.max_ev) where[field].lte = params.max_ev;
    });
  }
  
  return where;
}

// Build where clause for counters with lose rate filtering
export function buildCounterWhereClause(params: CounterQueryParams) {
  const where = buildWhereClause(params);
  
  if (params.min_lose_rate || params.max_lose_rate) {
    where.lose_rate_against_opp = {};
    if (params.min_lose_rate) where.lose_rate_against_opp.gte = params.min_lose_rate;
    if (params.max_lose_rate) where.lose_rate_against_opp.lte = params.max_lose_rate;
  }
  
  return where;
}