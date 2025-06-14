
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  FolderPlus, 
  FileText, 
  Clock, 
  Star,
  Archive,
  Trash2,
  Copy,
  Download,
  Eye,
  Edit3
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';

interface Draft {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  tags: string[];
  isFavorite: boolean;
  folder?: string;
  version: number;
  collaborators?: string[];
}

interface DraftFolder {
  id: string;
  name: string;
  color: string;
  draftCount: number;
}

export function EnhancedDraftManager() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [folders, setFolders] = useState<DraftFolder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'wordCount'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadDrafts();
    loadFolders();
  }, []);

  const loadDrafts = async () => {
    try {
      // Mock data - replace with actual API call
      const mockDrafts: Draft[] = [
        {
          id: '1',
          title: 'Chapter 1: The Beginning',
          content: 'Lorem ipsum dolor sit amet...',
          wordCount: 1250,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          status: 'in-progress',
          tags: ['novel', 'fantasy'],
          isFavorite: true,
          folder: 'main-project',
          version: 3,
        },
        {
          id: '2',
          title: 'Research Notes',
          content: 'Research for the novel...',
          wordCount: 750,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          status: 'draft',
          tags: ['research', 'notes'],
          isFavorite: false,
          folder: 'research',
          version: 1,
        },
      ];
      setDrafts(mockDrafts);
    } catch (error) {
      toast({
        title: 'Error loading drafts',
        description: 'Failed to load your drafts. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const loadFolders = async () => {
    const mockFolders: DraftFolder[] = [
      { id: 'main-project', name: 'Main Project', color: 'blue', draftCount: 5 },
      { id: 'research', name: 'Research', color: 'green', draftCount: 3 },
      { id: 'ideas', name: 'Ideas', color: 'purple', draftCount: 8 },
    ];
    setFolders(mockFolders);
  };

  const filteredAndSortedDrafts = useCallback(() => {
    let filtered = drafts.filter(draft => {
      const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          draft.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          draft.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || draft.status === filterStatus;
      const matchesFolder = selectedFolder === 'all' || draft.folder === selectedFolder;
      
      return matchesSearch && matchesStatus && matchesFolder;
    });

    // Sort drafts
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'wordCount':
          aValue = a.wordCount;
          bValue = b.wordCount;
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [drafts, searchTerm, sortBy, sortOrder, filterStatus, selectedFolder]);

  const toggleFavorite = (draftId: string) => {
    setDrafts(prev => prev.map(draft => 
      draft.id === draftId ? { ...draft, isFavorite: !draft.isFavorite } : draft
    ));
  };

  const updateDraftStatus = (draftId: string, status: Draft['status']) => {
    setDrafts(prev => prev.map(draft => 
      draft.id === draftId ? { ...draft, status } : draft
    ));
  };

  const deleteDraft = (draftId: string) => {
    setDrafts(prev => prev.filter(draft => draft.id !== draftId));
    toast({
      title: 'Draft deleted',
      description: 'The draft has been moved to trash.',
    });
  };

  const duplicateDraft = (draftId: string) => {
    const original = drafts.find(d => d.id === draftId);
    if (original) {
      const duplicate: Draft = {
        ...original,
        id: crypto.randomUUID(),
        title: `${original.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };
      setDrafts(prev => [duplicate, ...prev]);
      toast({
        title: 'Draft duplicated',
        description: 'A copy of the draft has been created.',
      });
    }
  };

  const bulkAction = (action: 'delete' | 'archive' | 'favorite') => {
    switch (action) {
      case 'delete':
        setDrafts(prev => prev.filter(draft => !selectedDrafts.includes(draft.id)));
        break;
      case 'archive':
        setDrafts(prev => prev.map(draft => 
          selectedDrafts.includes(draft.id) ? { ...draft, status: 'archived' as const } : draft
        ));
        break;
      case 'favorite':
        setDrafts(prev => prev.map(draft => 
          selectedDrafts.includes(draft.id) ? { ...draft, isFavorite: true } : draft
        ));
        break;
    }
    setSelectedDrafts([]);
    toast({
      title: 'Bulk action completed',
      description: `${selectedDrafts.length} drafts updated.`,
    });
  };

  const getStatusColor = (status: Draft['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Draft Manager</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedDrafts().length} of {drafts.length} drafts
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            New Draft
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drafts, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All folders</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name} ({folder.draftCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="wordCount">Word Count</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDrafts.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedDrafts.length} draft{selectedDrafts.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkAction('favorite')}>
                <Star className="h-4 w-4 mr-1" />
                Favorite
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction('archive')}>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button size="sm" variant="destructive" onClick={() => bulkAction('delete')}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Drafts Grid */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {filteredAndSortedDrafts().map(draft => (
          <Card key={draft.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedDrafts.includes(draft.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDrafts(prev => [...prev, draft.id]);
                    } else {
                      setSelectedDrafts(prev => prev.filter(id => id !== draft.id));
                    }
                  }}
                  className="rounded"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(draft.id)}
                  className="p-1"
                >
                  <Star className={`h-4 w-4 ${draft.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                </Button>
              </div>
              <Badge className={getStatusColor(draft.status)}>
                {draft.status}
              </Badge>
            </div>

            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{draft.title}</h3>
            <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
              {draft.content.substring(0, 150)}...
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span>{draft.wordCount.toLocaleString()} words</span>
              <span>v{draft.version}</span>
              <span>{formatDate(draft.updatedAt)}</span>
            </div>

            {draft.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {draft.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="p-1">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1" onClick={() => duplicateDraft(draft.id)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 text-destructive hover:text-destructive"
                onClick={() => deleteDraft(draft.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredAndSortedDrafts().length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No drafts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first draft to get started'}
          </p>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Create New Draft
          </Button>
        </div>
      )}
    </div>
  );
}
