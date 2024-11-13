import { NextResponse } from 'next/server'

function formatMoveName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const moveName = params.name
    if (!moveName) {
      return NextResponse.json(
        { error: 'Move name is required' },
        { status: 400 }
      )
    }

    const formattedName = formatMoveName(moveName)
    const response = await fetch(`https://pokeapi.co/api/v2/move/${formattedName}`)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Move not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      name: moveName,
      type: data.type.name,
      power: data.power,
      accuracy: data.accuracy,
      pp: data.pp,
      damage_class: data.damage_class.name
    })

  } catch (error) {
    console.error('Error fetching move data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch move data' },
      { status: 500 }
    )
  }
}