
import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Home, 
  FileText, 
  BookOpen, 
  Settings, 
  User, 
  LogOut,
  Plus
} from 'lucide-react';

interface NavigationProps {
  className?: string;
  showEditorPanels?: boolean;
  onInsertLLMResponse?: (text: string) => void;
}

export function Navigation({ 
  className,
  showEditorPanels = false,
  onInsertLLMResponse
}: NavigationProps) {
  const { user, signOut } = useAuth();
  const { createProject } = useProjects();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateProject = async () => {
    try {
      const newProject = await createProject({
        title: 'New Project',
        description: '',
        isPublic: false,
        status: 'planning'
      });
      navigate(`/app/editor/${newProject.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      // Error toast is already handled in the context
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/app/dashboard', icon: Home },
    { name: 'Editor', href: '/app/editor', icon: FileText },
    { name: 'Story Bible', href: '/app/story-bible', icon: BookOpen },
    { name: 'Settings', href: '/app/settings', icon: Settings },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">StoryForge</h2>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className="mr-2 h-5 w-5" />
                {item.name}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleCreateProject}
          >
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </Button>
        </div>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <aside className={cn(
      "hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:border-r bg-background",
      className
    )}>
      <NavContent />
    </aside>
  );
}
