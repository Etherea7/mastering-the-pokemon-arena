'use client'
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import GenAnalysis from "@/components/generation/GenAnalysis"
import FormatAnalysisPage  from "@/components/format/FormatPage"


export default function AnalysisPage() {
    const [activeTab] = useState('format');
  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <div className="container mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pokemon Analysis Dashboard</CardTitle>
            <CardDescription>
              Analyze Pokemon data across different generations and competitive formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="format" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="format">Format Analysis</TabsTrigger>
                <TabsTrigger value="generation">Generation Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="format" className="space-y-4" >
                <FormatAnalysisPage isVisible={activeTab === 'format'} />
              </TabsContent>
              
              <TabsContent value="generation" className="space-y-4" >
                <GenAnalysis />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}