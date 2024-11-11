// page.tsx
'use client'

import TeamChooser from '@/components/TeamChooser/page'
import PokemonTeammateViewer from '@/components/PokemonTeammateViewer/page'

export default function Page() {
  return (
    <>
      <TeamChooser />
      <PokemonTeammateViewer />
    </>
  )
}

