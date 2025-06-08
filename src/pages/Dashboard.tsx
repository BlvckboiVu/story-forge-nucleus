
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, FileText, Edit, Trash2, Book, Coins, Zap, TrendingUp, Target, Clock } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { getDrafts, type Draft } from '@/lib/db';

export default function Dashboard() {
  const [recentDrafts, setRecentDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { projects, createProject, currentProject, setCurrentProject, deleteProject } = useProjects();
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

  const handleEditProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    // TODO: Implement edit functionality
    toast({
      title: "Coming Soon",
      description: "Project editing will be available soon",
    });
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        toast({
          title: "Project deleted",
          description: "Project has been successfully deleted",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      }
    }
  };

  const handleDraftClick = (draftId: string) => {
    navigate(`/app/editor/${draftId}`);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const totalWords = recentDrafts.reduce((sum, draft) => sum + draft.wordCount, 0);
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  
  return (
    <div className="h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </p>
        </div>
        <Button onClick={handleCreateProject} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
        {/* Projects Section */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No projects yet</p>
                    <p className="text-xs">Create your first project to get started</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-3 hover:bg-accent cursor-pointer border-b border-border/50 last:border-b-0"
                        onClick={() => handleProjectClick(project.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{project.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(project.updatedAt)} • {project.status}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => handleEditProject(e, project.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => handleDeleteProject(e, project.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-accent rounded-lg">
                  <div className="text-xl font-bold">{projects.length}</div>
                  <div className="text-xs text-muted-foreground">Projects</div>
                </div>
                <div className="text-center p-3 bg-accent rounded-lg">
                  <div className="text-xl font-bold">{recentDrafts.length}</div>
                  <div className="text-xs text-muted-foreground">Drafts</div>
                </div>
                <div className="text-center p-3 bg-accent rounded-lg">
                  <div className="text-xl font-bold">{totalWords.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Words</div>
                </div>
                <div className="text-center p-3 bg-accent rounded-lg">
                  <div className="text-xl font-bold">{completedProjects}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>This week: {recentDrafts.filter(d => 
                    new Date(d.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                  ).length} drafts updated</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Word goal: {currentProject?.wordCountGoal?.toLocaleString() || 'Not set'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sandbox */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Sandbox
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Coming Soon</p>
                <p className="text-xs">Experimental features will appear here</p>
              </div>
            </CardContent>
          </Card>

          {/* Story Bible Library */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Book className="h-5 w-5" />
                Bible Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                <Book className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No story bibles created yet</p>
                {currentProject && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => navigate('/app/story-bible')}
                  >
                    Create Story Bible
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Token Shop */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Token Shop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                <Coins className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Coming Soon</p>
                <p className="text-xs">AI tokens and credits will be available here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
