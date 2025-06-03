
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Plus, Search, Filter, Edit, Trash2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StoryBibleModal } from './StoryBibleModal';
import { 
  StoryBibleEntry,
  getStoryBibleEntriesByProject,
  createStoryBibleEntry,
  updateStoryBibleEntry,
  deleteStoryBibleEntry
} from '@/lib/storyBibleDb';
import { useIsMobile } from '@/hooks/use-mobile';

interface StoryBibleDrawerProps {
  projectId: string;
}

const TYPE_COLORS = {
  Character: 'bg-blue-100 text-blue-800',
  Location: 'bg-green-100 text-green-800',
  Lore: 'bg-purple-100 text-purple-800',
  Item: 'bg-orange-100 text-orange-800',
  Custom: 'bg-gray-100 text-gray-800',
};

export const StoryBibleDrawer: React.FC<StoryBibleDrawerProps> = ({ projectId }) => {
  const [entries, setEntries] = useState<StoryBibleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<StoryBibleEntry['type'] | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<StoryBibleEntry | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const loadEntries = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const currentOffset = reset ? 0 : offset;
      const newEntries = await getStoryBibleEntriesByProject(
        projectId,
        currentOffset,
        10,
        searchTerm || undefined,
        typeFilter === 'all' ? undefined : typeFilter
      );

      if (reset) {
        setEntries(newEntries);
        setOffset(10);
      } else {
        setEntries(prev => [...prev, ...newEntries]);
        setOffset(prev => prev + 10);
      }

      setHasMore(newEntries.length === 10);
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
  }, [projectId, searchTerm, typeFilter, offset, loading, toast]);

  useEffect(() => {
    setOffset(0);
    loadEntries(true);
  }, [projectId, searchTerm, typeFilter]);

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
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{entry.name}</h4>
              <Badge className={`text-xs ${TYPE_COLORS[entry.type]}`}>
                {entry.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
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
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEntry(entry.id);
              }}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {entry.description && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {entry.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
          </p>
        </CardContent>
      )}
      {entry.tags.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {entry.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{entry.tags.length - 3}</span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  const DrawerContentComponent = () => (
    <div className="h-full flex flex-col">
      <DrawerHeader className="border-b">
        <DrawerTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Story Bible
        </DrawerTitle>
      </DrawerHeader>

      <div className="flex-1 p-4 overflow-hidden">
        <div className="space-y-4 h-full flex flex-col">
          {/* Controls */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={() => {
                  setSelectedEntry(null);
                  setModalOpen(true);
                }}
                size="sm"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Entries List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {entries.map(entry => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
              
              {hasMore && (
                <Button
                  variant="outline"
                  onClick={() => loadEntries()}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              )}
              
              {entries.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No story bible entries yet.</p>
                  <p className="text-xs">Create your first entry to get started!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Book className="h-4 w-4" />
            Story Bible
            <ChevronRight className="h-3 w-3" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[80vh]">
          <DrawerContentComponent />
        </DrawerContent>
      </Drawer>

      <StoryBibleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleCreateEntry}
        onUpdate={handleUpdateEntry}
        entry={selectedEntry}
        projectId={projectId}
      />
    </>
  );
};
