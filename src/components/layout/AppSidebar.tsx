
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { 
  Home, 
  FileText, 
  BookOpen, 
  Settings, 
  LogOut,
  Plus,
  List
} from 'lucide-react';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { createProject, currentProject } = useProjects();
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
      icon: List,
      description: 'View and edit your story structure'
    },
  ] : [];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <h2 className="text-lg font-semibold">StoryForge</h2>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                    >
                      <a href={item.href} onClick={(e) => {
                        e.preventDefault();
                        navigate(item.href);
                      }}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {currentProject && (
          <SidebarGroup>
            <SidebarGroupLabel>Project Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projectTools.map((tool) => {
                  const isActive = location.pathname.includes('/editor');
                  return (
                    <SidebarMenuItem key={tool.name}>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive}
                        tooltip={tool.description}
                      >
                        <a href={tool.href} onClick={(e) => {
                          e.preventDefault();
                          navigate(tool.href);
                        }}>
                          <tool.icon className="h-4 w-4" />
                          <span>{tool.name}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button onClick={handleCreateProject} className="w-full">
                    <Plus className="h-4 w-4" />
                    <span>New Project</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button 
                onClick={handleLogout}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
