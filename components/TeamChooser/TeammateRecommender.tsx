import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const BATTLE_FORMATS = ['ou', 'uu', 'ru', 'nu', 'pu'];
const GENERATIONS = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9'];
const YEARS = Array.from({length: 5}, (_, i) => (2024 - i).toString());
const MONTHS = [
  '01', '02', '03', '04', '05', '06', 
  '07', '08', '09', '10', '11', '12'
];

const PokemonTeammateViewer = () => {
  const [allPokemon, setAllPokemon] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ou');
  const [selectedGen, setSelectedGen] = useState('gen9');
  const [startYear, setStartYear] = useState('2024');
  const [startMonth, setStartMonth] = useState('01');
  const [endYear, setEndYear] = useState('2024');
  const [endMonth, setEndMonth] = useState('12');
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPokemonList() {
      try {
        const res = await fetch('/api/pokemon');
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllPokemon(data);
        }
      } catch (error) {
        console.error('Failed to fetch Pokemon list:', error);
      }
    }
    fetchPokemonList();
  }, []);

  useEffect(() => {
    async function fetchTeammates() {
      if (!selectedPokemon || !selectedFormat || !selectedGen) return;
      
      setLoading(true);
      try {
        const startDate = `${startYear}-${startMonth}`;
        const endDate = `${endYear}-${endMonth}`;
        
        // Validate date range
        if (startDate > endDate) {
          throw new Error('Start date must be before end date');
        }

        const formatPokemonName = (name) => {
          return name
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('-');
        };

        const url = `/api/pokemon/teammates/${formatPokemonName(selectedPokemon)}`;
        const queryParams = new URLSearchParams({
          generation: selectedGen,
          battle_format: selectedFormat,
          start_date: startDate,
          end_date: endDate
        });

        console.log('Fetching:', `${url}?${queryParams}`);
        const res = await fetch(`${url}?${queryParams}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch teammates');
        }

        // Check the structure of your data
        console.log('API Response:', data);

        // Assuming the API returns data in the format { data: [...] }
        const teammatesData = Array.isArray(data.teammates) ? data.teammates : [];
        
        const processedData = teammatesData
          .slice(0, 5)
          .map(teammate => ({
            name: formatPokemonName(teammate.teammate || teammate.name),
            usage: parseFloat(teammate.usage) || 0,
            year_month: teammate.year_month
          }))
          .filter(teammate => teammate.usage > 0)
          .sort((a, b) => b.usage - a.usage);

        console.log('Processed Data:', processedData);
        setTeammates(processedData);
      } catch (error) {
        console.error('Failed to fetch teammates:', error);
        setTeammates([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTeammates();
  }, [selectedPokemon, selectedFormat, selectedGen, startYear, startMonth, endYear, endMonth]);

  const formatPokemonName = (name) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow-lg rounded-lg border">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            Usage Rate: {payload[0].value.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Peak: {payload[0].payload.year_month}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Common Teammates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Battle Format" />
            </SelectTrigger>
            <SelectContent>
              {BATTLE_FORMATS.map(format => (
                <SelectItem key={format} value={format}>
                  {format.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedGen} onValueChange={setSelectedGen}>
            <SelectTrigger>
              <SelectValue placeholder="Generation" />
            </SelectTrigger>
            <SelectContent>
              {GENERATIONS.map(gen => (
                <SelectItem key={gen} value={gen}>
                  {gen.replace('gen', 'Gen ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPokemon} onValueChange={setSelectedPokemon}>
            <SelectTrigger>
              <SelectValue placeholder="Select a Pokemon" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-60">
                {allPokemon.map(pokemon => (
                  <SelectItem key={pokemon} value={pokemon}>
                    {formatPokemonName(pokemon)}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Start Date</h3>
            <div className="grid grid-cols-2 gap-2">
              <Select value={startYear} onValueChange={setStartYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month} value={month}>
                      {new Date(`2024-${month}-01`).toLocaleString('default', { month: 'short' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">End Date</h3>
            <div className="grid grid-cols-2 gap-2">
              <Select value={endYear} onValueChange={setEndYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month} value={month}>
                      {new Date(`2024-${month}-01`).toLocaleString('default', { month: 'short' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">Loading teammates...</div>
            </div>
          ) : teammates.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teammates}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={90}
                  style={{ fontSize: '0.875rem' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="usage" 
                  fill="#8884d8"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : selectedPokemon ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No teammate data found for selected date range
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select options above to see common teammates
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PokemonTeammateViewer;