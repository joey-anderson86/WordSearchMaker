import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Lock, Unlock, Type, Image as ImageIcon, Square, Grid } from 'lucide-react';
import { useCanvasStore, CanvasElement } from '../../../store/canvasStore';

// ----------------------------------------------------------------------
// 1. Sortable Layer Row Component
// ----------------------------------------------------------------------
interface SortableLayerItemProps {
  element: CanvasElement;
  isActive: boolean;
  onActivate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
}

const SortableLayerItem: React.FC<SortableLayerItemProps> = ({
  element,
  isActive,
  onActivate,
  onToggleVisibility,
  onToggleLock,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  // Helper to render an icon based on ElementType
  const renderIcon = () => {
    switch (element.type) {
      case 'TEXT': return <Type size={16} />;
      case 'IMAGE': return <ImageIcon size={16} />;
      case 'PUZZLE_GRID': return <Grid size={16} />;
      case 'SHAPE': return <Square size={16} />;
      default: return <Square size={16} />;
    }
  };

  const displayName = element.type === 'TEXT' 
    ? `Text: ${element.contentData.substring(0, 10)}${element.contentData.length > 10 ? '...' : ''}`
    : element.type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onActivate(element.id)}
      className={`flex items-center justify-between p-2 mb-1 rounded cursor-pointer border select-none ${
        isActive 
          ? 'bg-blue-900 border-blue-500' 
          : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
      } ${isDragging ? 'opacity-50 ring-2 ring-blue-400' : ''}`}
    >
      <div 
        className="flex items-center gap-3 flex-1 overflow-hidden"
        {...attributes}
        {...listeners}
      >
        <div className="text-gray-400 cursor-grab active:cursor-grabbing">
          {renderIcon()}
        </div>
        <span className="text-sm text-gray-200 truncate">{displayName}</span>
      </div>

      {/* Action Toggles */}
      <div className="flex items-center gap-1">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleLock(element.id); }}
          className="p-1 text-gray-400 hover:text-white transition"
          title="Toggle Lock"
        >
          {element.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(element.id); }}
          className="p-1 text-gray-400 hover:text-white transition"
          title="Toggle Visibility"
        >
          {element.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>
    </div>
  );
};


// ----------------------------------------------------------------------
// 2. Main Layers Panel
// ----------------------------------------------------------------------
export const LayersPanel: React.FC = () => {
  const elements = useCanvasStore((state) => state.elements);
  const activeElementId = useCanvasStore((state) => state.activeElementId);
  const setActiveElement = useCanvasStore((state) => state.setActiveElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const reorderElements = useCanvasStore((state) => state.reorderElements);

  // Z-index rendering means last in array = top layer.
  // We reverse it so top layer is at the top of the visual list.
  const reversedElements = [...elements].reverse();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // require 5px movement before dragging starts (allows clicks to pass through)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const visualOldIndex = reversedElements.findIndex((el) => el.id === active.id);
      const visualNewIndex = reversedElements.findIndex((el) => el.id === over.id);

      // Convert visual indexes back to actual array indexes
      const actualOldIndex = elements.length - 1 - visualOldIndex;
      const actualNewIndex = elements.length - 1 - visualNewIndex;

      reorderElements(actualOldIndex, actualNewIndex);
    }
  };

  const handleToggleVisibility = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el) updateElement(id, { isVisible: !el.isVisible });
  };

  const handleToggleLock = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el) updateElement(id, { isLocked: !el.isLocked });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      <div className="p-4 border-b border-gray-800 bg-gray-850">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Layers</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={reversedElements.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {reversedElements.map((element) => (
              <SortableLayerItem
                key={element.id}
                element={element}
                isActive={activeElementId === element.id}
                onActivate={setActiveElement}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
              />
            ))}
          </SortableContext>
        </DndContext>
        
        {elements.length === 0 && (
          <div className="text-center text-sm text-gray-500 mt-10">
            No elements on the canvas
          </div>
        )}
      </div>
    </div>
  );
};
