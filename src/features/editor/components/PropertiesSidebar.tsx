import React from 'react';
import { useCanvasStore } from '../../../store/canvasStore';

export const PropertiesSidebar: React.FC = () => {
  const elements = useCanvasStore(state => state.elements);
  const activeElementId = useCanvasStore(state => state.activeElementId);
  const updateElement = useCanvasStore(state => state.updateElement);

  const activeElement = elements.find(el => el.id === activeElementId);

  if (!activeElement) {
    return (
      <div className="w-64 border-l border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 h-full">
        No element selected
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      updateElement(activeElement.id, { [field]: value });
    }
  };

  return (
    <div className="w-64 border-l border-gray-200 bg-gray-50 p-4 flex flex-col gap-4 h-full">
      <h3 className="font-bold text-gray-700">Properties</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col text-xs font-medium text-gray-500">
          X Position
          <input 
            type="number" 
            value={Math.round(activeElement.x)} 
            onChange={(e) => handleChange(e, 'x')}
            className="border border-gray-300 p-1.5 rounded mt-1 text-black w-full"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-gray-500">
          Y Position
          <input 
            type="number" 
            value={Math.round(activeElement.y)} 
            onChange={(e) => handleChange(e, 'y')}
            className="border border-gray-300 p-1.5 rounded mt-1 text-black w-full"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-gray-500">
          Width
          <input 
            type="number" 
            value={Math.round(activeElement.width)} 
            onChange={(e) => handleChange(e, 'width')}
            className="border border-gray-300 p-1.5 rounded mt-1 text-black w-full"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-gray-500">
          Height
          <input 
            type="number" 
            value={Math.round(activeElement.height)} 
            onChange={(e) => handleChange(e, 'height')}
            className="border border-gray-300 p-1.5 rounded mt-1 text-black w-full"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-gray-500 col-span-2">
          Rotation (deg)
          <input 
            type="number" 
            value={Math.round(activeElement.rotation)} 
            onChange={(e) => handleChange(e, 'rotation')}
            className="border border-gray-300 p-1.5 rounded mt-1 text-black w-full"
          />
        </label>
      </div>
    </div>
  );
};
