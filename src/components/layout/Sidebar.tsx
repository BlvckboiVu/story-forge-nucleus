
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PenTool, 
  User, 
  Settings, 
  Book,
  Zap,
  Coins
} from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/app/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Editor',
    url: '/app/editor',
    icon: PenTool,
  },
  {
    title: 'Bible Library',
    url: '/app/story-bible',
    icon: Book,
  },
  {
    title: 'Sandbox',
    url: '/app/sandbox',
    icon: Zap,
  },
  {
    title: 'Tokens',
    url: '/app/tokens',
    icon: Coins,
  },
  {
    title: 'Profile',
    url: '/app/profile',
    icon: User,
  },
  {
    title: 'Settings',
    url: '/app/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ShadcnSidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            StoryForge
          </span>
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="w-full justify-start"
        >
          Sign Out
        </Button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
