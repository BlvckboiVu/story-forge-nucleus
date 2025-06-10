import * as React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { 
  Home, 
  FileText, 
  BookOpen, 
  Settings, 
  User, 
  Menu, 
  X,
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
  const { projects, createProject } = useProjects();
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut();
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
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/app/dashboard', icon: Home },
    { name: 'Editor', href: '/app/editor', icon: FileText },
    { name: 'Story Bible', href: '/app/story-bible', icon: BookOpen },
    { name: 'Profile', href: '/app/profile', icon: User },
    { name: 'Settings', href: '/app/settings', icon: Settings },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">StoryForge</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary"
                )}
                asChild
              >
                <a href={item.href}>
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </a>
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
    <>
      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <aside className={cn(
        "hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:border-r",
        className
      )}>
        <NavContent />
      </aside>
    </>
  );
} 