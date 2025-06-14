
import React, { useState, useEffect, useCallback } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Plus, Search, Filter, Edit, Trash2, FileText, MapPin, Scroll, Package } from 'lucide-react';
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

const TYPE_COLORS = {
  Character: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Location: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Lore: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Item: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Custom: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const TYPE_ICONS = {
  Character: FileText,
  Location: MapPin,
  Lore: Scroll,
  Item: Package,
  Custom: Book,
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
  }, [currentProject, navigate]);

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

  const EntryCard = ({ entry }: { entry: StoryBibleEntry }) => {
    const IconComponent = TYPE_ICONS[entry.type];
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-lg truncate">{entry.name}</h3>
                <Badge className={`text-xs ${TYPE_COLORS[entry.type]} flex-shrink-0`}>
                  {entry.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Updated {entry.updated_at.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
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
                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
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
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {entry.description && (
          <CardContent className="pt-0 pb-3">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {entry.description.replace(/<[^>]*>/g, '').substring(0, 200)}
              {entry.description.length > 200 && '...'}
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
  };

  const getEntriesByType = (type: StoryBibleEntry['type']) => {
    return entries.filter(entry => entry.type === type);
  };

  if (!currentProject) {
    return (
      <Layout mode="contained">
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Book className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Project Selected</h2>
            <p className="text-muted-foreground">Please select a project to manage your story bible.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout mode="contained">
      <div className="space-y-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Story Bible</h1>
            <p className="text-muted-foreground mt-1">
              Manage characters, locations, lore, and items for "{currentProject.title}"
            </p>
          </div>
          <Button 
            onClick={() => {
              setSelectedEntry(null);
              setModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries by name or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={typeFilter}
              onValueChange={(value: StoryBibleEntry['type'] | 'all') => setTypeFilter(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Character">Characters</SelectItem>
                <SelectItem value="Location">Locations</SelectItem>
                <SelectItem value="Lore">Lore</SelectItem>
                <SelectItem value="Item">Items</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {(['Character', 'Location', 'Lore', 'Item', 'Custom'] as const).map(type => {
            const count = getEntriesByType(type).length;
            const IconComponent = TYPE_ICONS[type];
            return (
              <Card key={type} className="p-4 text-center">
                <IconComponent className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="font-semibold text-lg">{count}</div>
                <div className="text-sm text-muted-foreground">{type}s</div>
              </Card>
            );
          })}
        </div>

        {/* Entries Grid */}
        <div className="space-y-4">
          {loading && entries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Book className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No story bible entries yet</h3>
              <p className="text-muted-foreground mb-4">Create your first entry to get started!</p>
              <Button 
                onClick={() => {
                  setSelectedEntry(null);
                  setModalOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add First Entry
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {entries.map(entry => (
                  <EntryCard 
                    key={entry.id} 
                    entry={entry}
                  />
                ))}
              </div>
              
              {hasMore && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => loadEntries()}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <StoryBibleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleCreateEntry}
        onUpdate={handleUpdateEntry}
        onDelete={handleDeleteEntry}
        entry={selectedEntry}
        projectId={currentProject.id}
        existingEntries={entries}
      />
    </Layout>
  );
}
