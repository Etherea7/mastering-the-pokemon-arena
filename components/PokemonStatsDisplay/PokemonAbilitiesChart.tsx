import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    async function fetchAbilityDetails() {
      setLoading(true);
      try {
        // Fetch ability descriptions from PokeAPI
        const abilityPromises = abilities.map(async ({ ability, is_hidden }) => {
          const response = await fetch(ability.url);
          const data = await response.json();
          
          // Get English effect text
          const effectEntry = data.effect_entries.find((entry: any) => 
            entry.language.name === 'en'
          );
          
          return {
            name: ability.name,
            effect: effectEntry?.effect || 'No description available',
            is_hidden
          };
        });

        // Fetch usage data from your API
        const usageResponse = await fetch(
          `/api/pokemon/abilities/${pokemonName}?generation=${generation}&battle_format=${format}`
        );
        const usageData = await usageResponse.json();

        // Combine ability details with usage data
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
      <Card>
        <CardHeader>
          <CardTitle>Abilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abilities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {abilityDetails.map((ability) => (
            <div
              key={ability.name}
              className="p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">
                  {formatAbilityName(ability.name)}
                </h3>
                {ability.is_hidden && (
                  <Badge variant="secondary">Hidden</Badge>
                )}
                {ability.usage !== undefined && (
                  <Badge variant="outline">{ability.usage.toFixed(1)}% Usage</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {ability.effect}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}