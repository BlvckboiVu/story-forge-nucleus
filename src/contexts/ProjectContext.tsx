
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  status: 'planning' | 'writing' | 'editing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  loading: false,
  error: null,
  createProject: async () => ({ id: '', title: '', description: '', isPublic: false, status: 'planning', createdAt: new Date(), updatedAt: new Date(), userId: '' }),
  updateProject: async () => {},
  deleteProject: async () => {},
  getProject: () => undefined,
});

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load projects from localStorage for now (can be upgraded to Supabase later)
  useEffect(() => {
    if (user) {
      const savedProjects = localStorage.getItem(`projects_${user.id}`);
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects).map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }));
          setProjects(parsedProjects);
        } catch (err) {
          console.error('Failed to load projects:', err);
          setError('Failed to load projects');
        }
      }
    } else {
      setProjects([]);
    }
  }, [user]);

  const saveProjects = (updatedProjects: Project[]) => {
    if (user) {
      localStorage.setItem(`projects_${user.id}`, JSON.stringify(updatedProjects));
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Project> => {
    if (!user) throw new Error('User must be logged in to create projects');
    
    setLoading(true);
    setError(null);
    
    try {
      const newProject: Project = {
        ...projectData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
      };
      
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      
      toast({
        title: 'Project created',
        description: `"${newProject.title}" has been created successfully.`,
      });
      
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProjects = projects.map(project =>
        project.id === id
          ? { ...project, ...updates, updatedAt: new Date() }
          : project
      );
      
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      
      toast({
        title: 'Project updated',
        description: 'Project has been updated successfully.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProjects = projects.filter(project => project.id !== id);
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      
      toast({
        title: 'Project deleted',
        description: 'Project has been deleted successfully.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProject = (id: string): Project | undefined => {
    return projects.find(project => project.id === id);
  };

  const value = {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;
