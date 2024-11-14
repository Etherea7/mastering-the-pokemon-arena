'use client'

import { useEffect, useState } from "react"







export default function Page() {
const [moves,setMoves] = useState([])


const fetchAllmoves = async () => {
    const response = await fetch('https://pokeapi.co/api/v2/move/')
    const data = await response.json()
    setMoves(data)
}


    return (
        <div>
        <h1>Page</h1>
        </div>
    )
}