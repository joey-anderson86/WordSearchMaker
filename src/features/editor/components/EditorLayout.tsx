import React from 'react';

interface EditorLayoutProps {
  layersPanel: React.ReactNode;
  canvasArea: React.ReactNode;
  propertiesPanel: React.ReactNode;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  layersPanel,
  canvasArea,
  propertiesPanel,
}) => {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-gray-900 text-gray-100">
      {/* Top Toolbar */}
      <header className="h-[50px] shrink-0 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg text-white">Puzzle Book Editor</h1>
          {/* Global Actions can go here (Undo/Redo) */}
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition">Undo</button>
            <button className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition">Redo</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Zoom controls could go here */}
          <button className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition shadow">
            Export PDF
          </button>
        </div>
      </header>

      {/* Main Workspace (3-pane layout) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Layers) */}
        <aside className="w-64 shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col">
          {layersPanel}
        </aside>

        {/* Center Stage (Canvas Area) */}
        <section className="flex-1 bg-gray-950 overflow-auto flex items-center justify-center relative p-8">
          {/* The canvas component itself should handle its own sizing, 
              but the section flex centers it and handles panning/overflow */}
          {canvasArea}
        </section>

        {/* Right Sidebar (Properties) */}
        <aside className="w-72 shrink-0 bg-gray-800 border-l border-gray-700 flex flex-col">
          {propertiesPanel}
        </aside>
      </main>
    </div>
  );
};
