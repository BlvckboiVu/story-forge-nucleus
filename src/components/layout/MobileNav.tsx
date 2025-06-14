
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { 
  Home, 
  FileText, 
  BookOpen, 
  Settings, 
  LogOut,
  Plus,
  Menu,
  List
} from 'lucide-react';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { createProject, currentProject } = useProjects();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      setOpen(false);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleCreateProject = async () => {
    try {
      await createProject({
        title: 'New Project',
        description: '',
        isPublic: false,
        status: 'planning'
      });
      navigate('/app/editor');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/app/dashboard', icon: Home },
    { name: 'Editor', href: '/app/editor', icon: FileText },
    { name: 'Story Bible', href: '/app/story-bible', icon: BookOpen },
    { name: 'Settings', href: '/app/settings', icon: Settings },
  ];

  const projectTools = currentProject ? [
    { 
      name: 'Story Outline', 
      href: `/app/editor/${currentProject.id}`, 
      icon: List 
    },
  ] : [];

  const handleNavigation = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>StoryForge</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full py-4">
          <nav className="space-y-2">
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
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {currentProject && projectTools.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2 px-2">Project Tools</p>
              <div className="space-y-2">
                {projectTools.map((tool) => {
                  const isActive = location.pathname.includes('/editor');
                  return (
                    <Button
                      key={tool.name}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-secondary"
                      )}
                      onClick={() => handleNavigation(tool.href)}
                    >
                      <tool.icon className="mr-2 h-5 w-5" />
                      {tool.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCreateProject}
            >
              <Plus className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </div>

          <div className="mt-auto pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
