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
        name: true,
        usage_percent: true,
        year_month: true,
        battle_format: true,
        generation: true
      },
      orderBy: [
        { year_month: 'asc' },
        { usage_percent: 'desc' }
      ]
    })

    console.log(`Found ${data.length} records`)
    console.log('Unique months:', [...new Set(data.map(item => item.year_month))].sort())
    
    return NextResponse.json({ data })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Pokemon usage data' },
      { status: 500 }
    )
  }
}