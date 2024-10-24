// app/api/pokemon/[name]/details/route.ts
import { pokeapi } from '@/lib/pokeapi'
import { NextRequest } from 'next/server'
import { commonQuerySchema, errorResponse, successResponse } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedParams = commonQuerySchema.parse(searchParams);
    
    const pokemonDetails = await pokeapi.getCompletePokemonDetails(
      params.name,
      validatedParams
    );
    
    return successResponse(pokemonDetails);
  } catch (error) {
    return errorResponse(`Failed to fetch Pokemon details: ${error.message}`);
  }
}

// app/api/pokemon/[name]/counters/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedParams = commonQuerySchema.parse(searchParams);
    
    const counterAnalysis = await pokeapi.findCounterPicks(
      params.name,
      validatedParams
    );
    
    return successResponse(counterAnalysis);
  } catch (error) {
    return errorResponse(`Failed to fetch counter analysis: ${error.message}`);
  }
}

// app/api/moves/[name]/analysis/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedParams = commonQuerySchema.parse(searchParams);
    
    const moveAnalysis = await pokeapi.getMoveDetails(
      params.name,
      validatedParams
    );
    
    return successResponse(moveAnalysis);
  } catch (error) {
    return errorResponse(`Failed to fetch move analysis: ${error.message}`);
  }
}

// app/api/abilities/[name]/analysis/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedParams = commonQuerySchema.parse(searchParams);
    
    const abilityAnalysis = await pokeapi.getAbilityAnalysis(
      params.name,
      validatedParams
    );
    
    return successResponse(abilityAnalysis);
  } catch (error) {
    return errorResponse(`Failed to fetch ability analysis: ${error.message}`);
  }
}

// app/api/pokemon/[name]/type-matchups/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const pokemon = await pokeapi.getPokemon(params.name);
    const typeMatchups = await pokeapi.getTypeMatchups(
      pokemon.types.map(t => t.type.name)
    );
    
    return successResponse({
      pokemon_name: params.name,
      types: pokemon.types.map(t => t.type.name),
      ...typeMatchups
    });
  } catch (error) {
    return errorResponse(`Failed to fetch type matchups: ${error.message}`);
  }
}