
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Book className="h-6 w-6" />
              Story Bible
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage characters, locations, lore, and more for "{currentProject.title}"
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
            New Entry
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries by name or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-48">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={typeFilter}
              onValueChange={(value: StoryBibleEntry['type'] | 'all') => setTypeFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Character">Character</SelectItem>
                <SelectItem value="Location">Location</SelectItem>
                <SelectItem value="Lore">Lore</SelectItem>
                <SelectItem value="Item">Item</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            {entries.length === 0 && !loading ? (
              <div className="text-center py-16">
                <Book className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Story Bible Entries</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your story world by creating your first entry.
                </p>
                <Button
                  onClick={() => {
                    setSelectedEntry(null);
                    setModalOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create First Entry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {entries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
            
            {hasMore && entries.length > 0 && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => loadEntries()}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? 'Loading...' : 'Load More Entries'}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
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
    </div>
  );
}
