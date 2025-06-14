
import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { EnhancedOutline, OutlinePart } from '@/types/outline';

interface DragItem {
  id: string;
  type: 'part' | 'chapter' | 'scene';
  title: string;
}

interface OutlineDragDropProps {
  outline: EnhancedOutline;
  onReorder: (updatedParts: OutlinePart[]) => Promise<void>;
  children: React.ReactNode;
}

export default function OutlineDragDrop({ outline, onReorder, children }: OutlineDragDropProps) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findItemById = (id: string): DragItem | null => {
    for (const part of outline.parts) {
      if (part.id === id) {
        return { id, type: 'part', title: part.title };
      }
      for (const chapter of part.chapters) {
        if (chapter.id === id) {
          return { id, type: 'chapter', title: chapter.title };
        }
        for (const scene of chapter.scenes) {
          if (scene.id === id) {
            return { id, type: 'scene', title: scene.title };
          }
        }
      }
    }
    return null;
  };

  const reorderItems = (parts: OutlinePart[], activeId: string, overId: string): OutlinePart[] => {
    const partIds = parts.map(p => p.id);
    const activeIndex = partIds.indexOf(activeId);
    const overIndex = partIds.indexOf(overId);
    
    if (activeIndex !== -1 && overIndex !== -1) {
      const reorderedParts = arrayMove(parts, activeIndex, overIndex);
      return reorderedParts.map((part, index) => ({ ...part, order: index }));
    }
    
    return parts;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = findItemById(active.id as string);
    if (item) {
      setDraggedItem(item);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setDraggedItem(null);
      return;
    }

    try {
      const updatedParts = reorderItems(outline.parts, active.id as string, over.id as string);
      await onReorder(updatedParts);
    } catch (error) {
      console.error('Failed to reorder items:', error);
    }
    
    setDraggedItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={outline.parts.map(p => p.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      
      <DragOverlay>
        {draggedItem && (
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border">
            <span className="text-sm font-medium">{draggedItem.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
