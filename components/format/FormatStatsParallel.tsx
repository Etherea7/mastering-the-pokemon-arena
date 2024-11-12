import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { typeColors } from '@/constants/gendata';
import { FormatPokemonData } from "@/types/format";
import { cn } from "@/lib/utils";

interface ExtendedFormatPokemonData extends FormatPokemonData {
    stats?: {
      hp: number;
      attack: number;
      defense: number;
      special_attack: number;
      special_defense: number;
      speed: number;
    };
}

interface FormatStatsProps {
  pokemonData: ExtendedFormatPokemonData[];
  selectedFormat: string;
  loading: boolean;
}

interface StatDimension {
    name: string;
    key: StatKey;
}

// Define valid stat and rank keys
type StatKey = 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed' |
               'hpRank' | 'attackRank' | 'defenseRank' | 'specialAttackRank' | 'specialDefenseRank' | 'speedRank';

type BaseStatKey = 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';

// Interface for average stats before ranking
interface AverageTypeStats {
    type: string;
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
}

// Complete interface including both stats and ranks
interface TypeStats {
    type: string;
    hp: number;
    hpRank: number;
    attack: number;
    attackRank: number;
    defense: number;
    defenseRank: number;
    specialAttack: number;
    specialAttackRank: number;
    specialDefense: number;
    specialDefenseRank: number;
    speed: number;
    speedRank: number;
}


export function FormatStatsChart({ 
  pokemonData,
  selectedFormat,
  loading 
}: FormatStatsProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [hoveredType, setHoveredType] = useState<string | null>(null);

  const calculateTypeStats = useCallback(() => {
    // First, calculate average stats per type
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
  
    
    // Only process Pokemon that have stats data
    pokemonData.forEach(pokemon => {
        if (!pokemon.stats) return;
        
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
          if(!pokemon.stats) return;
          typeStats[type].count += 1;
          typeStats[type].totalStats.hp += pokemon.stats.hp;
          typeStats[type].totalStats.attack += pokemon.stats.attack;
          typeStats[type].totalStats.defense += pokemon.stats.defense;
          typeStats[type].totalStats.special_attack += pokemon.stats.special_attack;
          typeStats[type].totalStats.special_defense += pokemon.stats.special_defense;
          typeStats[type].totalStats.speed += pokemon.stats.speed;
        });
      });
  
  

    // Calculate averages and create initial stats objects
    const averageStats: AverageTypeStats[] = Object.entries(typeStats).map(([type, stats]) => ({
        type,
        hp: Math.round(stats.totalStats.hp / stats.count),
        attack: Math.round(stats.totalStats.attack / stats.count),
        defense: Math.round(stats.totalStats.defense / stats.count),
        specialAttack: Math.round(stats.totalStats.special_attack / stats.count),
        specialDefense: Math.round(stats.totalStats.special_defense / stats.count),
        speed: Math.round(stats.totalStats.speed / stats.count)
      }));

      const baseStatKeys: BaseStatKey[] = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
    
      // Calculate rankings and combine everything
      return averageStats.map(typeData => {
        // Initialize the full stats object
        const fullStats: TypeStats = {
          type: typeData.type,
          hp: typeData.hp,
          attack: typeData.attack,
          defense: typeData.defense,
          specialAttack: typeData.specialAttack,
          specialDefense: typeData.specialDefense,
          speed: typeData.speed,
          hpRank: 0,
          attackRank: 0,
          defenseRank: 0,
          specialAttackRank: 0,
          specialDefenseRank: 0,
          speedRank: 0
        };
  
        // Calculate rankings for each stat
        baseStatKeys.forEach(stat => {
          const rankKey = `${stat}Rank` as `${BaseStatKey}Rank`;
          const sortedByThisStat = [...averageStats].sort((a, b) => b[stat] - a[stat]);
          const rank = sortedByThisStat.findIndex(t => t.type === typeData.type) + 1;
          fullStats[rankKey] = rank;
        });
  
        return fullStats;
      });
    }, [pokemonData]);


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

    const dimensions: StatDimension[] = [
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

    // For rankings, we want higher ranks (1) at the top
    const y = d3.scaleLinear()
      .domain([statsData.length, 1])  
      .range([height, 0])
      .nice();

    // Add axes
    dimensions.forEach(dimension => {
        const axis = d3.axisLeft(y)
          .ticks(statsData.length)
          .tickFormat(d => `${Math.max(1, Math.round(+d))}`) // Ensure no values below 1
          .tickValues(d3.range(1, statsData.length + 1)); // Explicitly set tick values from 1 to max
        
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

    // Add paths for each type
    statsData.forEach((d) => {
        const typeColor = typeColors[d.type.toLowerCase()]?.color || "#000000";
      const pathData: [number, number][] = dimensions.map(dimension => [
        x(dimension.name) ?? 0,
        y(d[dimension.key])
      ]);

      // Function to get the original stat value
      const getOriginalStat = (dimKey: string) => {
        const statKey = dimKey.replace('Rank', '') as keyof TypeStats;
        return d[statKey];
      };

      svg.append("path")
        .datum(pathData)
        .attr("class", `type-path-${d.type}`)
        .attr("fill", "none")
        .attr("stroke", typeColor)
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        .attr("d", line)
        .on("mouseover", function(event: MouseEvent) {
            setHoveredType(d.type);
            d3.select(this)
              .attr("stroke-width", 3)
              .attr("opacity", 1);

          // Show tooltip with both rank and actual value
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
                    const actualValue = getOriginalStat(dim.key);
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
          })
        .on("mouseout", function() {
        setHoveredType(null);
        d3.select(this)
            .attr("stroke-width", selectedType === d.type ? 3 : 2)
            .attr("opacity", selectedType === d.type ? 1 : 0.7);
        
        d3.select(tooltipRef.current)
            .style("opacity", 0);
        });

      // Add points
      dimensions.forEach((dimension) => {
        svg.append("circle")
          .attr("class", `type-point-${d.type}`)
          .attr("cx", x(dimension.name) ?? 0)
          .attr("cy", y(d[dimension.key]))
          .attr("r", 4)
          .attr("fill", typeColor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .on("mouseover", function(event: MouseEvent) {
            d3.select(`.type-path-${d.type}`)
              .attr("stroke-width", 3)
              .attr("opacity", 1);
            
              const tooltip = d3.select(tooltipRef.current);
              const rankValue = d[dimension.key];
              const actualValue = getOriginalStat(dimension.key);
              
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
            })
            .on("mouseout", function() {
                setHoveredType(null);
                d3.select(this)
                  .attr("stroke-width", selectedType === d.type ? 3 : 2)
                  .attr("opacity", selectedType === d.type ? 1 : 0.7);
                
                d3.select(tooltipRef.current)
                  .style("opacity", 0);
              });;
        });
      });
  
    }, [loading, pokemonData, selectedFormat, calculateTypeStats, selectedType, positionTooltip]);

    return (
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
      );
    }