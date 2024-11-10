// app/api/pokeapi/types/route.ts
import { errorResponse, successResponse } from '@/lib/api'

const EXCLUDED_TYPES = ['stellar', 'unknown'];

export async function GET() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/type/');
    const data = await response.json();
    
    // Filter out excluded types
    const filteredTypes = data.results.filter(
      (type: { name: string }) => !EXCLUDED_TYPES.includes(type.name)
    );

    return successResponse({
      data: filteredTypes,
      count: filteredTypes.length
    });
  } catch (error) {
    return errorResponse('Failed to fetch Pokemon types');
  }
}