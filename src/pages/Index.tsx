
import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { AuthProvider } from '../contexts/AuthContext';
import { ProjectProvider } from '../contexts/ProjectContext';

const Index = () => {
  return (
    <AuthProvider>
      <ProjectProvider>
        <MainLayout>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">Welcome to StoryForge</h1>
            <p className="text-xl mb-8">
              Your all-in-one writing platform for crafting beautiful stories.
            </p>
            <div className="bg-card p-8 rounded-lg shadow-sm">
              <p className="text-lg mb-4">
                This application is currently in development. Connect with Supabase to enable authentication and cloud storage.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-muted p-6 rounded-md">
                  <h3 className="text-xl font-semibold mb-2">Write</h3>
                  <p>Focus on your writing with a distraction-free editor.</p>
                </div>
                <div className="bg-muted p-6 rounded-md">
                  <h3 className="text-xl font-semibold mb-2">Organize</h3>
                  <p>Keep your chapters, characters, and notes organized.</p>
                </div>
                <div className="bg-muted p-6 rounded-md">
                  <h3 className="text-xl font-semibold mb-2">Publish</h3>
                  <p>Export your work in multiple formats when you're ready.</p>
                </div>
              </div>
            </div>
          </div>
        </MainLayout>
      </ProjectProvider>
    </AuthProvider>
  );
};

export default Index;
