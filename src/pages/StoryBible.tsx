
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Book, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Grid,
  List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { StoryBibleModal } from '@/components/StoryBibleModal';
import { 
  StoryBibleEntry,
  getStoryBibleEntriesByProject,
  createStoryBibleEntry,
  updateStoryBibleEntry,
  deleteStoryBibleEntry
} from '@/lib/storyBibleDb';
import { useProjects } from '@/contexts/ProjectContext';

const TYPE_COLORS = {
  Character: 'bg-blue-100 text-blue-800 border-blue-200',
  Location: 'bg-green-100 text-green-800 border-green-200',
  Lore: 'bg-purple-100 text-purple-800 border-purple-200',
  Item: 'bg-orange-100 text-orange-800 border-orange-200',
  Custom: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function StoryBible() {
  const [entries, setEntries] = useState<StoryBibleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<StoryBibleEntry['type'] | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<StoryBibleEntry | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { currentProject } = useProjects();
  const { toast } = useToast();
  const navigate = useNavigate();

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
    if (!currentProject) {
      navigate('/app/dashboard');
      return;
    }
    setOffset(0);
    loadEntries(true);
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
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg truncate">{entry.name}</h3>
              <Badge className={`text-xs ${TYPE_COLORS[entry.type]}`}>
                {entry.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Updated {entry.updated_at.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <CardContent className="pt-0 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {entry.description.replace(/<[^>]*>/g, '').substring(0, 200)}
            {entry.description.length > 200 && '...'}
          </p>
        </CardContent>
      )}

      {entry.tags.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 4).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {entry.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{entry.tags.length - 4} more
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (!currentProject) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <Book className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Story Bible</h1>
                <Badge variant="outline" className="text-sm">
                  {currentProject.title}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries by name or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={typeFilter}
                onValueChange={(value: StoryBibleEntry['type'] | 'all') => setTypeFilter(value)}
              >
                <SelectTrigger className="w-40">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {entries.length === 0 && !loading ? (
            <div className="text-center py-16">
              <Book className="h-24 w-24 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">No Story Bible Entries</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first entry to start building your story bible. 
                Track characters, locations, lore, and important items.
              </p>
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Entry
              </Button>
            </div>
          ) : (
            <div 
              className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {entries.map(entry => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}

          {hasMore && entries.length > 0 && (
            <div className="flex justify-center mt-8">
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
