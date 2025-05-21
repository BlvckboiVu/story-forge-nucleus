
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, BookOpen, Settings, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { signOut } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
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
      path: "/dashboard",
    },
    {
      title: "Editor",
      icon: <BookOpen size={20} />,
      path: "/editor",
    },
    {
      title: "Settings",
      icon: <Settings size={20} />,
      path: "/settings",
    },
    {
      title: "Profile",
      icon: <User size={20} />,
      path: "/profile",
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
        <SheetContent side="left" className="p-0 w-64">
          <div className="h-full flex flex-col bg-sidebar">
            <div className="p-4 flex justify-between items-center">
              <Link to="/dashboard" className="font-semibold text-xl flex items-center gap-2" onClick={() => setOpen(false)}>
                <BookOpen size={24} />
                <span>StoryForge</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X size={20} />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            
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
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
