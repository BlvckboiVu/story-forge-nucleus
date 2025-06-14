
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Plus, Search, Filter, Edit, Trash2, ExternalLink } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';

interface StoryBibleDrawerProps {
  projectId: string;
}

const TYPE_COLORS = {
  Character: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Location: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Lore: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Item: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Custom: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadEntries = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const currentOffset = reset ? 0 : offset;
      const newEntries = await getStoryBibleEntriesByProject(
        projectId,
        currentOffset,
        8, // Smaller limit for drawer
        searchTerm || undefined,
        typeFilter === 'all' ? undefined : typeFilter
      );

      if (reset) {
        setEntries(newEntries);
        setOffset(8);
      } else {
        setEntries(prev => [...prev, ...newEntries]);
        setOffset(prev => prev + 8);
      }

      setHasMore(newEntries.length === 8);
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
    <Card className="mb-3 hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{entry.name}</h4>
              <Badge className={`text-xs shrink-0 ${TYPE_COLORS[entry.type]}`}>
                {entry.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {entry.updated_at.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEntry(entry);
                setModalOpen(true);
              }}
              className="h-6 w-6 p-0"
              title="Edit entry"
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
              title="Delete entry"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {entry.description && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {entry.description.replace(/<[^>]*>/g, '').substring(0, 80)}
            {entry.description.length > 80 && '...'}
          </p>
        </CardContent>
      )}
      {entry.tags.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {entry.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">+{entry.tags.length - 2}</span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 hover:bg-accent transition-colors"
            title="Open Story Bible"
          >
            <Book className="h-4 w-4" />
            {!isMobile && "Story Bible"}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:w-96 h-full flex flex-col" side="right">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Story Bible
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSheetOpen(false);
                  navigate('/app/story-bible');
                }}
                className="gap-2 text-sm"
                title="Open full page view"
              >
                <ExternalLink className="h-4 w-4" />
                Full View
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 flex flex-col gap-4 py-4 overflow-hidden">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="font-semibold text-sm">{entries.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="font-semibold text-sm">
                  {entries.filter(e => e.type === 'Character').length}
                </div>
                <div className="text-xs text-muted-foreground">Characters</div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
                <Button
                  onClick={() => {
                    setSelectedEntry(null);
                    setModalOpen(true);
                  }}
                  size="sm"
                  className="shrink-0"
                  title="Add new entry"
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
                  <SelectTrigger className="w-full text-sm">
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
              <div className="space-y-2 pr-4">
                {entries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
                
                {hasMore && (
                  <Button
                    variant="outline"
                    onClick={() => loadEntries()}
                    disabled={loading}
                    className="w-full text-sm"
                    size="sm"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                )}
                
                {entries.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Book className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-2">No entries yet</p>
                    <p className="text-xs">Create your first entry to get started!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

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
        projectId={projectId}
        existingEntries={entries}
      />
    </>
  );
};
