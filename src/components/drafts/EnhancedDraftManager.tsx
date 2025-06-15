
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
import { DraftService, EnhancedDraft, DraftFolder } from '@/services/draftService';
import { useProjects } from '@/contexts/ProjectContext';
import { useNavigate } from 'react-router-dom';

export function EnhancedDraftManager() {
  const { currentProject } = useProjects();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<EnhancedDraft[]>([]);
  const [folders, setFolders] = useState<DraftFolder[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [currentProject]);

  const loadDrafts = async () => {
    if (!currentProject) return;
    
    setLoading(true);
    try {
      const projectDrafts = await DraftService.getDraftsByProject(currentProject.id);
      setDrafts(projectDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      toast({
        title: 'Error loading drafts',
        description: 'Failed to load your drafts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const folderData = await DraftService.getFolders();
      setFolders(folderData);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
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

  const updateDraftStatus = (draftId: string, status: EnhancedDraft['status']) => {
    setDrafts(prev => prev.map(draft => 
      draft.id === draftId ? { ...draft, status } : draft
    ));
  };

  const deleteDraft = async (draftId: string) => {
    try {
      await DraftService.deleteDraft(draftId);
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      toast({
        title: 'Draft deleted',
        description: 'The draft has been moved to trash.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete draft. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const duplicateDraft = async (draftId: string) => {
    if (!currentProject) return;
    
    const original = drafts.find(d => d.id === draftId);
    if (original) {
      try {
        const newDraftId = await DraftService.createDraft({
          title: `${original.title} (Copy)`,
          content: original.content,
          projectId: currentProject.id,
          wordCount: original.wordCount,
        });
        
        // Reload drafts to show the new one
        await loadDrafts();
        
        toast({
          title: 'Draft duplicated',
          description: 'A copy of the draft has been created.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to duplicate draft. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEditDraft = (draftId: string) => {
    if (currentProject) {
      navigate(`/app/editor/${currentProject.id}?draft=${draftId}`);
    }
  };

  const handleNewDraft = async () => {
    if (!currentProject) return;
    
    try {
      const newDraftId = await DraftService.createDraft({
        title: `New Draft ${drafts.length + 1}`,
        content: '',
        projectId: currentProject.id,
        wordCount: 0,
      });
      
      navigate(`/app/editor/${currentProject.id}?draft=${newDraftId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new draft. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const bulkAction = (action: 'delete' | 'archive' | 'favorite') => {
    switch (action) {
      case 'delete':
        selectedDrafts.forEach(draftId => deleteDraft(draftId));
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

  const getStatusColor = (status: EnhancedDraft['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
        <p className="text-muted-foreground">
          Please select a project to manage its drafts.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Draft Manager</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedDrafts().length} of {drafts.length} drafts in {currentProject.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button size="sm" onClick={handleNewDraft}>
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
                <Button variant="ghost" size="sm" className="p-1" onClick={() => handleEditDraft(draft.id)}>
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
          <Button onClick={handleNewDraft}>
            <FileText className="h-4 w-4 mr-2" />
            Create New Draft
          </Button>
        </div>
      )}
    </div>
  );
}
