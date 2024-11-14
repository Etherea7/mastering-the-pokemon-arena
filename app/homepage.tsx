'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ChartBar, Sword, Users, Zap, GitCompare } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      title: "Usage Statistics",
      description: "Track Pokemon popularity across different formats and generations",
      icon: <ChartBar className="w-10 h-10 text-blue-500" />,
      path: "/PokemonStats"
    },
    {
      title: "Team Analysis",
      description: "Build and analyze Pokemon teams with our interactive team builder",
      icon: <Users className="w-10 h-10 text-green-500" />,
      path: "/PokemonTeamChooser"
    },
    {
      title: "Battle Format Analysis",
      description: "Explore meta trends across different battle formats",
      icon: <Sword className="w-10 h-10 text-red-500" />,
      path: "/GenFormat"
    },
    {
      title: "Type Coverage",
      description: "Analyze type effectiveness and team coverage",
      icon: <Zap className="w-10 h-10 text-yellow-500" />,
      path: "/Types"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="pt-16 pb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Pokemon Stats Dashboard</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(feature.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  {feature.icon}
                  <div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Usage Dashboard Preview */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Live Usage Dashboard</CardTitle>
            <CardDescription>
              Track real-time Pokemon usage statistics across different formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <GitCompare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => router.push('/PokemonUsageDashboard')}
              >
                View Usage Stats
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600 text-white py-16 mt-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Your Perfect Team?
          </h2>
          <p className="text-lg mb-8 text-blue-100">
            Use our team builder to create and analyze your Pokemon teams
          </p>
          <Button 
            className="bg-white text-blue-600 hover:bg-blue-50"
            size="lg"
            onClick={() => router.push('/PokemonTeamChooser')}
          >
            Build Your Team
          </Button>
        </div>
      </div>
    </div>
  );
}
