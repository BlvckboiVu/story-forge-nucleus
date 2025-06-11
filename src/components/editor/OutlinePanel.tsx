// OutlinePanel.tsx
// Interactive panel for managing a hierarchical story outline (chapters, sections, etc.)
// Allows adding, editing, deleting, and nesting outline items with collapsible UI

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';

interface OutlineItem {
  id: string;
  title: string;
  description?: string;
  children?: OutlineItem[];
}

/**
 * Props for the OutlinePanel component
 * @property className - Optional additional class names for the panel
 */
interface OutlinePanelProps {
  className?: string;
}

/**
 * OutlinePanel - Displays and manages a hierarchical story outline (chapters, sections, etc.)
 * Users can add, edit, delete, and nest outline items. Items are collapsible and editable inline.
 */
export default function OutlinePanel({ className }: OutlinePanelProps) {
  const [outline, setOutline] = useState<OutlineItem[]>([
    {
      id: '1',
      title: 'Chapter 1: The Beginning',
      description: 'Introduction of main character and setting',
      children: [
        { id: '1.1', title: 'Character introduction', description: 'Show protagonist in their normal world' },
        { id: '1.2', title: 'The call to adventure', description: 'Something disrupts their routine' },
      ]
    },
    {
      id: '2',
      title: 'Chapter 2: The Journey',
      description: 'Character development and rising action',
      children: [
        { id: '2.1', title: 'Leaving comfort zone', description: 'Protagonist makes a difficult decision' },
        { id: '2.2', title: 'First obstacle', description: 'Initial conflict arises' },
      ]
    },
    {
      id: '3',
      title: 'Chapter 3: The Resolution',
      description: 'Climax and conclusion',
    }
  ]);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['1', '2']));
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const addItem = (parentId?: string) => {
    if (!newItemTitle.trim()) return;

    const newItem: OutlineItem = {
      id: Date.now().toString(),
      title: newItemTitle.trim(),
      description: newItemDescription.trim() || undefined,
    };

    if (parentId) {
      // Add as child
      setOutline(prev => prev.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children || []), newItem]
          };
        }
        return item;
      }));
    } else {
      // Add as top-level item
      setOutline(prev => [...prev, newItem]);
    }

    setNewItemTitle('');
    setNewItemDescription('');
    setEditingItem(null);
  };

  const deleteItem = (id: string, parentId?: string) => {
    if (parentId) {
      // Delete child item
      setOutline(prev => prev.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            children: item.children?.filter(child => child.id !== id)
          };
        }
        return item;
      }));
    } else {
      // Delete top-level item
      setOutline(prev => prev.filter(item => item.id !== id));
    }
  };

  const renderOutlineItem = (item: OutlineItem, parentId?: string, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isEditing = editingItem === item.id;

    return (
      <div key={item.id} className={`${level > 0 ? 'ml-4 pl-2 border-l border-gray-200 dark:border-gray-700' : ''}`}>
        <div className="flex items-start gap-2 py-2">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpanded(item.id)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          ) : (
            <div className="w-6" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between group">
              <div className="flex-1">
                <h4 className="text-sm font-medium leading-tight">{item.title}</h4>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={() => deleteItem(item.id, parentId)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {item.children!.map(child => renderOutlineItem(child, item.id, level + 1))}
          </div>
        )}

        {isEditing && (
          <div className="ml-8 mt-2 space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <Input
              placeholder="Add new section..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addItem(item.id);
                }
              }}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addItem(item.id)}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`p-4 h-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Story Outline</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditingItem('new')}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {outline.map(item => renderOutlineItem(item))}
      </div>

      {editingItem === 'new' && (
        <div className="mt-4 space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <Input
            placeholder="Chapter or section title..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addItem();
              }
            }}
          />
          <Textarea
            placeholder="Description (optional)"
            value={newItemDescription}
            onChange={(e) => setNewItemDescription(e.target.value)}
            className="min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addItem()}>
              <Plus className="h-3 w-3 mr-1" />
              Add Chapter
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
