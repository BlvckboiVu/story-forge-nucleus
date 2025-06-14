
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { OptimizedDraftService } from '@/utils/optimizedDb';
import { Draft } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { formatDate } from '@/utils/dateUtils';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { EnhancedDraftManager } from '@/components/drafts/EnhancedDraftManager';
import { Plus, BarChart3, FileText, Settings } from 'lucide-react';

export default function Dashboard() {
  const [recentDrafts, setRecentDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { projects, createProject, currentProject, setCurrentProject } = useProjects();
  const { toast } =

  useToast();
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
      const drafts = await OptimizedDraftService.getDraftsByProject(currentProject.id);
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

  return (
    <Layout mode="contained">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <Button onClick={handleCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="drafts">
              <FileText className="h-4 w-4 mr-2" />
              Drafts
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Projects Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {project.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {formatDate(project.updatedAt)}
                    </p>
                  </Card>
                ))}
                
                {projects.length === 0 && (
                  <Card className="p-8 text-center col-span-full">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first project to start writing
                    </p>
                    <Button onClick={handleCreateProject}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Project
                    </Button>
                  </Card>
                )}
              </div>
            </div>

            {/* Recent Drafts */}
            {recentDrafts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Drafts</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recentDrafts.map((draft) => (
                    <Card
                      key={draft.id}
                      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleDraftClick(draft.id)}
                    >
                      <h3 className="font-semibold">{draft.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {draft.wordCount?.toLocaleString() || 0} words
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last edited: {formatDate(draft.updatedAt)}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/app/editor')}>
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold">Start Writing</h3>
                  <p className="text-sm text-muted-foreground">Open the editor</p>
                </Card>
                
                <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={handleStoryBibleClick}>
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold">Story Bible</h3>
                  <p className="text-sm text-muted-foreground">Manage characters & world</p>
                </Card>
                
                <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <BarChart3 className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold">View Analytics</h3>
                  <p className="text-sm text-muted-foreground">Track your progress</p>
                </Card>
                
                <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <Settings className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-sm text-muted-foreground">Customize your experience</p>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drafts">
            <EnhancedDraftManager />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Application Settings</h3>
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
