import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { typeColors } from '@/constants/gendata';

interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

interface EVs {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

interface Nature {
  name: string;
  increased?: keyof PokemonStats;
  decreased?: keyof PokemonStats;
}

interface AbilityData {
    name: string;
    Ability: string;
    Usage: number;
  }
  
  interface ItemData {
    name: string;
    Item: string;
    Usage: number;
  }
  
  interface MoveData {
    name: string;
    Move: string;
    Usage: number;
  }
  
  interface SpreadData {
    name: string;
    Nature: string;
    hp_ev: number;
    atk_ev: number;
    def_ev: number;
    spatk_ev: number;
    spdef_ev: number;
    spd_ev: number;
    Usage: number;
  }

interface PokemonSetup {
  ability: string;
  item: string;
  moves: string[];
  nature: Nature;
  evs: EVs;
  stats: PokemonStats;
}

interface RecommendedSetup {
  ability: { name: string; usage: number }[];
  item: { name: string; usage: number }[];
  moves: { name: string; usage: number }[];
  spreads: {
    nature: string;
    evs: EVs;
    usage: number;
  }[];
}

interface PokemonSetupModalProps {
  open: boolean;
  onClose: () => void;
  pokemon: {
    name: string;
    sprite?: string;
    types?: string[];
    stats: PokemonStats;
  };
  generation: string;
  format: string;
  onSetupComplete: (setup: PokemonSetup) => void;
}

const NATURES: Nature[] = [
  { name: 'Hardy' },
  { name: 'Lonely', increased: 'attack', decreased: 'defense' },
  { name: 'Brave', increased: 'attack', decreased: 'speed' },
  { name: 'Adamant', increased: 'attack', decreased: 'special_attack' },
  { name: 'Naughty', increased: 'attack', decreased: 'special_defense' },
  { name: 'Bold', increased: 'defense', decreased: 'attack' },
  { name: 'Docile' },
  { name: 'Relaxed', increased: 'defense', decreased: 'speed' },
  { name: 'Impish', increased: 'defense', decreased: 'special_attack' },
  { name: 'Lax', increased: 'defense', decreased: 'special_defense' },
  { name: 'Timid', increased: 'speed', decreased: 'attack' },
  { name: 'Hasty', increased: 'speed', decreased: 'defense' },
  { name: 'Serious' },
  { name: 'Jolly', increased: 'speed', decreased: 'special_attack' },
  { name: 'Naive', increased: 'speed', decreased: 'special_defense' },
  { name: 'Modest', increased: 'special_attack', decreased: 'attack' },
  { name: 'Mild', increased: 'special_attack', decreased: 'defense' },
  { name: 'Quiet', increased: 'special_attack', decreased: 'speed' },
  { name: 'Bashful' },
  { name: 'Rash', increased: 'special_attack', decreased: 'special_defense' },
  { name: 'Calm', increased: 'special_defense', decreased: 'attack' },
  { name: 'Gentle', increased: 'special_defense', decreased: 'defense' },
  { name: 'Sassy', increased: 'special_defense', decreased: 'speed' },
  { name: 'Careful', increased: 'special_defense', decreased: 'special_attack' },
  { name: 'Quirky' }
];
const MAX_TOTAL_EVS = 510;

const isGen12 = (generation: string) => {
  return generation === 'gen1' || generation === 'gen2';
};

const calculateTotalEVs = (evs: EVs): number => {
  return Object.values(evs).reduce((sum, value) => sum + value, 0);
};

const validateNewEV = (
  currentEVs: EVs, 
  stat: keyof EVs, 
  newValue: number
): number | null => {
  const currentTotal = calculateTotalEVs(currentEVs);
  const difference = newValue - (currentEVs[stat] || 0);
  
  if (currentTotal + difference > MAX_TOTAL_EVS) {
    // Calculate max allowed value for this stat
    const remainingPoints = MAX_TOTAL_EVS - (currentTotal - currentEVs[stat]);
    return Math.min(newValue, remainingPoints);
  }
  
  return newValue;
};
// Pokemon stat calculation formula
const calculateStat = (
  baseStat: number,
  ev: number,
  nature: Nature,
  statName: keyof PokemonStats,
  level: number = 50
): number => {
  // HP has a different formula
  if (statName === 'hp') {
    return Math.floor(((2 * baseStat + 31 + Math.floor(ev/4)) * level) / 100) + level + 10;
  }

  // For other stats
  let natureMod = 1;
  if (nature.increased === statName) natureMod = 1.1;
  if (nature.decreased === statName) natureMod = 0.9;

  return Math.floor((Math.floor(((2 * baseStat + 31 + Math.floor(ev/4)) * level) / 100) + 5) * natureMod);
};

const aggregateData = <T extends { Usage: number }>(
    data: T[],
    getKey: (item: T) => string
  ): { name: string; usage: number }[] => {
    const aggregated = data.reduce((acc, item) => {
      const key = getKey(item);
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0 };
      }
      acc[key].total += item.Usage;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
  
    return Object.entries(aggregated)
      .map(([key, { total, count }]) => ({
        name: key,
        usage: total / count
      }))
      .sort((a, b) => b.usage - a.usage);
  };
  
  const aggregateSpreads = (data: SpreadData[]): RecommendedSetup['spreads'] => {
    // Create a map using Nature + EVs as the key
    const spreadMap = new Map<string, {
      nature: string;
      evs: EVs;
      totalUsage: number;
      count: number;
    }>();
  
    data.forEach(spread => {
      // Create a unique key for this spread combination
      const key = `${spread.Nature}-${spread.hp_ev}-${spread.atk_ev}-${spread.def_ev}-${spread.spatk_ev}-${spread.spdef_ev}-${spread.spd_ev}`;
      
      if (!spreadMap.has(key)) {
        spreadMap.set(key, {
          nature: spread.Nature,
          evs: {
            hp: spread.hp_ev,
            attack: spread.atk_ev,
            defense: spread.def_ev,
            special_attack: spread.spatk_ev,
            special_defense: spread.spdef_ev,
            speed: spread.spd_ev
          },
          totalUsage: 0,
          count: 0
        });
      }
  
      const stats = spreadMap.get(key)!;
      stats.totalUsage += spread.Usage;
      stats.count += 1;
    });
  
    // Convert to array and calculate average usage
    return Array.from(spreadMap.values())
      .map(({ nature, evs, totalUsage, count }) => ({
        nature,
        evs,
        usage: totalUsage / count
      }))
      .sort((a, b) => b.usage - a.usage);
  };

export function PokemonSetupModal({
  open,
  onClose,
  pokemon,
  generation,
  format,
  onSetupComplete
}: PokemonSetupModalProps) {
  const [recommendedSetups, setRecommendedSetups] = useState<RecommendedSetup | null>(null);
  const [currentSetup, setCurrentSetup] = useState<PokemonSetup>(() => {
    const defaultEVs: EVs = {
      hp: 0,
      attack: 0,
      defense: 0,
      special_attack: 0,
      special_defense: 0,
      speed: 0
    };

    const defaultStats: PokemonStats = {
      hp: pokemon.stats?.hp || 0,
      attack: pokemon.stats?.attack || 0,
      defense: pokemon.stats?.defense || 0,
      special_attack: pokemon.stats?.special_attack || 0,
      special_defense: pokemon.stats?.special_defense || 0,
      speed: pokemon.stats?.speed || 0
    };

    return {
      ability: '',
      item: '',
      moves: [],
      nature: NATURES[0],
      evs: defaultEVs,
      stats: defaultStats
    };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentSetup(prev => ({
      ...prev,
      stats: {
        hp: pokemon.stats?.hp || 0,
        attack: pokemon.stats?.attack || 0,
        defense: pokemon.stats?.defense || 0,
        special_attack: pokemon.stats?.special_attack || 0,
        special_defense: pokemon.stats?.special_defense || 0,
        speed: pokemon.stats?.speed || 0
      }
    }));
  }, [pokemon]);


  const handleEVChange = (stat: keyof EVs, newValue: number) => {
    if (isGen12(generation)) return;
    
    const validatedValue = validateNewEV(currentSetup.evs, stat, newValue);
    if (validatedValue !== null) {
      setCurrentSetup(prev => ({
        ...prev,
        evs: {
          ...prev.evs,
          [stat]: validatedValue
        }
      }));
    }
  };

  useEffect(() => {
    const fetchRecommendedSetups = async () => {
      setLoading(true);
      try {
        // Fetch abilities, items, moves, and spreads in parallel
        const [abilitiesRes, itemsRes, movesRes, spreadsRes] = await Promise.all([
          fetch(`/api/pokemon/abilities?name=${pokemon.name}&generation=${generation}&battle_format=${format}`),
          fetch(`/api/pokemon/items?name=${pokemon.name}&generation=${generation}&battle_format=${format}`),
          fetch(`/api/pokemon/moves?name=${pokemon.name}&generation=${generation}&battle_format=${format}`),
          fetch(`/api/pokemon/spreads?name=${pokemon.name}&generation=${generation}&battle_format=${format}`)
        ]);

        const [abilities, items, moves, spreads] = await Promise.all([
          abilitiesRes.json(),
          itemsRes.json(),
          movesRes.json(),
          spreadsRes.json()
        ]);
     

        const aggregatedSetups = {
            ability: aggregateData(abilities.data || [], (item: AbilityData) => item.Ability),
            item: aggregateData(items.data || [], (item: ItemData) => item.Item),
            moves: aggregateData(moves.data || [], (item: MoveData) => item.Move),
            spreads: aggregateSpreads(spreads.data || [])
          };
      
          setRecommendedSetups(aggregatedSetups);
      

        // Set initial setup from most popular options
        setCurrentSetup(prev => ({
          ...prev,
          ability: abilities.data?.[0]?.name || prev.ability,
          item: items.data?.[0]?.name || prev.item,
          moves: moves.data ? moves.data.slice(0, 4).map((move: any) => move.name) : prev.moves,
          nature: spreads.data?.[0] ? 
            (NATURES.find(n => n.name === spreads.data[0].Nature) || prev.nature) : 
            prev.nature,
          evs: spreads.data?.[0] ? {
            hp: spreads.data[0].hp_ev,
            attack: spreads.data[0].atk_ev,
            defense: spreads.data[0].def_ev,
            special_attack: spreads.data[0].spatk_ev,
            special_defense: spreads.data[0].spdef_ev,
            speed: spreads.data[0].spd_ev
          } : prev.evs
        }));

      } catch (error) {
        console.error('Failed to fetch recommended setups:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchRecommendedSetups();
    }
  }, [open, pokemon.name, generation, format]);

  // Update stats whenever nature or EVs change
  useEffect(() => {
    if (!pokemon.stats || !currentSetup.evs) return;

    const newStats = {
      hp: calculateStat(pokemon.stats.hp, currentSetup.evs.hp, currentSetup.nature, 'hp'),
      attack: calculateStat(pokemon.stats.attack, currentSetup.evs.attack, currentSetup.nature, 'attack'),
      defense: calculateStat(pokemon.stats.defense, currentSetup.evs.defense, currentSetup.nature, 'defense'),
      special_attack: calculateStat(pokemon.stats.special_attack, currentSetup.evs.special_attack, currentSetup.nature, 'special_attack'),
      special_defense: calculateStat(pokemon.stats.special_defense, currentSetup.evs.special_defense, currentSetup.nature, 'special_defense'),
      speed: calculateStat(pokemon.stats.speed, currentSetup.evs.speed, currentSetup.nature, 'speed')
    };

    setCurrentSetup(prev => ({ ...prev, stats: newStats }));
  }, [currentSetup.nature, currentSetup.evs, pokemon.stats]);

  const handleSave = () => {
    onSetupComplete(currentSetup);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {pokemon.sprite && (
              <Image
                src={pokemon.sprite}
                alt={pokemon.name}
                width={32}
                height={32}
                className="pixelated"
              />
            )}
            <span>Setup {pokemon.name}</span>
            <div className="flex gap-1 ml-2">
              {pokemon.types?.map(type => (
                <Badge
                  key={type}
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    typeColors[type.toLowerCase()]?.bg,
                    typeColors[type.toLowerCase()]?.text
                  )}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Left column: Current setup */}
          <div className="space-y-4">         
            <div>
              <Label>Nature</Label>
              <Select
                value={currentSetup.nature.name}
                onValueChange={(value) => {
                  const nature = NATURES.find(n => n.name === value) || NATURES[0];
                  setCurrentSetup(prev => ({ ...prev, nature }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nature" />
                </SelectTrigger>
                <SelectContent>
                  {NATURES.map((nature) => (
                    <SelectItem key={nature.name} value={nature.name}>
                      {nature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>EVs</Label>
                <span className="text-sm text-muted-foreground">
                  Total: {calculateTotalEVs(currentSetup.evs)}/510
                </span>
              </div>
              
              {isGen12(generation) ? (
                <div className="text-sm text-muted-foreground italic">
                  EVs are not available in Generation 1-2
                </div>
              ) : (
                <>
                  {Object.entries(currentSetup.evs).map(([stat, value]) => (
                    <div key={stat} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm capitalize">
                          {stat.replace('_', ' ')}
                        </span>
                        <span className="text-sm">{value}</span>
                      </div>
                      <Slider
                        value={[value]}
                        min={0}
                        max={252}
                        step={4}
                        onValueChange={([newValue]) => handleEVChange(stat as keyof EVs, newValue)}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Setup
            </Button>
          </div>

          {/* Right column: Recommendations */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 p-4">

            <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2">Calculated Stats</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(currentSetup.stats).map(([stat, value]) => (
                      <div key={stat} className="flex justify-between">
                        <span className="capitalize text-muted-foreground">
                          {stat.replace('_', ' ')}
                        </span>
                        <span className="font-medium">{Math.floor(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2">Common Spreads</h3>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4 pr-4">
                      {recommendedSetups?.spreads.map(({ nature, evs, usage }, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-2 rounded-lg border cursor-pointer hover:bg-accent",
                            isGen12(generation) && "opacity-50 pointer-events-none"
                          )}
                          onClick={() => {
                            if (!isGen12(generation)) {
                              setCurrentSetup(prev => ({
                                ...prev,
                                nature: NATURES.find(n => n.name === nature) || NATURES[0],
                                evs
                              }));
                            }
                          }}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{nature}</span>
                            <span className="text-sm">({(usage).toFixed(1)}%)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                            {Object.entries(evs).map(([stat, value]) => (
                              <div key={stat} className="text-sm flex justify-between">
                                <span className="capitalize text-muted-foreground">
                                  {stat.replace('_', ' ')}
                                </span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>


              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2">Recommended Moves</h3>
                  <div className="space-y-4">

                    <div className="space-y-1">
                      {recommendedSetups?.moves.slice(0, 8).map(({ name, usage }) => (
                        <Badge
                          key={name}
                          variant={currentSetup.moves.includes(name) ? "default" : "secondary"}
                          className="mr-1 cursor-pointer"
                          onClick={() => {
                            if (!currentSetup.moves.includes(name) && currentSetup.moves.length < 4) {
                              setCurrentSetup(prev => ({
                                ...prev,
                                moves: [...prev.moves, name].slice(0, 4)
                              }));
                            }
                          }}
                        >
                          {name} ({(usage * 100).toFixed(1)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2">Recommended Abilities</h3>
                  <div className="space-y-1">
                    {recommendedSetups?.ability.map(({ name, usage }) => (
                      <Badge
                        key={name}
                        variant={currentSetup.ability === name ? "default" : "secondary"}
                        className="mr-1 cursor-pointer"
                        onClick={() => setCurrentSetup(prev => ({ ...prev, ability: name }))}
                      >
                        {name} ({(usage).toFixed(1)}%)
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2">Recommended Items</h3>
                  <div className="space-y-1">
                    {recommendedSetups?.item.map(({ name, usage }) => (
                      <Badge
                        key={name}
                        variant={currentSetup.item === name ? "default" : "secondary"}
                        className="mr-1 cursor-pointer"
                        onClick={() => setCurrentSetup(prev => ({ ...prev, item: name }))}
                      >
                        {name} ({(usage).toFixed(1)}%)
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}