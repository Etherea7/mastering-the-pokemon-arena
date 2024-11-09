// app/api/pokemon/usage/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const battle_format = searchParams.get('battle_format')
    const startDate = searchParams.get('year_month_gte')
    const endDate = searchParams.get('year_month_lte')

    console.log('Querying:', { battle_format, startDate, endDate })

    const data = await prisma.pokemonUsage.findMany({
      where: {
        battle_format: battle_format,
        year_month: {
          // Using simple string comparison since your dates are in YYYY-MM format
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        name: true,
        usage_percent: true,
        year_month: true,
        battle_format: true
      },
      orderBy: [
        { year_month: 'asc' }
      ]
    })

    console.log(`Found ${data.length} records`)
    
    return NextResponse.json({ data })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Pokemon usage data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
