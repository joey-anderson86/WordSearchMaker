import React, { useRef, useEffect } from 'react';
import Moveable from 'react-moveable';
import { useCanvasStore } from '../../../store/canvasStore';
import { ElementWrapper } from './ElementWrapper';

export const EditorCanvas: React.FC = () => {
  const elements = useCanvasStore((state) => state.elements);
  const activeElementId = useCanvasStore((state) => state.activeElementId);
  const setActiveElement = useCanvasStore((state) => state.setActiveElement);
  const updateElement = useCanvasStore((state) => state.updateElement);

  const containerRef = useRef<HTMLDivElement>(null);

  // Transient state ref: holds current coordinates mid-drag to avoid React re-renders
  const frame = useRef({
    translate: [0, 0],
    rotate: 0,
    width: 0,
    height: 0,
  });

  const activeElement = elements.find(el => el.id === activeElementId);

  // Resync the transient frame when a new element is selected or externally updated
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
    // If clicking directly on the canvas paper (not an element), deselect
    if (e.target === containerRef.current) {
      setActiveElement(null);
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center w-full h-full"
      onClick={handleCanvasClick}
    >
      {/* The Visual "Paper" */}
      <div 
        ref={containerRef}
        className="relative bg-white shadow-2xl"
        style={{
          width: '595px', // Example A4 size at ~72dpi. Can be dynamically injected from a payload.
          height: '842px',
          // Optional: Add a subtle scaling here if implementing zoom feature
        }}
      >
        {/* Render all elements, mapping array index to Z-Index */}
        {elements.map((el, index) => (
          <div key={el.id} style={{ position: 'absolute', zIndex: index, top: 0, left: 0 }}>
            <ElementWrapper 
              element={el} 
              isActive={activeElementId === el.id} 
              onActivate={setActiveElement} 
            />
          </div>
        ))}

        {/* The Moveable Control Box */}
        {activeElement && !activeElement.isLocked && (
          <Moveable
            target={`#editor-element-${activeElement.id}`}
            container={containerRef.current}
            draggable={true}
            resizable={true}
            rotatable={true}
            snappable={true}
            origin={false} // Hides the center origin dot for a cleaner UI
            
            // --- DRAG ---
            onDrag={({ target, beforeTranslate }) => {
              frame.current.translate = beforeTranslate;
              target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${frame.current.rotate}deg)`;
            }}
            onDragEnd={() => {
              updateElement(activeElement.id, {
                x: frame.current.translate[0],
                y: frame.current.translate[1],
              });
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
              updateElement(activeElement.id, {
                width: frame.current.width,
                height: frame.current.height,
                x: frame.current.translate[0],
                y: frame.current.translate[1],
              });
            }}

            // --- ROTATE ---
            onRotate={({ target, beforeRotate }) => {
              frame.current.rotate = beforeRotate;
              target.style.transform = `translate(${frame.current.translate[0]}px, ${frame.current.translate[1]}px) rotate(${beforeRotate}deg)`;
            }}
            onRotateEnd={() => {
              updateElement(activeElement.id, {
                rotation: frame.current.rotate,
              });
            }}
          />
        )}
      </div>
    </div>
  );
};
