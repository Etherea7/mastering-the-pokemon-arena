// components/generation/StatAnalysis.tsx
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as d3 from 'd3';

interface Pokemon {
  id: number;
  name: string;
  types: string[];
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

const typeColors = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC"
};

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
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const calculateTypeStats = () => {
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
      const statsKeys = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'] as const;
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
  };

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
      { name: "Attack", key: "attackRank" },
      { name: "Defense", key: "defenseRank" },
      { name: "HP", key: "hpRank" },
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
    const line = d3.line()
      .defined(d => !isNaN(d[1]))
      .x(d => d[0])
      .y(d => d[1]);

    // Add paths
    statsData.forEach(d => {
      const typeColor = typeColors[(d.type.toLowerCase())];
      const pathData = dimensions.map(dimension => [
        x(dimension.name),
        y(d[dimension.key])
      ]);

      // Add path
      svg.append("path")
        .datum(pathData)
        .attr("class", `type-path-${d.type}`)
        .attr("fill", "none")
        .attr("stroke", typeColor)
        .attr("stroke-width", 3)
        .attr("opacity", 0.7)
        .attr("d", line)
        .on("mouseover", function(event) {
          setHoveredType(d.type);
          d3.select(this)
            .attr("stroke-width", 4)
            .attr("opacity", 1);

          // Show tooltip
          const tooltip = d3.select(tooltipRef.current);
          tooltip.style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`)
            .html(`
              <div class="bg-white border rounded-lg shadow-lg p-2">
                <div class="font-medium" style="color: ${typeColor}">${d.type}</div>
                ${dimensions.map(dim => 
                  `<div class="text-sm">
                    ${dim.name}: Rank ${d[dim.key]}
                  </div>`
                ).join('')}
              </div>
            `);
        })
        .on("mouseout", function() {
          setHoveredType(null);
          d3.select(this)
            .attr("stroke-width", selectedType === d.type ? 4 : 3)
            .attr("opacity", selectedType === d.type ? 1 : 0.7);
          
          d3.select(tooltipRef.current)
            .style("opacity", 0);
        })
        .on("click", function() {
          setSelectedType(selectedType === d.type ? null : d.type);
          d3.selectAll(".type-path")
            .attr("stroke-width", 3)
            .attr("opacity", 0.7);
          d3.select(this)
            .attr("stroke-width", 4)
            .attr("opacity", 1);
        });

      // Add points
      dimensions.forEach(dimension => {
        svg.append("circle")
          .attr("class", `type-point-${d.type}`)
          .attr("cx", x(dimension.name) ?? 0)
          .attr("cy", y(d[dimension.key]))
          .attr("r", 6)
          .attr("fill", typeColor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .style("cursor", "pointer")
          .on("mouseover", function(event) {
            d3.select(`.type-path-${d.type}`)
              .attr("stroke-width", 4)
              .attr("opacity", 1);
            
            // Show tooltip
            const tooltip = d3.select(tooltipRef.current);
            tooltip.style("opacity", 1)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 10}px`)
              .html(`
                <div class="bg-white border rounded-lg shadow-lg p-2">
                  <div class="font-medium" style="color: ${typeColor}">${d.type}</div>
                  <div class="text-sm">${dimension.name}: Rank ${d[dimension.key]}</div>
                </div>
              `);
          })
          .on("mouseout", function() {
            d3.select(`.type-path-${d.type}`)
              .attr("stroke-width", selectedType === d.type ? 4 : 3)
              .attr("opacity", selectedType === d.type ? 1 : 0.7);
            
            d3.select(tooltipRef.current)
              .style("opacity", 0);
          })
          .on("click", function() {
            setSelectedType(selectedType === d.type ? null : d.type);
          });
      });
    });

  }, [loading, pokemonData, selectedGen, selectedType]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats Ranking by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg ref={svgRef} className="w-full" />
          <div 
            ref={tooltipRef}
            className="absolute pointer-events-none opacity-0 transition-opacity"
            style={{
              zIndex: 10,
              backgroundColor: 'white',
              borderRadius: '4px'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};