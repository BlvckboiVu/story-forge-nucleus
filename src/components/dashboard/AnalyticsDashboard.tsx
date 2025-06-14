
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  FileText, 
  Zap, 
  AlertTriangle, 
  Download,
  BarChart3,
  Target
} from 'lucide-react';

interface AnalyticsProps {
  className?: string;
}

export function AnalyticsDashboard({ className }: AnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      // Load from localStorage
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      const sessions = JSON.parse(localStorage.getItem('writing_sessions') || '[]');
      
      // Calculate metrics
      const totalWords = sessions.reduce((sum: number, s: any) => sum + s.words, 0);
      const totalSessions = sessions.length;
      const avgWordsPerSession = totalSessions > 0 ? Math.round(totalWords / totalSessions) : 0;
      const totalWritingTime = sessions.reduce((sum: number, s: any) => sum + s.duration, 0) / (1000 * 60); // minutes
      
      // Recent activity (last 7 days)
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentSessions = sessions.filter((s: any) => new Date(s.start).getTime() > weekAgo);
      const recentWords = recentSessions.reduce((sum: number, s: any) => sum + s.words, 0);
      
      // Feature usage
      const featureUsage = events.reduce((acc: any, event: any) => {
        if (event.type === 'user_action') {
          acc[event.action] = (acc[event.action] || 0) + 1;
        }
        return acc;
      }, {});
      
      const topFeatures = Object.entries(featureUsage)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5);

      // Peak writing hours
      const hourCounts = new Array(24).fill(0);
      sessions.forEach((session: any) => {
        const hour = new Date(session.start).getHours();
        hourCounts[hour] += session.words;
      });
      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

      // Goals and achievements
      const dailyGoal = 500; // words
      const weeklyGoal = 3500; // words
      const dailyProgress = Math.min(100, (recentWords / dailyGoal) * 100);
      const weeklyProgress = Math.min(100, (recentWords / weeklyGoal) * 100);

      setAnalyticsData({
        overview: {
          totalWords,
          totalSessions,
          avgWordsPerSession,
          totalWritingTime: Math.round(totalWritingTime),
          recentWords,
          productivity: Math.round((recentWords / Math.max(1, recentSessions.length)) || 0),
        },
        features: topFeatures,
        schedule: {
          peakHour: `${peakHour}:00 - ${peakHour + 1}:00`,
          consistency: recentSessions.length,
        },
        goals: {
          daily: { target: dailyGoal, progress: dailyProgress },
          weekly: { target: weeklyGoal, progress: weeklyProgress },
        },
        insights: generateInsights(sessions, events),
      });

      // Mock performance data
      setPerformanceData({
        performanceScore: 85,
        avgRenderTime: 45,
        avgSaveTime: 200,
        errorRate: 0.02,
        memoryUsage: 65,
      });

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (sessions: any[], events: any[]) => {
    const insights = [];
    
    if (sessions.length === 0) {
      insights.push({ type: 'info', text: 'Start writing to see your analytics!' });
      return insights;
    }

    const avgWords = sessions.reduce((sum, s) => sum + s.words, 0) / sessions.length;
    const recentAvg = sessions.slice(-5).reduce((sum, s) => sum + s.words, 0) / Math.min(5, sessions.length);
    
    if (recentAvg > avgWords * 1.2) {
      insights.push({ type: 'positive', text: 'Your writing productivity is trending upward!' });
    }
    
    if (avgWords < 200) {
      insights.push({ type: 'suggestion', text: 'Try setting a daily word count goal to improve consistency.' });
    }
    
    const errors = events.filter(e => e.type === 'error');
    if (errors.length > 0) {
      insights.push({ type: 'warning', text: `${errors.length} technical issues detected this session.` });
    }

    return insights;
  };

  const exportData = () => {
    const data = {
      analytics: analyticsData,
      performance: performanceData,
      exportDate: new Date(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `writing-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Writing Analytics</h2>
        <Button onClick={exportData} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Words</span>
              </div>
              <div className="text-2xl font-bold">{analyticsData?.overview.totalWords.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{analyticsData?.overview.recentWords || 0} this week
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Writing Time</span>
              </div>
              <div className="text-2xl font-bold">{analyticsData?.overview.totalWritingTime || 0}m</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.overview.totalSessions || 0} sessions
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Productivity</span>
              </div>
              <div className="text-2xl font-bold">{analyticsData?.overview.productivity || 0}</div>
              <p className="text-xs text-muted-foreground">words per session</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Peak Time</span>
              </div>
              <div className="text-lg font-bold">{analyticsData?.schedule.peakHour || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">most productive hour</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Feature Usage</h3>
            <div className="space-y-3">
              {analyticsData?.features.map(([feature, count]: [string, number]) => (
                <div key={feature} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (count / Math.max(...analyticsData.features.map(([,c]: [string, number]) => c))) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              )) || []}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Score</h3>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{performanceData?.performanceScore || 0}</div>
                <Progress value={performanceData?.performanceScore || 0} className="mb-2" />
                <p className="text-sm text-muted-foreground">Overall performance rating</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Technical Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Render Time</span>
                  <span className="text-sm font-medium">{performanceData?.avgRenderTime || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Save Time</span>
                  <span className="text-sm font-medium">{performanceData?.avgSaveTime || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Error Rate</span>
                  <span className="text-sm font-medium">{((performanceData?.errorRate || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-medium">{performanceData?.memoryUsage || 0}MB</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Daily Goal</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(analyticsData?.goals.daily.progress || 0)}%</span>
                </div>
                <Progress value={analyticsData?.goals.daily.progress || 0} />
                <p className="text-xs text-muted-foreground">
                  Target: {analyticsData?.goals.daily.target || 0} words
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Weekly Goal</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(analyticsData?.goals.weekly.progress || 0)}%</span>
                </div>
                <Progress value={analyticsData?.goals.weekly.progress || 0} />
                <p className="text-xs text-muted-foreground">
                  Target: {analyticsData?.goals.weekly.target || 0} words
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Personalized Insights</h3>
            <div className="space-y-3">
              {analyticsData?.insights.map((insight: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {insight.type === 'positive' && <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />}
                  {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                  {insight.type === 'info' && <FileText className="h-5 w-5 text-blue-500 mt-0.5" />}
                  {insight.type === 'suggestion' && <Target className="h-5 w-5 text-purple-500 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm">{insight.text}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {insight.type}
                    </Badge>
                  </div>
                </div>
              )) || []}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
