
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  User, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await signOut();
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
    <aside 
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col relative",
        isCollapsed ? "w-[60px]" : "w-[250px]"
      )}
    >
      {/* Logo and App Name */}
      <div className="p-4 flex items-center justify-between">
        <Link 
          to="/app/dashboard" 
          className={cn(
            "font-semibold text-xl flex items-center gap-2 transition-opacity",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}
        >
          <BookOpen size={24} />
          <span className={cn("transition-opacity", isCollapsed ? "opacity-0 hidden" : "opacity-100")}>
            StoryForge
          </span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleCollapse}
          className="absolute -right-4 top-4 rounded-full border bg-background shadow-md text-muted-foreground"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </div>
      
      <Separator className="my-2" />
      
      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                  location.pathname === item.path && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                  !isCollapsed ? "justify-start" : "justify-center"
                )}
              >
                {item.icon}
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto p-4">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-2",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
