// app/api/pokemon/teammates/[name]/route.ts
import { prisma } from '@/lib/prisma';
import { 
  pokemonSpecificSchema, 
  errorResponse, 
  successResponse, 
  buildWhereClause
} from '@/lib/api';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = pokemonSpecificSchema.parse({
      ...Object.fromEntries(searchParams),
      name: params.name,
    });
    const { name, ...filters } = validatedParams;

    // Build the base where clause
    const where = buildWhereClause(filters);
    where.name = name;

    // Get all teammates data
    const teammates = await prisma.pokemonTeammates.findMany({
      where,
      select: {
        Teammate: true,
        Usage: true,
        year_month: true,
        rating: true,
      },
      orderBy: {
        Usage: 'desc'
      }
    });

    return successResponse({
      pokemon: name,
      teammates: teammates.map(t => ({
        teammate: t.Teammate,
        usage: t.Usage,
        year_month: t.year_month
      })) // Return raw data for frontend processing
    });

  } catch (error: any) {
    console.error('Error in teammates route:', error);
    return errorResponse(`Failed to fetch teammates for Pokemon: ${params.name}`);
  }
}