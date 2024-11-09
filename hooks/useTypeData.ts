// hooks/useTypeData.ts
import { useEffect, useState } from 'react';

export type DamageRelations = {
    double_damage_from: { name: string; url: string }[];
    double_damage_to: { name: string; url: string }[];
    half_damage_from: { name: string; url: string }[];
    half_damage_to: { name: string; url: string }[];
    no_damage_from: { name: string; url: string }[];
    no_damage_to: { name: string; url: string }[];
  };
  
  export type TypeData = {
    name: string;
    damage_relations: DamageRelations;
  };
  
  export const useTypeData = () => {
    const [typeData, setTypeData] = useState<TypeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchTypeData = async () => {
        try {
          // First get list of types
          const response = await fetch('/api/pokeapi/types');
          const { data: types } = await response.json();
          
          // Then fetch detailed data for each type
          const detailedData = await Promise.all(
            types.map(async (type: { url: string }) => {
              const res = await fetch(type.url);
              return res.json();
            })
          );
          
          setTypeData(detailedData);
        } catch (err) {
          setError('Failed to fetch type data');
        } finally {
          setLoading(false);
        }
      };
  
      fetchTypeData();
    }, []);
  
    return { typeData, loading, error };
  };