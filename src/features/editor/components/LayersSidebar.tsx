import React from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Lock, Unlock, GripVertical } from 'lucide-react';
import { useCanvasStore, CanvasElement } from '../../../store/canvasStore';

interface SortableLayerItemProps {
  element: CanvasElement;
  isActive: boolean;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onSelect: () => void;
}

const SortableLayerItem: React.FC<SortableLayerItemProps> = ({ 
  element, 
  isActive, 
  onToggleVisibility, 
  onToggleLock,
  onSelect
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center p-2 border-b text-sm cursor-pointer ${isActive ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'} transition-colors`}
      onClick={onSelect}
    >
      <div {...attributes} {...listeners} className="cursor-grab mr-2 text-gray-400 hover:text-gray-600">
        <GripVertical size={16} />
      </div>
      
      <div className="flex-1 truncate font-medium text-gray-700">
        {element.type} <span className="text-gray-400 text-xs">#{element.id.slice(0, 4)}</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
          className="text-gray-500 hover:text-gray-800 focus:outline-none"
          title={element.isLocked ? "Unlock" : "Lock"}
        >
          {element.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className="text-gray-500 hover:text-gray-800 focus:outline-none"
          title={element.isVisible ? "Hide" : "Show"}
        >
          {element.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>
    </div>
  );
};

export const LayersSidebar: React.FC = () => {
  const elements = useCanvasStore(state => state.elements);
  const activeElementId = useCanvasStore(state => state.activeElementId);
  const setActiveElement = useCanvasStore(state => state.setActiveElement);
  const updateElement = useCanvasStore(state => state.updateElement);
  const reorderElements = useCanvasStore(state => state.reorderElements);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires minimum 5px drag to trigger, allowing normal clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reverse elements so highest Z-index is visually at the top of the list
  const reversedElements = [...elements].reverse();
  const itemIds = reversedElements.map(el => el.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find original indices for accurate Z-index manipulation
      const oldIndex = elements.findIndex(el => el.id === active.id);
      const newIndex = elements.findIndex(el => el.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderElements(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-full shadow-sm z-10 relative">
      <div className="p-4 border-b border-gray-200 font-bold text-gray-700">
        Layers
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            {reversedElements.map((el) => (
              <SortableLayerItem 
                key={el.id} 
                element={el}
                isActive={activeElementId === el.id}
                onToggleVisibility={() => updateElement(el.id, { isVisible: !el.isVisible })}
                onToggleLock={() => updateElement(el.id, { isLocked: !el.isLocked })}
                onSelect={() => setActiveElement(el.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
