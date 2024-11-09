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



