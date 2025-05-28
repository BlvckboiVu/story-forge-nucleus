
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, PenTool, Folder, Download } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-border bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">StoryForge</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to StoryForge
          </h1>
          <p className="text-xl mb-8 text-muted-foreground max-w-2xl mx-auto">
            Your all-in-one writing platform for crafting beautiful stories. 
            Write, organize, and publish with powerful tools designed for writers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link to="/signup">Start Writing Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center">
                <PenTool className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <CardTitle className="text-xl">Write</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Focus on your writing with a distraction-free editor and powerful formatting tools.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center">
                <Folder className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <CardTitle className="text-xl">Organize</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Keep your chapters, characters, and notes perfectly organized in one place.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <CardTitle className="text-xl">Collaborate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Work with editors and co-authors seamlessly with real-time collaboration.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center">
                <Download className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <CardTitle className="text-xl">Publish</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Export your work in multiple formats when you're ready to share with the world.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StoryForge - Write. Create. Publish.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
