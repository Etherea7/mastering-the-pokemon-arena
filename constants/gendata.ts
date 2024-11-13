// Add this at the top with your other constants
export const UNKNOWN_MOVE_COLOR = '#999999'; // Gray color for unknown moves

export const GENERATION_RANGES = {
    'gen1': { start: 1, end: 151 },
    'gen2': { start: 152, end: 251 },
    'gen3': { start: 252, end: 386 },
    'gen4': { start: 387, end: 493 },
    'gen5': { start: 494, end: 649 },
    'gen6': { start: 650, end: 721 },
    'gen7': { start: 722, end: 809 },
    'gen8': { start: 810, end: 905 },
    'gen9': { start: 906, end: 1010 }
  };



export const typeColors: Record<string, { bg: string; text: string; color: string }> = {
    normal: { bg: "bg-gray-400", text: "text-white", color: "#A8A878" },
    fire: { bg: "bg-red-500", text: "text-white", color: "#F08030" },
    water: { bg: "bg-blue-500", text: "text-white", color: "#6890F0" },
    electric: { bg: "bg-yellow-400", text: "text-black", color: "#F8D030" },
    grass: { bg: "bg-green-500", text: "text-white", color: "#78C850" },
    ice: { bg: "bg-blue-200", text: "text-black", color: "#98D8D8" },
    fighting: { bg: "bg-red-700", text: "text-white", color: "#C03028" },
    poison: { bg: "bg-purple-500", text: "text-white", color: "#A040A0" },
    ground: { bg: "bg-amber-600", text: "text-white", color: "#E0C068" },
    flying: { bg: "bg-indigo-300", text: "text-black", color: "#A890F0" },
    psychic: { bg: "bg-pink-500", text: "text-white", color: "#F85888" },
    bug: { bg: "bg-lime-500", text: "text-white", color: "#A8B820" },
    rock: { bg: "bg-yellow-700", text: "text-white", color: "#B8A038" },
    ghost: { bg: "bg-purple-700", text: "text-white", color: "#705898" },
    dragon: { bg: "bg-indigo-600", text: "text-white", color: "#7038F8" },
    dark: { bg: "bg-gray-700", text: "text-white", color: "#705848" },
    steel: { bg: "bg-gray-400", text: "text-white", color: "#B8B8D0" },
    fairy: { bg: "bg-pink-300", text: "text-black", color: "#EE99AC" }
  };

export const RATINGS = [0,1500, 1630, 1695,1760, 1825];