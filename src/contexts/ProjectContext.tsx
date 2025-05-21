
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ProjectContextType } from '../types';
import db, { createProject as dbCreateProject, updateProject as dbUpdateProject, deleteProject as dbDeleteProject } from '../lib/db';
import { useAuth } from './AuthContext';

// Create context with a default value
const ProjectContext = createContext<ProjectContextType>({
  currentProject: null,
  projects: [],
  loading: true,
  error: null,
  createProject: async () => '',
  updateProject: async () => {},
  deleteProject: async () => {},
  setCurrentProject: () => {},
});

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  // Load projects when user changes
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) {
        setProjects([]);
        setCurrentProject(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Fetch projects for the current user from IndexedDB
        const userProjects = await db.projects
          .where('userId')
          .equals(user.id)
          .toArray();
        
        setProjects(userProjects);
        
        // Set the last active project as current if available
        const lastProjectId = localStorage.getItem('storyforge_last_project');
        if (lastProjectId) {
          const lastProject = userProjects.find(p => p.id === lastProjectId);
          if (lastProject) {
            setCurrentProject(lastProject);
          }
        }
      } catch (e) {
        console.error('Error loading projects:', e);
        setError(e instanceof Error ? e.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, [user]);
  
  // Create new project
  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) {
      throw new Error('User must be logged in to create a project');
    }
    
    try {
      setError(null);
      
      const newProject: Omit<Project, 'id'> = {
        ...projectData,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const projectId = await dbCreateProject(newProject);
      
      // Refresh projects list
      const createdProject = await db.projects.get(projectId as string);
      if (createdProject) {
        setProjects(prev => [...prev, createdProject]);
        setCurrentProject(createdProject);
        localStorage.setItem('storyforge_last_project', createdProject.id);
      }
      
      return projectId as string;
    } catch (e) {
      console.error('Error creating project:', e);
      setError(e instanceof Error ? e.message : 'Failed to create project');
      throw e;
    }
  };
  
  // Update project
  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) {
      throw new Error('User must be logged in to update a project');
    }
    
    try {
      setError(null);
      
      await dbUpdateProject(id, updates);
      
      // Update projects list and current project if needed
      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ));
      
      if (currentProject?.id === id) {
        setCurrentProject(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      }
    } catch (e) {
      console.error('Error updating project:', e);
      setError(e instanceof Error ? e.message : 'Failed to update project');
      throw e;
    }
  };
  
  // Delete project
  const deleteProject = async (id: string) => {
    if (!user) {
      throw new Error('User must be logged in to delete a project');
    }
    
    try {
      setError(null);
      
      await dbDeleteProject(id);
      
      // Update projects list
      setProjects(prev => prev.filter(p => p.id !== id));
      
      // If the deleted project was the current one, set current to null
      if (currentProject?.id === id) {
        setCurrentProject(null);
        localStorage.removeItem('storyforge_last_project');
      }
    } catch (e) {
      console.error('Error deleting project:', e);
      setError(e instanceof Error ? e.message : 'Failed to delete project');
      throw e;
    }
  };
  
  const value = {
    currentProject,
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjects = () => useContext(ProjectContext);

export default ProjectContext;
