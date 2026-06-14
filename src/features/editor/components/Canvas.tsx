import React, { useRef, useEffect } from 'react';
import Moveable from 'react-moveable';
import { useCanvasStore, CanvasElement } from '../../../store/canvasStore';

interface ElementWrapperProps {
  element: CanvasElement;
}

const ElementWrapper: React.FC<ElementWrapperProps> = ({ element }) => {
  // Use a local ref for inline transforms to avoid React re-renders during active drag
  const targetRef = useRef<HTMLDivElement>(null);

  // Synchronize local DOM state with Zustand state on mount and when Zustand state updates 
  // (which happens onDragEnd, onResizeEnd, etc.)
  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.style.transform = `translate(${element.x}px, ${element.y}px) rotate(${element.rotation}deg)`;
      targetRef.current.style.width = `${element.width}px`;
      targetRef.current.style.height = `${element.height}px`;
    }
  }, [element.x, element.y, element.width, element.height, element.rotation]);

  return (
    <div
      id={`element-${element.id}`}
      ref={targetRef}
      className={`absolute origin-top-left ${element.isLocked ? 'pointer-events-none' : ''}`}
      style={{
        display: element.isVisible ? 'block' : 'none',
        // Initialize base style mapping
        transform: `translate(${element.x}px, ${element.y}px) rotate(${element.rotation}deg)`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        ...element.style,
      }}
    >
      {/* Render inner content based on element type */}
      {element.type === 'TEXT' && <div className="w-full h-full overflow-hidden">{element.contentData}</div>}
      {element.type === 'IMAGE' && (
        <img src={element.contentData} alt="" className="w-full h-full object-contain pointer-events-none" />
      )}
      {element.type === 'PUZZLE_GRID' && <div className="w-full h-full bg-blue-100 border border-blue-300 flex items-center justify-center">[Puzzle Grid]</div>}
      {element.type === 'SHAPE' && <div className="w-full h-full bg-gray-300"></div>}
    </div>
  );
};

export const Canvas: React.FC = () => {
  const elements = useCanvasStore((state) => state.elements);
  const activeElementId = useCanvasStore((state) => state.activeElementId);
  const setActiveElement = useCanvasStore((state) => state.setActiveElement);
  const updateElement = useCanvasStore((state) => state.updateElement);

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mutable ref to store transient coordinates during interactions 
  // preventing global re-renders on every mouse move
  const frame = useRef({
    translate: [0, 0],
    rotate: 0,
    width: 0,
    height: 0,
  });

  const activeElement = elements.find(el => el.id === activeElementId);

  // Sync transient frame when active element fundamentally changes
  useEffect(() => {
    if (activeElement) {
      frame.current = {
        translate: [activeElement.x, activeElement.y],
        rotate: activeElement.rotation,
        width: activeElement.width,
        height: activeElement.height,
      };
    }
  }, [activeElement?.id, activeElement?.x, activeElement?.y, activeElement?.rotation, activeElement?.width, activeElement?.height]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setActiveElement(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-white shadow-sm"
      onClick={handleCanvasClick}
    >
      {/* Map elements to layers using zIndex corresponding to array index */}
      {elements.map((el, index) => (
        <div 
          key={el.id} 
          style={{ position: 'absolute', zIndex: index, top: 0, left: 0 }} 
          onPointerDown={(e) => {
            if (!el.isLocked) {
              e.stopPropagation();
              setActiveElement(el.id);
            }
          }}
        >
          <ElementWrapper element={el} />
        </div>
      ))}

      {activeElement && !activeElement.isLocked && (
        <Moveable
          target={`#element-${activeElement.id}`}
          container={containerRef.current}
          draggable={true}
          resizable={true}
          rotatable={true}
          snappable={true}
          origin={false}
          
          // --- DRAG ---
          onDrag={({ target, beforeTranslate }) => {
            frame.current.translate = beforeTranslate;
            target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${frame.current.rotate}deg)`;
          }}
          onDragEnd={() => {
            if (activeElement) {
              updateElement(activeElement.id, {
                x: frame.current.translate[0],
                y: frame.current.translate[1],
              });
            }
          }}

          // --- RESIZE ---
          onResize={({ target, width, height, drag }) => {
            frame.current.width = width;
            frame.current.height = height;
            frame.current.translate = drag.beforeTranslate;
            
            target.style.width = `${width}px`;
            target.style.height = `${height}px`;
            target.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px) rotate(${frame.current.rotate}deg)`;
          }}
          onResizeEnd={() => {
            if (activeElement) {
              updateElement(activeElement.id, {
                width: frame.current.width,
                height: frame.current.height,
                x: frame.current.translate[0],
                y: frame.current.translate[1],
              });
            }
          }}

          // --- ROTATE ---
          onRotate={({ target, beforeRotate }) => {
            frame.current.rotate = beforeRotate;
            target.style.transform = `translate(${frame.current.translate[0]}px, ${frame.current.translate[1]}px) rotate(${beforeRotate}deg)`;
          }}
          onRotateEnd={() => {
            if (activeElement) {
              updateElement(activeElement.id, {
                rotation: frame.current.rotate,
              });
            }
          }}
        />
      )}
    </div>
  );
};
