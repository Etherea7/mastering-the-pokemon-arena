'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  const features = [
    {
      title: "Pokemon Stats",
      description: "Track Pokemon statistics and analytics",
      path: "/PokemonStats"
    },
    {
      title: "Format/Generation",
      description: "Explore different battle formats and generations",
      path: "/GenFormat"
    },
    {
      title: "Types",
      description: "Analyze Pokemon type matchups and effectiveness",
      path: "/Types"
    },
    {
      title: "TeamChooser",
      description: "Build and analyze Pokemon teams interactively",
      path: "/PokemonTeamChooser"
    },
    {
      title: "Usage Stats",
      description: "Track Pokemon usage rates and trends",
      path: "/PokemonUsageDashboard"
    },
    {
      title: "Moves",
      description: "Analyze Pokemon moves and their effectiveness",
      path: "/Moves"
    }
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/pokemon_wallpaper.jpg)' }}
    >
      <div className="min-h-screen bg-black/50 backdrop-blur-sm">
        {/* Hero Section */}
        <div className="pt-16 pb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-white">Pokemon Stats Dashboard</h1>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Comprehensive Pokemon statistics, team analysis, and battle format insights
            to help you become a better trainer.
          </p>
          <Button 
            className="bg-blue-500 hover:bg-blue-600"
            size="lg"
            onClick={() => router.push('/PokemonStats')}
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="bg-slate-900/80 border-slate-800 backdrop-blur-sm hover:bg-slate-900/90 transition-colors cursor-pointer"
                onClick={() => router.push(feature.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <img 
                      src="/pokeball.png" 
                      alt="pokeball" 
                      className="w-6 h-6" 
                    />
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-gray-400 text-sm">
            Click any card to navigate to its section
          </p>
        </div>
      </div>
    </div>
  );
}