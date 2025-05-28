import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, BookOpen, Settings, User, LogOut, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import OutlinePanel from '@/components/editor/OutlinePanel';
import LLMPanel from '@/components/LLMPanel';

interface MobileNavProps {
  showEditorPanels?: boolean;
  onInsertLLMResponse?: (text: string) => void;
}

export function MobileNav({ showEditorPanels = false, onInsertLLMResponse }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out",
        variant: "destructive",
      });
    }
  };
  
  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/app/dashboard",
    },
    {
      title: "Editor",
      icon: <BookOpen size={20} />,
      path: "/app/editor",
    },
    {
      title: "Settings",
      icon: <Settings size={20} />,
      path: "/app/settings",
    },
    {
      title: "Profile",
      icon: <User size={20} />,
      path: "/app/profile",
    },
  ];

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-foreground">
            <Menu size={24} />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80 max-w-[90vw]">
          <div className="h-full flex flex-col bg-sidebar">
            <div className="p-4 flex justify-between items-center border-b">
              <Link to="/app/dashboard" className="font-semibold text-xl flex items-center gap-2" onClick={() => setOpen(false)}>
                <BookOpen size={24} />
                <span>StoryForge</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X size={20} />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            
            {showEditorPanels ? (
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="outline" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
                    <TabsTrigger value="outline" className="flex items-center gap-2">
                      <FileText size={16} />
                      Outline
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                      <Zap size={16} />
                      AI Assistant
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="outline" className="flex-1 px-4 pb-4 mt-4 overflow-auto">
                    <OutlinePanel />
                  </TabsContent>
                  
                  <TabsContent value="ai" className="flex-1 px-4 pb-4 mt-4 overflow-auto">
                    <LLMPanel
                      isCollapsed={false}
                      onToggle={() => {}}
                      onInsertResponse={onInsertLLMResponse || (() => {})}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <>
                <nav className="flex-1 px-3 py-4">
                  <ul className="space-y-2">
                    {navItems.map((item) => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-3 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
                            location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
                          }`}
                          onClick={() => setOpen(false)}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                
                <div className="mt-auto p-4">
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
