
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StoryBibleEntry } from '@/lib/storyBibleDb';
import { sanitizeHtml } from '@/utils/security';
import { getCachedSuggestion } from '@/utils/suggestions';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface StoryBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<StoryBibleEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<StoryBibleEntry>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  entry?: StoryBibleEntry | null;
  projectId: string;
  existingEntries?: StoryBibleEntry[];
}

const ENTRY_TYPES: StoryBibleEntry['type'][] = ['Character', 'Location', 'Lore', 'Item', 'Custom'];

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'bold', 'italic', 'underline', 'list', 'bullet', 'link'
];

export const StoryBibleModal: React.FC<StoryBibleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  entry,
  projectId,
  existingEntries = [],
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Character' as StoryBibleEntry['type'],
    description: '',
    tags: [] as string[],
    rules: '',
    relations: [] as string[],
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestingEntry, setSuggestingEntry] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (entry) {
      setFormData({
        name: entry.name,
        type: entry.type,
        description: entry.description,
        tags: entry.tags,
        rules: entry.rules.join('\n'),
        relations: entry.relations,
      });
    } else {
      setFormData({
        name: '',
        type: 'Character',
        description: '',
        tags: [],
        rules: '',
        relations: [],
      });
    }
    setErrors({});
  }, [entry, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be less than 200 characters';
    }

    if (formData.description.length > 100000) {
      newErrors.description = 'Description is too long';
    }

    if (formData.tags.length > 50) {
      newErrors.tags = 'Too many tags (maximum 50)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const sanitizedDescription = sanitizeHtml(formData.description);
      const entryData = {
        ...formData,
        description: sanitizedDescription,
        name: formData.name.trim(),
        rules: formData.rules.split('\n').filter(rule => rule.trim()),
        project_id: projectId,
      };

      if (entry && onUpdate) {
        await onUpdate(entry.id, entryData);
        toast({
          title: 'Entry updated',
          description: `"${entryData.name}" has been updated successfully.`,
          duration: 3000,
        });
      } else {
        await onSave(entryData);
        toast({
          title: 'Entry created',
          description: `"${entryData.name}" has been created successfully.`,
          duration: 3000,
        });
      }
      
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save entry';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || !onDelete) return;
    
    setLoading(true);
    try {
      await onDelete(entry.id);
      toast({
        title: 'Entry deleted',
        description: `"${entry.name}" has been deleted successfully.`,
        duration: 3000,
      });
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete entry';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 50) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleRelationToggle = (relationId: string) => {
    setFormData(prev => ({
      ...prev,
      relations: prev.relations.includes(relationId)
        ? prev.relations.filter(id => id !== relationId)
        : [...prev.relations, relationId]
    }));
  };

  const suggestEntry = async () => {
    setSuggestingEntry(true);
    try {
      const suggestion = await getCachedSuggestion(formData.type);
      
      setFormData(prev => ({
        ...prev,
        name: suggestion.name,
        description: suggestion.description,
        tags: suggestion.tags,
        rules: suggestion.rules.join('\n'),
      }));

      toast({
        title: 'Suggestion applied',
        description: 'AI-generated entry details have been filled in. Feel free to customize them!',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Suggestion failed',
        description: 'Could not generate AI suggestion. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setSuggestingEntry(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {entry ? 'Edit Entry' : 'Create New Entry'}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={suggestEntry}
              disabled={suggestingEntry}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {suggestingEntry ? 'Suggesting...' : 'AI Suggest'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter entry name"
                maxLength={200}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: StoryBibleEntry['type']) => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <div className="mt-1">
              <ReactQuill
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Describe this entry..."
                className="bg-white dark:bg-gray-900"
                style={{ height: '200px', marginBottom: '50px' }}
              />
            </div>
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                maxLength={50}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
          </div>

          <div>
            <Label htmlFor="rules">Rules & Notes</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
              placeholder="Enter rules or notes (one per line)"
              className="min-h-[100px]"
              maxLength={5000}
            />
          </div>

          {existingEntries.length > 0 && (
            <div>
              <Label>Related Entries</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {existingEntries
                  .filter(e => e.id !== entry?.id)
                  .map(relatedEntry => (
                    <label key={relatedEntry.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.relations.includes(relatedEntry.id)}
                        onChange={() => handleRelationToggle(relatedEntry.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{relatedEntry.name} ({relatedEntry.type})</span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {entry && onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{entry.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (entry ? 'Update' : 'Create')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
