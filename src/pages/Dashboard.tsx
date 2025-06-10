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
import { Layout } from '@/components/layout/Layout';
import { formatDate } from '@/utils/dateUtils';

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

  return (
    <Layout mode="contained">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleCreateProject}>New Project</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleProjectClick(project.id)}
            >
              <h3 className="font-semibold">{project.title}</h3>
              <p className="text-sm text-muted-foreground">
                Last updated: {formatDate(project.updatedAt)}
              </p>
            </Card>
          ))}
        </div>

        {recentDrafts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Drafts</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentDrafts.map((draft) => (
                <Card
                  key={draft.id}
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleDraftClick(draft.id)}
                >
                  <h3 className="font-semibold">{draft.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Last edited: {formatDate(draft.updatedAt)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
