// app/api/pokemon/usage/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const battle_format = searchParams.get('battle_format')
    const generation = searchParams.get('generation')
    const year_month_gte = searchParams.get('year_month_gte')
    const year_month_lte = searchParams.get('year_month_lte')
    const rating = searchParams.get('rating');
    
    console.log('Querying with params:', { 
      battle_format, 
      generation,
      year_month_gte,
      year_month_lte 
    })

    const where: any = {}

    // Add battle format filter if provided
    if (battle_format) {
      where.battle_format = battle_format
    }
    // Add generation filter if provided
    if (generation) {
      where.generation = generation
    }
    if (rating) {
      where.rating = parseInt(rating);
    }
    // Add date range filter if provided
    if (year_month_gte || year_month_lte) {
      where.year_month = {}
      
      if (year_month_gte) {
        where.year_month.gte = `${year_month_gte}`
      }
      
      if (year_month_lte) {
        where.year_month.lte = `${year_month_lte}`
      }
    }

    console.log('Final where clause:', where)

    const data = await prisma.pokemonUsage.findMany({
      where,
      select: {
        id: true,
        name: true,
        usage_percent: true,
        raw_count: true,
        raw_percent: true,
        real_count: true,
        real_percent: true,
        year_month: true,
        generation: true,
        battle_format: true,
        rating: true
      },
      orderBy: {
        usage_percent: 'desc'
      }
    })

    // Convert BigInt values to numbers before JSON serialization
    const serializedData = data.map(item => ({
      ...item,
      raw_count: item.raw_count ? Number(item.raw_count) : null,
      real_count: item.real_count ? Number(item.real_count) : null
    }));
    
    return NextResponse.json({ data: serializedData })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Pokemon usage data' },
      { status: 500 }
    )
  }
}