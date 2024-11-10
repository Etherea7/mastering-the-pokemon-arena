'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const TYPE_COLORS = {
    normal: '#A8A878',
    fighting: '#C03028',
    flying: '#A890F0',
    poison: '#A040A0',
    ground: '#E0C068',
    rock: '#B8A038',
    bug: '#A8B820',
    ghost: '#705898',
    steel: '#B8B8D0',
    fire: '#F08030',
    water: '#6890F0',
    grass: '#78C850',
    electric: '#F8D030',
    psychic: '#F85888',
    ice: '#98D8D8',
    dragon: '#7038F8',
    dark: '#705848',
    fairy: '#EE99AC'
  } as const;

type PokemonType = keyof typeof TYPE_COLORS;

interface TypeButtonProps {
  type: string;
  isSelected: boolean;
  onClick: () => void;
}

const TypeButton = ({ type, isSelected, onClick }: TypeButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [key, setKey] = useState(0);
  const lightTypes = ['normal', 'flying', 'ground', 'steel', 'fairy'];
  const textColor = lightTypes.includes(type) ? '#000' : '#fff';

  return (
    <button
      key={key}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {setIsHovered(false);setKey(prev=>prev+1)}}
      className={cn(
        'px-3 py-1 rounded',
        'motion-preset-pulse',
        isHovered ? 'motion-running' : 'motion-paused',
        'hover:scale-110' // Optional: adds a slight scale effect on hover
      )}
      style={{
        backgroundColor: TYPE_COLORS[type as PokemonType],
        color: textColor,
        opacity: isSelected ? 1 : 0.6
      }}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  );
};

export default TypeButton;