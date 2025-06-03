
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StoryBibleEntry } from '@/lib/storyBibleDb';
import { sanitizeText } from '@/utils/security';

interface StoryBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<StoryBibleEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<StoryBibleEntry>) => Promise<void>;
  entry?: StoryBibleEntry | null;
  projectId: string;
}

const ENTRY_TYPES: StoryBibleEntry['type'][] = ['Character', 'Location', 'Lore', 'Item', 'Custom'];

export const StoryBibleModal: React.FC<StoryBibleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  entry,
  projectId,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Character' as StoryBibleEntry['type'],
    description: '',
    tags: [] as string[],
    rules: [] as string[],
    relations: [] as string[],
  });
  const [newTag, setNewTag] = useState('');
  const [newRule, setNewRule] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (entry) {
      setFormData({
        name: entry.name,
        type: entry.type,
        description: entry.description,
        tags: entry.tags,
        rules: entry.rules,
        relations: entry.relations,
      });
    } else {
      setFormData({
        name: '',
        type: 'Character',
        description: '',
        tags: [],
        rules: [],
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
      const entryData = {
        ...formData,
        name: sanitizeText(formData.name, 200),
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

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 50) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, sanitizeText(newTag.trim(), 50)]
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

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, sanitizeText(newRule.trim(), 500)]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entry ? 'Edit Entry' : 'Create New Entry'}
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
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this entry..."
              className="min-h-[120px]"
              maxLength={100000}
            />
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
            <Label>Rules & Notes</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Add a rule or note"
                maxLength={500}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
              />
              <Button type="button" onClick={addRule} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{rule}</span>
                  <X 
                    className="h-4 w-4 cursor-pointer text-gray-500 hover:text-red-500" 
                    onClick={() => removeRule(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (entry ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
