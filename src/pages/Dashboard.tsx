
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, FileText, Calendar, Book } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { getDrafts, type Draft } from '@/lib/db';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("projects");
  const [recentDrafts, setRecentDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { projects, createProject, currentProject, setCurrentProject } = useProjects();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentDrafts();
  }, [currentProject]);

  const loadRecentDrafts = async () => {
    if (!currentProject) {
      setLoading(false);
      return;
    }

    try {
      const drafts = await getDrafts(currentProject.id);
      const sortedDrafts = drafts.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ).slice(0, 5);
      setRecentDrafts(sortedDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user) return;

    try {
      const projectId = await createProject({
        title: `New Project ${projects.length + 1}`,
        description: 'A new writing project',
        isPublic: false,
        status: 'planning',
      });

      toast({
        title: "Project created",
        description: "Your new project is ready for writing!",
      });

      // Navigate to editor with the new project
      navigate('/app/editor');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new project",
        variant: "destructive",
      });
    }
  };

  const handleProjectClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      navigate('/app/editor');
    }
  };

  const handleDraftClick = (draftId: string) => {
    navigate(`/app/editor/${draftId}`);
  };

  const handleStoryBibleClick = () => {
    if (currentProject) {
      navigate('/app/story-bible');
    } else {
      toast({
        title: "No project selected",
        description: "Please select a project first to access its Story Bible",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! Ready to continue writing?
          </p>
        </div>
        <Button onClick={handleCreateProject} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Quick Actions */}
      {currentProject && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/app/editor')}
          >
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-primary mr-4" />
              <div>
                <h3 className="font-semibold">Continue Writing</h3>
                <p className="text-sm text-muted-foreground">Jump back into your current project</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleStoryBibleClick}
          >
            <CardContent className="flex items-center p-6">
              <Book className="h-8 w-8 text-primary mr-4" />
              <div>
                <h3 className="font-semibold">Story Bible</h3>
                <p className="text-sm text-muted-foreground">Manage characters, locations & lore</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleCreateProject}
          >
            <CardContent className="flex items-center p-6">
              <PlusCircle className="h-8 w-8 text-primary mr-4" />
              <div>
                <h3 className="font-semibold">New Project</h3>
                <p className="text-sm text-muted-foreground">Start a fresh writing project</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Tabs defaultValue="projects" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="stats">Writing Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="space-y-4 mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Existing projects */}
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="truncate">{project.title}</CardTitle>
                  <CardDescription>
                    {formatDate(project.updatedAt)} • {project.status}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {project.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>{project.wordCountGoal ? `Goal: ${project.wordCountGoal.toLocaleString()} words` : 'No word goal set'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Create new project card */}
            <Card 
              className="border-dashed hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer flex flex-col items-center justify-center h-[140px]"
              onClick={handleCreateProject}
            >
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Create new project</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent drafts section */}
          {recentDrafts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Recent Drafts</h2>
              <div className="grid gap-3">
                {recentDrafts.map((draft) => (
                  <Card 
                    key={draft.id}
                    className="hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => handleDraftClick(draft.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{draft.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {draft.wordCount.toLocaleString()} words • {formatDate(draft.updatedAt)}
                          </p>
                        </div>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Projects</CardTitle>
                <CardDescription>All time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-xs text-muted-foreground">
                  {projects.filter(p => p.status === 'completed').length} completed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total Drafts</CardTitle>
                <CardDescription>Across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentDrafts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {recentDrafts.reduce((sum, draft) => sum + draft.wordCount, 0).toLocaleString()} total words
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
                <CardDescription>Writing activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentDrafts.filter(draft => 
                    new Date(draft.updatedAt).getMonth() === new Date().getMonth()
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">Drafts updated</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
