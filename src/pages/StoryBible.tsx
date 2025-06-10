import React, { useState, useEffect, useCallback } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StoryBibleModal } from '@/components/StoryBibleModal';
import { 
  StoryBibleEntry,
  getStoryBibleEntriesByProject,
  createStoryBibleEntry,
  updateStoryBibleEntry,
  deleteStoryBibleEntry
} from '@/lib/storyBibleDb';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Character, Location, Lore } from '@/types';

const TYPE_COLORS = {
  Character: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Location: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Lore: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Item: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Custom: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export default function StoryBible() {
  const { currentProject, projects, setCurrentProject } = useProjects();
  const [entries, setEntries] = useState<StoryBibleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<StoryBibleEntry['type'] | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<StoryBibleEntry | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [lore, setLore] = useState<Lore[]>([]);
  const [activeTab, setActiveTab] = useState('characters');

  // Set current project if none selected
  useEffect(() => {
    if (!currentProject && projects.length > 0) {
      const lastProjectId = localStorage.getItem('storyforge_last_project');
      if (lastProjectId) {
        const lastProject = projects.find(p => p.id === lastProjectId);
        if (lastProject) {
          setCurrentProject(lastProject);
        }
      } else {
        setCurrentProject(projects[0]);
      }
    }
  }, [currentProject, projects, setCurrentProject]);

  useEffect(() => {
    if (!currentProject) {
      navigate('/app/dashboard');
      return;
    }
    loadStoryBibleData();
  }, [currentProject, navigate]);

  const loadStoryBibleData = async () => {
    // Implementation for loading story bible data
  };

  const loadEntries = useCallback(async (reset = false) => {
    if (loading || !currentProject) return;
    
    setLoading(true);
    
    try {
      const currentOffset = reset ? 0 : offset;
      const newEntries = await getStoryBibleEntriesByProject(
        currentProject.id,
        currentOffset,
        12,
        searchTerm || undefined,
        typeFilter === 'all' ? undefined : typeFilter
      );

      if (reset) {
        setEntries(newEntries);
        setOffset(12);
      } else {
        setEntries(prev => [...prev, ...newEntries]);
        setOffset(prev => prev + 12);
      }

      setHasMore(newEntries.length === 12);
    } catch (error) {
      toast({
        title: 'Error loading entries',
        description: error instanceof Error ? error.message : 'Failed to load story bible entries',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [currentProject, searchTerm, typeFilter, offset, loading, toast]);

  useEffect(() => {
    if (currentProject) {
      setOffset(0);
      loadEntries(true);
    }
  }, [currentProject, searchTerm, typeFilter]);

  const handleCreateEntry = async (entryData: Omit<StoryBibleEntry, 'id' | 'created_at' | 'updated_at'>) => {
    await createStoryBibleEntry(entryData);
    setOffset(0);
    loadEntries(true);
  };

  const handleUpdateEntry = async (id: string, updates: Partial<StoryBibleEntry>) => {
    await updateStoryBibleEntry(id, updates);
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates, updated_at: new Date() } : entry
    ));
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteStoryBibleEntry(id);
      setEntries(prev => prev.filter(entry => entry.id !== id));
      toast({
        title: 'Entry deleted',
        description: 'Story bible entry has been deleted successfully.',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error deleting entry',
        description: error instanceof Error ? error.message : 'Failed to delete entry',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const EntryCard = ({ entry }: { entry: StoryBibleEntry }) => (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-base truncate">{entry.name}</h3>
              <Badge className={`text-xs ${TYPE_COLORS[entry.type]}`}>
                {entry.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Updated {entry.updated_at.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEntry(entry);
                setModalOpen(true);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEntry(entry.id);
              }}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {entry.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {entry.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
          </p>
        </CardContent>
      )}
      {entry.tags.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {entry.tags.slice(0, 5).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {entry.tags.length > 5 && (
              <span className="text-xs text-muted-foreground">+{entry.tags.length - 5} more</span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  const handleCreateCharacter = () => {
    // Implementation for creating a new character
  };

  const handleCreateLocation = () => {
    // Implementation for creating a new location
  };

  const handleCreateLore = () => {
    // Implementation for creating new lore
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Book className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
          <p className="text-muted-foreground">Please select a project to manage your story bible.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout mode="contained">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Story Bible</h1>
          <Button onClick={() => {
            switch (activeTab) {
              case 'characters':
                handleCreateCharacter();
                break;
              case 'locations':
                handleCreateLocation();
                break;
              case 'lore':
                handleCreateLore();
                break;
            }
          }}>
            Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="characters">Characters</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="lore">Lore</TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {characters.map((character) => (
                <Card key={character.id} className="p-4">
                  <h3 className="font-semibold">{character.name}</h3>
                  <p className="text-sm text-muted-foreground">{character.description}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="locations" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <Card key={location.id} className="p-4">
                  <h3 className="font-semibold">{location.name}</h3>
                  <p className="text-sm text-muted-foreground">{location.description}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lore" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lore.map((item) => (
                <Card key={item.id} className="p-4">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.content}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <StoryBibleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleCreateEntry}
        onUpdate={handleUpdateEntry}
        entry={selectedEntry}
        projectId={currentProject.id}
      />
    </Layout>
  );
}
