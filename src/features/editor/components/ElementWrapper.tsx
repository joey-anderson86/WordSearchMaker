import React, { useRef, useEffect } from 'react';
import { CanvasElement } from '../../../store/canvasStore';

interface ElementWrapperProps {
  element: CanvasElement;
  isActive: boolean;
  onActivate: (id: string) => void;
}

export const ElementWrapper: React.FC<ElementWrapperProps> = ({ element, isActive, onActivate }) => {
  // We use this ref to directly mutate the DOM styles during dragging (transient state)
  const targetRef = useRef<HTMLDivElement>(null);

  // Sync the DOM node with the Zustand state whenever the Zustand state *actually* updates
  // (e.g. after onDragEnd or when updated via PropertiesPanel)
  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.style.transform = `translate(${element.x}px, ${element.y}px) rotate(${element.rotation}deg)`;
      targetRef.current.style.width = `${element.width}px`;
      targetRef.current.style.height = `${element.height}px`;
    }
  }, [element.x, element.y, element.width, element.height, element.rotation]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!element.isLocked) {
      e.stopPropagation();
      onActivate(element.id);
    }
  };

  return (
    <div
      id={`editor-element-${element.id}`}
      ref={targetRef}
      onPointerDown={handlePointerDown}
      className={`absolute origin-top-left ${element.isLocked ? 'pointer-events-none' : 'cursor-pointer'} ${isActive ? 'ring-1 ring-blue-500' : ''}`}
      style={{
        display: element.isVisible ? 'block' : 'none',
        // Initialize base style mapping
        transform: `translate(${element.x}px, ${element.y}px) rotate(${element.rotation}deg)`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        ...element.style,
      }}
    >
      {/* Content Rendering based on Element Type */}
      {element.type === 'TEXT' && (
        <div className="w-full h-full overflow-hidden text-gray-900" style={{ 
            fontFamily: element.style?.fontFamily as string,
            fontSize: element.style?.fontSize ? `${element.style.fontSize}px` : undefined,
            fontWeight: element.style?.fontWeight as string | number,
        }}>
          {element.contentData}
        </div>
      )}
      
      {element.type === 'IMAGE' && (
        <img 
          src={element.contentData} 
          alt="" 
          className="w-full h-full object-contain pointer-events-none" 
        />
      )}
      
      {element.type === 'PUZZLE_GRID' && (
        <div className="w-full h-full border border-gray-300 flex items-center justify-center bg-gray-50/50">
          <span className="text-gray-400 text-sm font-medium">Puzzle Grid Placeholder</span>
        </div>
      )}
      
      {element.type === 'SHAPE' && (
        <div className="w-full h-full bg-gray-300"></div>
      )}
    </div>
  );
};
