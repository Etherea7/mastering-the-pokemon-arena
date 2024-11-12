// components/generation/StatAnalysis.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as d3 from 'd3';
import {typeColors} from '@/constants/gendata';
import { cn } from "@/lib/utils";

interface Pokemon {
  id: number;
  name: string;
  types: PokemonType[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
}

interface StatsComparisonProps {
  pokemonData: Pokemon[];
  selectedGen: string;
  loading: boolean;
}


interface TypeStats {
  type: PokemonType;
  attack: number;
  defense: number;
  hp: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  attackRank: number;
  defenseRank: number;
  hpRank: number;
  specialAttackRank: number;
  specialDefenseRank: number;
  speedRank: number;
  [key: string]: number | PokemonType;
}


interface StatsComparisonProps {
  pokemonData: Pokemon[];
  selectedGen: string;
  loading: boolean;
}

type PokemonType = keyof typeof typeColors;


const LoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-8 w-[200px]" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[600px] w-full" />
    </CardContent>
  </Card>
);

export const StatsComparisonChart = ({ 
  pokemonData,
  selectedGen,
  loading 
}: StatsComparisonProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const positionTooltip = useCallback((event: MouseEvent) => {
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!tooltip || !container) return;
  
    const containerRect = container.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const padding = 10;
  
    // Calculate position relative to the viewport
    let left = event.pageX - containerRect.left - scrollLeft + padding;
    let top = event.pageY - containerRect.top - scrollTop - tooltipRect.height / 2;
  
    // Adjust for right edge
    if (left + tooltipRect.width > containerRect.width) {
      left = event.pageX - containerRect.left - scrollLeft - tooltipRect.width - padding;
    }
  
    // Adjust for bottom edge
    if (top + tooltipRect.height > containerRect.height) {
      top = containerRect.height - tooltipRect.height - padding;
    }
  
    // Adjust for top edge
    if (top < padding) {
      top = padding;
    }
  
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }, []);


  const calculateTypeStats = useCallback(() => {
    const typeStats: { [key: string]: {
      count: number;
      totalStats: {
        hp: number;
        attack: number;
        defense: number;
        special_attack: number;
        special_defense: number;
        speed: number;
      }
    }} = {};

    // Initialize and calculate averages
    pokemonData.forEach(pokemon => {
      pokemon.types.forEach(type => {
        if (!typeStats[type]) {
          typeStats[type] = {
            count: 0,
            totalStats: {
              hp: 0,
              attack: 0,
              defense: 0,
              special_attack: 0,
              special_defense: 0,
              speed: 0
            }
          };
        }

        typeStats[type].count += 1;
        typeStats[type].totalStats.hp += pokemon.stats.hp;
        typeStats[type].totalStats.attack += pokemon.stats.attack;
        typeStats[type].totalStats.defense += pokemon.stats.defense;
        typeStats[type].totalStats.special_attack += pokemon.stats.special_attack;
        typeStats[type].totalStats.special_defense += pokemon.stats.special_defense;
        typeStats[type].totalStats.speed += pokemon.stats.speed;
      });
    });

    // Calculate rankings
    const stats = ['attack', 'defense', 'hp', 'specialAttack', 'specialDefense', 'speed'];
    const rankings = Object.entries(typeStats).map(([type, data]) => {
      const typeData: any = { type };
      stats.forEach(stat => {
        const statKey = stat === 'hp' ? 'hp' : 
                       stat === 'specialAttack' ? 'special_attack' :
                       stat === 'specialDefense' ? 'special_defense' : stat;
                       
        typeData[stat] = Math.round(data.totalStats[statKey as keyof typeof data.totalStats] / data.count);
      });
      
      return typeData;
    });

    // Create rankings
    stats.forEach(stat => {
      const sorted = [...rankings].sort((a, b) => b[stat] - a[stat]);
      rankings.forEach(type => {
        type[`${stat}Rank`] = sorted.findIndex(t => t.type === type.type) + 1;
      });
    });

    return rankings;
  },[pokemonData]);

  useEffect(() => {
    if (loading || !svgRef.current) return;
    
    const statsData = calculateTypeStats();
    const margin = { top: 50, right: 50, bottom: 30, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Clear previous svg content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dimensions = [
      { name: "HP", key: "hpRank" },
      { name: "Attack", key: "attackRank" },
      { name: "Defense", key: "defenseRank" },
      { name: "Sp.Attack", key: "specialAttackRank" },
      { name: "Sp.Defense", key: "specialDefenseRank" },
      { name: "Speed", key: "speedRank" }
    ];

    // Create scales for each dimension
    const x = d3.scalePoint()
      .domain(dimensions.map(d => d.name))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([18, 1])  // Reversed domain for rank (1 at top)
      .range([height, 0]);

    // Add axes
    dimensions.forEach(dimension => {
      const axis = d3.axisLeft(y)
        .ticks(18);
      
      svg.append("g")
        .attr("transform", `translate(${x(dimension.name)},0)`)
        .call(axis);

      // Add dimension labels
      svg.append("text")
        .attr("x", x(dimension.name) || 0)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(dimension.name);
    });

    // Create the path generator
    const line = d3.line<[number, number]>()
      .defined(d => !isNaN(d[1]))
      .x(d => d[0])
      .y(d => d[1]);

    // Add paths
    statsData.forEach((d: TypeStats) => {
      const typeColor = typeColors[d.type].color; // Now accessing the color property
      const pathData: [number, number][] = dimensions.map(dimension => [
        x(dimension.name) ?? 0,
        y(d[dimension.key as keyof TypeStats] as number)
      ]);
  
      svg.append("path")
        .datum(pathData)
        .attr("class", `type-path-${d.type}`)
        .attr("fill", "none")
        .attr("stroke", typeColor)
        .attr("stroke-width", 3)
        .attr("opacity", 0.7)
        .attr("d", line as any)
        .on("mouseover", function(event: MouseEvent) {
          setHoveredType(d.type);
          d3.select(this)
            .attr("stroke-width", 4)
            .attr("opacity", 1);

          // Show tooltip
          const tooltip = d3.select(tooltipRef.current);
            tooltip.style("opacity", 1)
              .html(`
                <div class="flex flex-col gap-2 min-w-[200px]">
                  <div class="flex items-center gap-2 pb-2 border-b">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${typeColor}"></div>
                    <span class="font-medium">${d.type}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                    ${dimensions.map(dim => {
                      const rankValue = d[dim.key];
                      const statKey = dim.key.replace('Rank', '');
                      const actualValue = d[statKey];
                      return `
                        <div class="text-sm font-medium">${dim.name}:</div>
                        <div class="text-sm">
                          <span class="font-medium text-primary">#${rankValue}</span>
                          <span class="text-muted-foreground"> (${actualValue})</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `);
            
            positionTooltip(event);
          })
          .on("mousemove", function(event: MouseEvent) {
            positionTooltip(event);
          });

      // Add points
      dimensions.forEach(dimension => {
        svg.append("circle")
          .attr("class", `type-point-${d.type}`)
          .attr("cx", x(dimension.name) ?? 0)
          .attr("cy", y(d[dimension.key as keyof TypeStats] as number))
          .attr("r", 6)
          .attr("fill", typeColor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .style("cursor", "pointer")
          .on("mouseover", function(event: MouseEvent) {
            d3.select(`.type-path-${d.type}`)
              .attr("stroke-width", 4)
              .attr("opacity", 1);
            
            const tooltip = d3.select(tooltipRef.current);
            const rankValue = d[dimension.key];
            const statKey = dimension.key.replace('Rank', '');
            const actualValue = d[statKey];
            
            tooltip.style("opacity", 1)
              .html(`
                <div class="flex flex-col gap-2 min-w-[200px]">
                  <div class="flex items-center gap-2 pb-2 border-b">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${typeColor}"></div>
                    <span class="font-medium">${d.type}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-x-4">
                    <div class="text-sm font-medium">${dimension.name}:</div>
                    <div class="text-sm">
                      <span class="font-medium text-primary">#${rankValue}</span>
                      <span class="text-muted-foreground"> (${actualValue})</span>
                    </div>
                  </div>
                </div>
              `);
            
            positionTooltip(event);
          })
          .on("mousemove", function(event: MouseEvent) {
            positionTooltip(event);
          });



      });
    });

  }, [loading, pokemonData, selectedGen,calculateTypeStats, selectedType]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats Ranking by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full">
          <svg ref={svgRef} className="w-full" />
          <div 
            ref={tooltipRef}
            className={cn(
              "absolute pointer-events-none opacity-0 transition-opacity",
              "bg-card text-card-foreground",
              "rounded-lg border shadow-lg p-3",
              "z-50"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};