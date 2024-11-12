import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as d3 from 'd3';
import { typeColors } from '@/constants/gendata';
import { FormatPokemonData } from "@/types/format";
import { cn } from "@/lib/utils";


interface StatDimension {
  name: string;
  key: string;
  format: (value: number) => string;
  domain: [number, number];
}

interface FormatUsageProps {
  pokemonData: FormatPokemonData[];
  selectedFormat: string;
  loading: boolean;
}

interface TypeStats {
  type: string;
  count: number;
  avgUsage: number;
  avgRawCount: number;
  avgRealCount: number;
}


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

export default function FormatUsageChart({ 
  pokemonData,
  selectedFormat,
  loading 
}: FormatUsageProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
      totalUsage: number;
      totalRawCount: number;
      totalRealCount: number;
    }} = {};

    pokemonData.forEach(pokemon => {
      pokemon.types.forEach(type => {
        if (!typeStats[type]) {
          typeStats[type] = {
            count: 0,
            totalUsage: 0,
            totalRawCount: 0,
            totalRealCount: 0
          };
        }

        typeStats[type].count += 1;
        typeStats[type].totalUsage += pokemon.usage_percent;
        typeStats[type].totalRawCount += pokemon.raw_count || 0;
        typeStats[type].totalRealCount += pokemon.real_count || 0;
      });
    });

    return Object.entries(typeStats).map(([type, stats]) => ({
      type,
      count: stats.count,
      avgUsage: stats.totalUsage / stats.count,
      avgRawCount: stats.totalRawCount / stats.count,
      avgRealCount: stats.totalRealCount / stats.count
    }));
  }, [pokemonData]);

  useEffect(() => {
    if (loading || !svgRef.current) return;
    
    const statsData = calculateTypeStats();
    const margin = { top: 50, right: 50, bottom: 30, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Calculate domains for each dimension
    const getDomain = (key: keyof TypeStats): [number, number] => {
      const values = statsData.map(d => d[key]).filter((d): d is number => typeof d === 'number');
      const extent = d3.extent(values) as [number, number];
      return extent[0] !== undefined ? extent : [0, 1];
    };

    const dimensions: StatDimension[] = [
      { 
        name: "Usage %", 
        key: "avgUsage", 
        format: (d: number) => `${(d * 100).toFixed(2)}%`,
        domain: getDomain('avgUsage')
      },
      { 
        name: "Pokemon Count", 
        key: "count",
        format: (d: number) => d.toString(),
        domain: getDomain('count')
      },
      { 
        name: "Avg Battles", 
        key: "avgRawCount",
        format: (d: number) => `${Math.round(d).toLocaleString()}`,
        domain: getDomain('avgRawCount')
      },
    ];

    // Clear previous svg content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scalePoint()
      .domain(dimensions.map(d => d.name))
      .range([0, width]);

    const yScales = new Map(dimensions.map(dim => [
      dim.key,
      d3.scaleLinear()
        .domain(dim.domain)
        .range([height, 0])
        .nice()
    ]));

    // Add axes
    dimensions.forEach(dimension => {
      const yScale = yScales.get(dimension.key)!;
      const axis = d3.axisLeft(yScale)
        .ticks(10)
        .tickFormat(d => dimension.format(d as number));
      
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
    const line = d3.line<[number, number]>();

    // Add paths for each type
    statsData.forEach((d) => {
      const typeColor = typeColors[d.type.toLowerCase()]?.color || "#000000";
      
      const pathData = dimensions.map(dim => {
        const xPos = x(dim.name) ?? 0;
        const yScale = yScales.get(dim.key)!;
        const value = d[dim.key as keyof TypeStats] as number;
        return [xPos, yScale(value)];
      });

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
                const value = d[dim.key as keyof TypeStats] as number;
                return `
                  <div class="text-sm font-medium">${dim.name}:</div>
                  <div class="text-sm">
                    <span class="font-medium text-primary">${dim.format(value)}</span>
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
        .attr("stroke-width", selectedType === d.type ? 4 : 3)
        .attr("opacity", selectedType === d.type ? 1 : 0.7);
      
      d3.select(tooltipRef.current)
        .style("opacity", 0);
    });

      // Add points
      dimensions.forEach((dimension) => {
        const xPos = x(dimension.name) ?? 0;
        const yScale = yScales.get(dimension.key)!;
        const value = d[dimension.key as keyof TypeStats] as number;

        svg.append("circle")
          .attr("class", `type-point-${d.type}`)
          .attr("cx", xPos)
          .attr("cy", yScale(value))
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
              const value = d[dimension.key as keyof TypeStats] as number;
              
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
                        <span class="font-medium text-primary">${dimension.format(value)}</span>
                      </div>
                    </div>
                  </div>
                `);
              
              positionTooltip(event);
      }).on("mousemove", function(event: MouseEvent) {
        positionTooltip(event);
      }).on("mouseout", function() {
        setHoveredType(null);
        d3.select(`.type-path-${d.type}`)
          .attr("stroke-width", selectedType === d.type ? 4 : 3)
          .attr("opacity", selectedType === d.type ? 1 : 0.7);
        
        d3.select(tooltipRef.current)
          .style("opacity", 0);
      });
    });

  });

  }, [loading, pokemonData, selectedFormat, calculateTypeStats, selectedType]);



  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type Performance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full">
          <svg ref={svgRef} className="w-full" />
          <div 
            ref={tooltipRef}
            className={cn(
              "absolute pointer-events-none opacity-0 transition-opacity",
              "bg-card text-card-foreground", // Add theme-aware background and text color
              "rounded-lg border shadow-lg p-3", // Add proper padding and border
              "z-50"
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}