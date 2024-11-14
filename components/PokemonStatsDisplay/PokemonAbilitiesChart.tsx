import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface Ability {
  ability: {
    name: string;
    url: string;
  };
  is_hidden?: boolean;
}

interface AbilityDetails {
  name: string;
  effect: string;
  usage?: number;
  is_hidden?: boolean;
}

interface PokemonAbilitiesProps {
  abilities: Ability[];
  pokemonName: string;
  generation: string;
  format: string;
}

export function PokemonAbilities({ 
  abilities, 
  pokemonName,
  generation,
  format 
}: PokemonAbilitiesProps) {
  const [abilityDetails, setAbilityDetails] = useState<AbilityDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAbilities, setOpenAbilities] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    async function fetchAbilityDetails() {
      setLoading(true);
      try {
        const abilityPromises = abilities.map(async ({ ability, is_hidden }) => {
          const response = await fetch(ability.url);
          const data = await response.json();
          
          const effectEntry = data.effect_entries.find((entry: any) => 
            entry.language.name === 'en'
          );
          
          return {
            name: ability.name,
            effect: effectEntry?.effect || 'No description available',
            is_hidden
          };
        });

        const usageResponse = await fetch(
          `/api/pokemon/abilities/${pokemonName}?generation=${generation}&battle_format=${format}`
        );
        const usageData = await usageResponse.json();

        const details = await Promise.all(abilityPromises);
        const detailsWithUsage = details.map(detail => {
          const usageInfo = usageData.data?.find((d: any) => 
            d.ability.toLowerCase() === detail.name.replace(/-/g, ' ')
          );
          return {
            ...detail,
            usage: usageInfo?.usage
          };
        });

        setAbilityDetails(detailsWithUsage);
      } catch (error) {
        console.error('Error fetching ability details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAbilityDetails();
  }, [abilities, pokemonName, generation, format]);

  const formatAbilityName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Abilities</h2>
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Abilities</h2>
      <div className="space-y-2">
        {abilityDetails.map((ability) => (
          <Collapsible
            key={ability.name}
            open={openAbilities[ability.name]}
            onOpenChange={(isOpen) => 
              setOpenAbilities(prev => ({...prev, [ability.name]: isOpen}))
            }
          >
            <div className="flex items-center gap-2">
              <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-75 transition">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    openAbilities[ability.name] ? 'transform rotate-180' : ''
                  }`}
                />
                <span className="font-medium">
                  {formatAbilityName(ability.name)}
                </span>
              </CollapsibleTrigger>
              {ability.is_hidden && (
                <Badge variant="secondary" className="text-xs">Hidden</Badge>
              )}
              {ability.usage !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {ability.usage.toFixed(1)}% Usage
                </Badge>
              )}
            </div>
            
            <CollapsibleContent className="pt-2 pl-6">
              <p className="text-muted-foreground">
                {ability.effect}
              </p>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}