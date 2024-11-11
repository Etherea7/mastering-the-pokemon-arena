import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface FormatVisualizationsProps {
  data: {
    pokemon: string;
    formats_compared: number;
    data_period: string;
    format_stats: {
      distribution: {
        S_tier: number;
        A_tier: number;
        B_tier: number;
        C_tier: number;
      };
      format_tiers: {
        S_tier: string[];
        A_tier: string[];
        B_tier: string[];
        C_tier: string[];
      };
    };
    analysis: {
      best_performing_formats: {
        viability_ceiling: number;
        formats: string[];
      };
      most_challenging_formats: {
        viability_ceiling: number;
        formats: string[];
      };
      average_viability: number;
    };
  };
}

const FormatVisualizations: React.FC<FormatVisualizationsProps> = ({ data }) => {
  // Transform data for the bar chart
  const chartData = Object.entries(data.format_stats.distribution).map(([name, value]) => ({
    name: name.replace('_tier', ''),
    value
  }));

  return (
    <div className="space-y-8 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{data.pokemon} Format Performance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold">Best Formats</h3>
              <div className="mt-2">
                {data.analysis.best_performing_formats.formats.map((format) => (
                  <span 
                    key={format}
                    className="inline-block bg-green-100 text-green-800 rounded px-2 py-1 m-1 text-sm"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold">Most Challenging</h3>
              <div className="mt-2">
                {data.analysis.most_challenging_formats.formats.map((format) => (
                  <span 
                    key={format}
                    className="inline-block bg-red-100 text-red-800 rounded px-2 py-1 m-1 text-sm"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold">Overall Stats</h3>
              <div className="mt-2 space-y-2">
                <p>Average Viability: {data.analysis.average_viability}</p>
                <p>Formats Analyzed: {data.formats_compared}</p>
                <p>Data Period: {data.data_period}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormatVisualizations;