
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("projects");
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      
      <Tabs defaultValue="projects" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="stats">Writing Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="space-y-4 mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Project cards placeholder */}
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="truncate">Sample Project {i + 1}</CardTitle>
                  <CardDescription>Last edited 2 days ago</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {10000 + (i * 5000)} words · {5 + i} chapters
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {/* Create new project card */}
            <Card className="border-dashed hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer flex flex-col items-center justify-center h-[140px]">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Create new project</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Words Written</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 w-full bg-muted/30 flex items-center justify-center">
                  <p className="text-muted-foreground">Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Writing Streaks</CardTitle>
                <CardDescription>Days in a row</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 w-full bg-muted/30 flex items-center justify-center">
                  <p className="text-muted-foreground">Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Projects Status</CardTitle>
                <CardDescription>Overall completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 w-full bg-muted/30 flex items-center justify-center">
                  <p className="text-muted-foreground">Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
