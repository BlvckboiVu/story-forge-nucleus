
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PenTool, BookOpen, Settings, Plus, FileText, Clock, TrendingUp } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { EnhancedDraftManager } from '@/components/drafts/EnhancedDraftManager';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { DraftService } from '@/services/draftService';
import { formatDate } from '@/utils/dateUtils';

interface RecentDraft {
  id: string;
  title: string;
  projectTitle: string;
  lastModified: Date;
  wordCount: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, currentProject, setCurrentProject } = useProjects();
  const [recentDrafts, setRecentDrafts] = useState<RecentDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  const loadRecentDrafts = async () => {
    try {
      setLoadingDrafts(true);
      const allDrafts = await Promise.all(
        projects.map(async (project) => {
          const drafts = await DraftService.getDraftsByProject(project.id);
          return drafts.slice(0, 3).map(draft => ({
            id: draft.id,
            title: draft.title,
            projectTitle: project.title,
            lastModified: new Date(draft.updatedAt),
            wordCount: draft.wordCount || 0
          }));
        })
      );
      
      const flatDrafts = allDrafts.flat();
      const sortedDrafts = flatDrafts
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
        .slice(0, 5);
      
      setRecentDrafts(sortedDrafts);
    } catch (error) {
      console.error('Failed to load recent drafts:', error);
      setRecentDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    if (projects.length > 0) {
      loadRecentDrafts();
    } else {
      setLoadingDrafts(false);
    }
  }, [projects]);

  const handleRefreshDrafts = () => {
    loadRecentDrafts();
  };

  const handleCreateProject = () => {
    navigate('/app/editor');
  };

  const handleOpenProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      navigate(`/app/editor/${projectId}`);
    }
  };

  const handleOpenDraft = (draftId: string, projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      navigate(`/app/editor/${projectId}?draft=${draftId}`);
    }
  };

  return (
    <Layout mode="contained">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Continue your writing journey.
            </p>
          </div>
          <Button onClick={handleCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projects</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active writing projects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Drafts</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentDrafts.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Recently modified
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentDrafts.reduce((total, draft) => total + draft.wordCount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all drafts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Writing Streak</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7</div>
                  <p className="text-xs text-muted-foreground">
                    Days this week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Projects */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>
                    Your most recently active writing projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projects.length === 0 ? (
                    <div className="text-center py-6">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No projects yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create your first project to start writing
                      </p>
                      <Button onClick={handleCreateProject} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </div>
                  ) : (
                    projects.slice(0, 5).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleOpenProject(project.id)}
                      >
                        <div className="space-y-1">
                          <h4 className="font-medium">{project.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {project.description || 'No description'}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {formatDate(new Date(project.updatedAt))}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent Drafts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Drafts</CardTitle>
                  <CardDescription>
                    Your most recently modified drafts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingDrafts ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentDrafts.length === 0 ? (
                    <div className="text-center py-6">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No drafts yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create your first draft to start writing
                      </p>
                      <Button onClick={handleCreateProject} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Start Writing
                      </Button>
                    </div>
                  ) : (
                    recentDrafts.map((draft) => {
                      const project = projects.find(p => p.title === draft.projectTitle);
                      return (
                        <div
                          key={draft.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => project && handleOpenDraft(draft.id, project.id)}
                        >
                          <div className="space-y-1">
                            <h4 className="font-medium">{draft.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {draft.projectTitle} • {draft.wordCount.toLocaleString()} words
                            </p>
                          </div>
                          <Badge variant="outline">
                            {formatDate(draft.lastModified)}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="drafts">
            <EnhancedDraftManager onDraftChange={handleRefreshDrafts} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Manage your account and application preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/app/settings')}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Open Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
