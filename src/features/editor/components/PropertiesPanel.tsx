import React, { useState, useEffect } from 'react';
import { useCanvasStore, CanvasElement } from '../../../store/canvasStore';

export const PropertiesPanel: React.FC = () => {
  const elements = useCanvasStore((state) => state.elements);
  const activeElementId = useCanvasStore((state) => state.activeElementId);
  const updateElement = useCanvasStore((state) => state.updateElement);

  const activeElement = elements.find((el) => el.id === activeElementId) || null;

  // Local state for smooth typing in inputs
  const [localState, setLocalState] = useState<Partial<CanvasElement> | null>(null);

  // Sync local state when the active element changes (e.g. selection change or after a drag ends)
  useEffect(() => {
    if (activeElement) {
      setLocalState({
        x: activeElement.x,
        y: activeElement.y,
        width: activeElement.width,
        height: activeElement.height,
        rotation: activeElement.rotation,
        style: activeElement.style || {},
      });
    } else {
      setLocalState(null);
    }
  }, [activeElement]);

  // Optional: Dynamic sync during transient drag. 
  // Since we don't update Zustand onDrag, we can observe the DOM node to update the inputs live.
  useEffect(() => {
    if (!activeElementId) return;
    
    let rafId: number;
    const node = document.getElementById(`editor-element-${activeElementId}`);
    
    const syncFromDOM = () => {
      if (node && document.activeElement?.tagName !== 'INPUT') {
        // Only sync if user isn't actively typing in an input
        const transform = node.style.transform;
        
        // Very basic parsing to get live updates during drag
        const translateMatch = transform.match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
        const rotateMatch = transform.match(/rotate\(([^d]+)deg\)/);
        
        if (translateMatch) {
          const newX = Math.round(parseFloat(translateMatch[1]));
          const newY = Math.round(parseFloat(translateMatch[2]));
          const newRot = rotateMatch ? Math.round(parseFloat(rotateMatch[1])) : 0;
          const newWidth = Math.round(parseFloat(node.style.width || '0'));
          const newHeight = Math.round(parseFloat(node.style.height || '0'));

          setLocalState(prev => {
            if (!prev) return prev;
            // Prevent state thrashing if values haven't changed
            if (prev.x === newX && prev.y === newY && prev.width === newWidth && prev.height === newHeight && prev.rotation === newRot) {
              return prev;
            }
            return { ...prev, x: newX, y: newY, width: newWidth, height: newHeight, rotation: newRot };
          });
        }
      }
      rafId = requestAnimationFrame(syncFromDOM);
    };
    
    rafId = requestAnimationFrame(syncFromDOM);
    return () => cancelAnimationFrame(rafId);
  }, [activeElementId]);


  if (!activeElement || !localState) {
    return (
      <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-6 items-center justify-center text-center">
        <p className="text-gray-500">Select an element to edit properties.</p>
      </div>
    );
  }

  const handleTransformChange = (field: keyof CanvasElement, value: number) => {
    setLocalState((prev) => prev ? { ...prev, [field]: value } : null);
    updateElement(activeElement.id, { [field]: value });
  };

  const handleStyleChange = (field: string, value: any) => {
    setLocalState((prev) => {
      if (!prev) return prev;
      return { ...prev, style: { ...prev.style, [field]: value } };
    });
    updateElement(activeElement.id, {
      style: { ...activeElement.style, [field]: value }
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      <div className="p-4 border-b border-gray-800 bg-gray-850 flex justify-between items-center">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Properties</h2>
        <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">{activeElement.type}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Transform Group */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Transform</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">X (px)</label>
              <input
                type="number"
                value={Math.round(localState.x || 0)}
                onChange={(e) => handleTransformChange('x', parseFloat(e.target.value) || 0)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Y (px)</label>
              <input
                type="number"
                value={Math.round(localState.y || 0)}
                onChange={(e) => handleTransformChange('y', parseFloat(e.target.value) || 0)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">W (px)</label>
              <input
                type="number"
                value={Math.round(localState.width || 0)}
                onChange={(e) => handleTransformChange('width', Math.max(1, parseFloat(e.target.value) || 1))}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">H (px)</label>
              <input
                type="number"
                value={Math.round(localState.height || 0)}
                onChange={(e) => handleTransformChange('height', Math.max(1, parseFloat(e.target.value) || 1))}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs text-gray-400">Rotation (°)</label>
              <input
                type="number"
                value={Math.round(localState.rotation || 0)}
                onChange={(e) => handleTransformChange('rotation', parseFloat(e.target.value) || 0)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Typography Group */}
        {activeElement.type === 'TEXT' && (
          <section className="pt-4 border-t border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Typography</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Font Family</label>
                <select
                  value={localState.style?.fontFamily || 'Arial'}
                  onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Weight</label>
                  <select
                    value={localState.style?.fontWeight || 'normal'}
                    onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="300">Light</option>
                    <option value="600">Semi-Bold</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Size (px)</label>
                  <input
                    type="number"
                    value={localState.style?.fontSize || 16}
                    onChange={(e) => handleStyleChange('fontSize', parseFloat(e.target.value) || 16)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Letter Spacing</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localState.style?.letterSpacing || 0}
                    onChange={(e) => handleStyleChange('letterSpacing', parseFloat(e.target.value) || 0)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Line Height</label>
                  <input
                    type="number"
                    step="0.1"
                    value={localState.style?.lineHeight || 1.2}
                    onChange={(e) => handleStyleChange('lineHeight', parseFloat(e.target.value) || 1.2)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
