import { useStore } from "../../../store";
import { 
  Palette, 
  Type, 
  Grid3x3, 
  Columns, 
  Sliders,
  Image as ImageIcon,
  Plus,
  Trash2,
  Folder,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RefreshCw,
  ImagePlus
} from "lucide-react";
import React from "react";
import { fontOptions } from "../../../utils/fonts";

export function RightPanel() {
  const viewMode = useStore((state) => state.viewMode);
  const isCover = viewMode === "cover";

  const pages = useStore((state) => state.pages);
  const selectedPageId = useStore((state) => state.selectedPageId);
  const selectedElementId = useStore((state) => state.selectedElementId);
  
  const setSelectedElementId = useStore((state) => state.setSelectedElementId);
  const updatePage = useStore((state) => state.updatePage);
  const updatePageElementLayout = useStore((state) => state.updatePageElementLayout);
  const updatePageElementContent = useStore((state) => state.updatePageElementContent);
  const addArtLayer = useStore((state) => state.addArtLayer);
  const deleteArtLayer = useStore((state) => state.deleteArtLayer);
  const updateArtLayer = useStore((state) => state.updateArtLayer);
  const resetPageLayout = useStore((state) => state.resetPageLayout);
  
  const updatePageMargin = useStore((state) => state.updatePageMargin);
  const updatePageShowMargins = useStore((state) => state.updatePageShowMargins);
  
  const pageSize = useStore((state) => state.pageSize);

  const coverElements = useStore((state) => state.coverElements);
  const coverArtLayers = useStore((state) => state.coverArtLayers);
  const selectedCoverElementId = useStore((state) => state.selectedCoverElementId);
  const setSelectedCoverElementId = useStore((state) => state.setSelectedCoverElementId);
  const updateCoverElement = useStore((state) => state.updateCoverElement);
  const addCoverArtLayer = useStore((state) => state.addCoverArtLayer);
  const updateCoverArtLayer = useStore((state) => state.updateCoverArtLayer);
  const deleteCoverArtLayer = useStore((state) => state.deleteCoverArtLayer);
  const coverBgColor = useStore((state) => state.coverBgColor);
  const setCoverBgColor = useStore((state) => state.setCoverBgColor);
  const coverBgImage = useStore((state) => state.coverBgImage);
  const setCoverBgImage = useStore((state) => state.setCoverBgImage);

  const activePage = pages.find((p) => p.id === selectedPageId);
  const activePuzzle = activePage?.metadata;

  if (!isCover && (!activePage || !activePuzzle)) {
    return (
      <div className="w-80 bg-slate-900 text-slate-100 flex flex-col h-screen overflow-hidden shadow-xl z-10 border-l border-slate-800 p-5 items-center justify-center text-center text-slate-500 text-xs">
        <Palette size={32} className="opacity-20 mb-2 text-emerald-400" />
        <p>Select a puzzle to customize its typography and layout.</p>
      </div>
    );
  }

  const isWordSearch = isCover ? false : activePuzzle?.specificData.type === "WordSearch";

  const currentElements = isCover ? coverElements : activePage!.gridLayout;
  const currentArtLayers = isCover ? coverArtLayers : activePage!.artLayers;
  const currentSelectedId = isCover ? selectedCoverElementId : selectedElementId;

  const setCurrentSelectedId = (id: string | null) => {
    if (isCover) setSelectedCoverElementId(id);
    else setSelectedElementId(id);
  };

  const handleArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        const newLayer = {
          id: `art-${Date.now()}`,
          url: base64Url,
          x: 50,
          y: 200,
          width: 150,
          height: 150,
          zIndex: 1,
          opacity: 1
        };
        if (isCover) {
          addCoverArtLayer(newLayer);
          setSelectedCoverElementId(newLayer.id);
        } else {
          addArtLayer(activePage!.id, newLayer);
          setSelectedElementId(newLayer.id);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCoverBgImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectedElement = currentElements.find(el => el.id === currentSelectedId);
  const selectedArtLayer = currentArtLayers.find(l => l.id === currentSelectedId);

  // Position and Dimension edits
  const handleLayoutEdit = (key: 'x' | 'y' | 'width' | 'height' | 'rotation', val: number) => {
    if (selectedElement) {
      if (isCover) {
        updateCoverElement(selectedElement.id, { [key]: val });
      } else {
        updatePageElementLayout(activePage!.id, selectedElement.id, { [key]: val });
      }
    } else if (selectedArtLayer) {
      if (isCover) {
        updateCoverArtLayer(selectedArtLayer.id, { [key]: val });
      } else {
        updateArtLayer(activePage!.id, selectedArtLayer.id, { [key]: val });
      }
    }
  };

  const handleContentEdit = (type: string, updates: any) => {
    if (isCover) {
      updateCoverElement(selectedElement!.id, { content: { ...selectedElement!.content, ...updates }});
    } else {
      updatePageElementContent(activePage!.id, type as any, updates);
    }
  };

  const handleDeleteArtLayer = (id: string) => {
    if (isCover) {
      deleteCoverArtLayer(id);
    } else {
      deleteArtLayer(activePage!.id, id);
    }
  };

  // Preset background colors
  const pageBgPresets = ["#ffffff", "#f8fafc", "#f4f4f5", "#fdfaf2", "#fffcf0", "#e0f2fe"];
  const coverBgPresets = ["#ffffff", "#1e293b", "#0f172a", "#7f1d1d", "#064e3b", "#1e3a8a"];

  return (
    <div className="w-80 bg-slate-900 text-slate-100 flex flex-col h-screen overflow-hidden shadow-xl z-10 border-l border-slate-800 flex-shrink-0">
      {/* Header Panel */}
      <div className="p-5 pb-4 border-b border-slate-800 flex items-center gap-3 flex-shrink-0">
        <Palette className="text-emerald-400 animate-pulse" size={22} />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Layout & Typesetting</h2>
      </div>

      {/* 1. Document Hierarchy Tree Section */}
      <div className="p-4 border-b border-slate-800 flex flex-col gap-2 max-h-[35%] overflow-y-auto bg-slate-950/20">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Document Elements Hierarchy</span>
        <div className="flex flex-col gap-1 text-xs">
          {/* Root Page Node */}
          <div 
            onClick={() => setCurrentSelectedId(null)}
            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${currentSelectedId === null ? "bg-slate-800 text-emerald-400 font-bold" : "hover:bg-slate-800/40 text-slate-300"}`}
          >
            <FileText size={14} className="text-slate-400" />
            <span>{isCover ? "🖼️ Cover Spread (Root)" : "📄 Page Layout (Root)"}</span>
          </div>

          {/* Child Elements */}
          <div className="pl-4 border-l border-slate-800 flex flex-col gap-1">
            {currentElements.map(el => (
              <div 
                key={el.id}
                onClick={() => setCurrentSelectedId(el.id)}
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${currentSelectedId === el.id ? "bg-slate-800 text-emerald-400 font-bold" : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"}`}
              >
                {(el.type === "title" || el.type === "spine") && <Type size={12} className="text-sky-400" />}
                {el.type === "grid" && <Grid3x3 size={12} className="text-purple-400" />}
                {el.type === "wordbank" && <Columns size={12} className="text-amber-400" />}
                <span className="capitalize">{el.id} Element</span>
              </div>
            ))}

            {/* Art Layers Sub-Folder */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between p-1 text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                <span className="flex items-center gap-1"><Folder size={10} /> Art Layers ({currentArtLayers.length})</span>
                <label className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer transition-colors">
                  <Plus size={10} /> Add Decal
                  <input type="file" accept="image/*" className="hidden" onChange={handleArtUpload} />
                </label>
              </div>

              {currentArtLayers.map((layer, idx) => (
                <div 
                  key={layer.id}
                  onClick={() => setCurrentSelectedId(layer.id)}
                  className={`flex items-center justify-between p-1.5 rounded cursor-pointer group/item transition-colors ${currentSelectedId === layer.id ? "bg-slate-800 text-emerald-400 font-bold" : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-350"}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ImageIcon size={12} className="text-emerald-500 flex-shrink-0" />
                    <span className="truncate">Decal Layer {idx + 1}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteArtLayer(layer.id);
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:text-rose-400 text-slate-500 rounded transition-opacity"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Element Properties Editor */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 leading-normal bg-slate-900">
        
        {/* Render Page Properties */}
        {currentSelectedId === null && (
          <div className="flex flex-col gap-4">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">{isCover ? "Cover Spread Properties" : "Page Properties"}</h3>
            </div>

            {/* Background Color Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-400">Background Color</label>
              <div className="flex flex-wrap gap-2.5">
                {(isCover ? coverBgPresets : pageBgPresets).map((color) => {
                  const isActive = isCover ? coverBgColor === color : activePage!.backgroundColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => isCover ? setCoverBgColor(color) : updatePage(activePage!.id, { ...activePage!, backgroundColor: color })}
                      className={`w-6 h-6 rounded-full border border-slate-700 transition-transform ${isActive ? "scale-110 border-white ring-2 ring-emerald-500/50" : "hover:scale-105"}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  );
                })}
                <input 
                  type="color" 
                  value={isCover ? coverBgColor : (activePage!.backgroundColor || "#ffffff")} 
                  onChange={(e) => isCover ? setCoverBgColor(e.target.value) : updatePage(activePage!.id, { ...activePage!, backgroundColor: e.target.value })}
                  className="w-6 h-6 rounded border border-slate-700 cursor-pointer p-0 bg-transparent"
                />
              </div>
            </div>

            {isCover && (
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] font-semibold text-slate-400">Wrap Background Image</label>
                {coverBgImage ? (
                  <div className="flex flex-col gap-2">
                    <img src={coverBgImage} className="w-full h-24 object-cover rounded border border-slate-700" alt="Cover Bg" />
                    <button
                      onClick={() => setCoverBgImage(null)}
                      className="bg-rose-900/40 text-rose-400 border border-rose-800 rounded p-1 text-xs hover:bg-rose-900/60"
                    >
                      Remove Wrap Image
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-800 transition-colors">
                    <ImagePlus className="text-slate-500 mb-2" size={20} />
                    <span className="text-xs text-slate-400">Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverBgUpload} />
                  </label>
                )}
              </div>
            )}

            {!isCover && (
              <>
                {/* Printable Area Margins (pt) */}
                <div className="flex flex-col gap-2 bg-slate-950/20 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Printable Margins (pt)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 font-semibold">Top</label>
                      <input
                        type="number"
                        value={activePage!.margin?.top ?? 40}
                        onChange={(e) => updatePageMargin(activePage!.id, { top: parseFloat(e.target.value) || 0 })}
                        className="bg-slate-800 border border-slate-750 rounded p-1 text-slate-200 outline-none font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 font-semibold">Bottom</label>
                      <input
                        type="number"
                        value={activePage!.margin?.bottom ?? 50}
                        onChange={(e) => updatePageMargin(activePage!.id, { bottom: parseFloat(e.target.value) || 0 })}
                        className="bg-slate-800 border border-slate-750 rounded p-1 text-slate-200 outline-none font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 font-semibold">Inside (Gutter)</label>
                      <input
                        type="number"
                        value={activePage!.margin?.inside ?? (activePage!.margin as any)?.left ?? 50}
                        onChange={(e) => updatePageMargin(activePage!.id, { inside: parseFloat(e.target.value) || 0 })}
                        className="bg-slate-800 border border-slate-750 rounded p-1 text-slate-200 outline-none font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 font-semibold">Outside</label>
                      <input
                        type="number"
                        value={activePage!.margin?.outside ?? (activePage!.margin as any)?.right ?? 40}
                        onChange={(e) => updatePageMargin(activePage!.id, { outside: parseFloat(e.target.value) || 0 })}
                        className="bg-slate-800 border border-slate-750 rounded p-1 text-slate-200 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="show-margins-guide"
                      checked={activePage!.showMargins ?? true}
                      onChange={(e) => updatePageShowMargins(activePage!.id, e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700 accent-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="show-margins-guide" className="text-[10px] font-semibold text-slate-350 cursor-pointer select-none">
                      Show Safe Margin Guide lines
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => resetPageLayout(activePage!.id, pageSize)}
                  className="mt-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <RefreshCw size={14} /> Reset Layout to Defaults
                </button>
              </>
            )}
          </div>
        )}

        {/* Layout Box Controls */}
        {(selectedElement || selectedArtLayer) && (
          <div className="flex flex-col gap-3.5 bg-slate-950/20 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-300 border-b border-slate-850 pb-1.5">
              <Sliders size={14} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Position & Size (pt)</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-semibold">X Position</label>
                <input 
                  type="number" 
                  value={selectedElement ? Math.round(selectedElement.x) : Math.round(selectedArtLayer!.x)}
                  onChange={(e) => handleLayoutEdit('x', parseFloat(e.target.value) || 0)}
                  className="bg-slate-800 border border-slate-750 rounded-lg p-1.5 text-slate-200 outline-none font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-semibold">Y Position</label>
                <input 
                  type="number" 
                  value={selectedElement ? Math.round(selectedElement.y) : Math.round(selectedArtLayer!.y)}
                  onChange={(e) => handleLayoutEdit('y', parseFloat(e.target.value) || 0)}
                  className="bg-slate-800 border border-slate-750 rounded-lg p-1.5 text-slate-200 outline-none font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-semibold">Width</label>
                <input 
                  type="number" 
                  value={selectedElement ? Math.round(selectedElement.width) : Math.round(selectedArtLayer!.width)}
                  onChange={(e) => handleLayoutEdit('width', parseFloat(e.target.value) || 20)}
                  className="bg-slate-800 border border-slate-750 rounded-lg p-1.5 text-slate-200 outline-none font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-semibold">Height</label>
                <input 
                  type="number" 
                  value={selectedElement ? Math.round(selectedElement.height) : Math.round(selectedArtLayer!.height)}
                  onChange={(e) => handleLayoutEdit('height', parseFloat(e.target.value) || 20)}
                  className="bg-slate-800 border border-slate-750 rounded-lg p-1.5 text-slate-200 outline-none font-mono"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[10px] text-slate-400 font-semibold">Rotation (deg)</label>
                <input 
                  type="number" 
                  value={selectedElement ? Math.round(selectedElement.rotation || 0) : Math.round(selectedArtLayer!.rotation || 0)}
                  onChange={(e) => handleLayoutEdit('rotation', parseFloat(e.target.value) || 0)}
                  className="bg-slate-800 border border-slate-750 rounded-lg p-1.5 text-slate-200 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* 1. Title/Spine Element Properties */}
        {selectedElement && (selectedElement.type === "title" || selectedElement.type === "spine") && (
          <div className="flex flex-col gap-4">
            <div className="border-b border-slate-800 pb-1.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-400">Text Formatting</h3>
            </div>

            {/* Title Text Content */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Text</label>
              <input
                type="text"
                value={selectedElement.content.text || ""}
                onChange={(e) => handleContentEdit(selectedElement.type, { text: e.target.value })}
                className="bg-slate-800 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Font Family Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Font Family</label>
              <select
                value={selectedElement.content.fontFamily || "Modern Sans"}
                onChange={(e) => handleContentEdit(selectedElement.type, { fontFamily: e.target.value })}
                className="bg-slate-800 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 cursor-pointer outline-none"
              >
                {fontOptions.map(font => (
                  <option key={font.value} value={font.value} className="bg-slate-800">{font.label}</option>
                ))}
              </select>
            </div>

            {/* Font Size Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span className="font-semibold">Font Size</span>
                <span className="text-sky-400 font-mono font-bold">{selectedElement.content.fontSize ?? 28}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="100"
                step="1"
                value={selectedElement.content.fontSize ?? 28}
                onChange={(e) => handleContentEdit(selectedElement.type, { fontSize: parseInt(e.target.value) })}
                className="accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none w-full"
              />
            </div>

            {/* Title Text Alignment */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Alignment</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-800 p-0.5 rounded-lg">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => handleContentEdit(selectedElement.type, { align })}
                    className={`py-1 flex justify-center items-center rounded text-xs transition-colors cursor-pointer ${selectedElement.content.align === align ? "bg-sky-600 text-white font-bold" : "hover:bg-slate-700/60 text-slate-400"}`}
                  >
                    {align === "left" && <AlignLeft size={14} />}
                    {align === "center" && <AlignCenter size={14} />}
                    {align === "right" && <AlignRight size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Color Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-400">Text Color</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={selectedElement.content.color || "#000000"} 
                  onChange={(e) => handleContentEdit(selectedElement.type, { color: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-750 cursor-pointer p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={selectedElement.content.color || "#000000"} 
                  onChange={(e) => handleContentEdit(selectedElement.type, { color: e.target.value })}
                  className="bg-slate-800 border border-slate-750 rounded p-1.5 text-xs text-slate-200 font-mono flex-1 outline-none"
                />
              </div>
            </div>

            {!isCover && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="title-theme-accents"
                  checked={selectedElement.content.themeAccents || false}
                  onChange={(e) => handleContentEdit(selectedElement.type, { themeAccents: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-800 border-slate-700 accent-sky-500 cursor-pointer"
                />
                <label htmlFor="title-theme-accents" className="text-xs font-semibold text-slate-350 cursor-pointer select-none">
                  Toggle "Theme Accents"
                </label>
              </div>
            )}
          </div>
        )}

        {/* 2. Grid Element Properties */}
        {selectedElement && selectedElement.type === "grid" && !isCover && (
          <div className="flex flex-col gap-4">
            <div className="border-b border-slate-800 pb-1.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-400">Grid Styling</h3>
            </div>

            {/* Font Family Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Grid Font</label>
              <select
                value={selectedElement.content.gridFont || "Modern Sans"}
                onChange={(e) => handleContentEdit("grid", { gridFont: e.target.value })}
                className="bg-slate-800 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 cursor-pointer outline-none"
              >
                {fontOptions.map(font => (
                  <option key={font.value} value={font.value} className="bg-slate-800">{font.label}</option>
                ))}
              </select>
            </div>

            {/* Word Search Grid Specifics */}
            {isWordSearch && (
              <>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="grid-cell-borders"
                    checked={selectedElement.content.cellBorders || false}
                    onChange={(e) => handleContentEdit("grid", { cellBorders: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 accent-purple-500 cursor-pointer"
                  />
                  <label htmlFor="grid-cell-borders" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                    Cell Borders (Grid Lines)
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="grid-ide-theme"
                    checked={selectedElement.content.ideTheme || false}
                    onChange={(e) => handleContentEdit("grid", { ideTheme: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 accent-purple-500 cursor-pointer"
                  />
                  <label htmlFor="grid-ide-theme" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                    IDE Container Style
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Letter Tracking</span>
                    <span className="text-purple-400 font-mono font-bold">{(selectedElement.content.letterTracking ?? 0)}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={selectedElement.content.letterTracking ?? 0}
                    onChange={(e) => handleContentEdit("grid", { letterTracking: parseFloat(e.target.value) })}
                    className="accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-400">Solution View Style</label>
                  <select
                    value={selectedElement.content.solutionStyle || "Greyscale Mute"}
                    onChange={(e) => handleContentEdit("grid", { solutionStyle: e.target.value })}
                    className="bg-slate-800 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 cursor-pointer outline-none"
                  >
                    <option value="Greyscale Mute" className="bg-slate-800">Greyscale Mute (Dim Filler Letters)</option>
                    <option value="Pill Outlines" className="bg-slate-800">Pill Outlines (Uniform Capsule)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="grid-solution-overlay-behind"
                    checked={selectedElement.content.solutionOverlayBehind ?? true}
                    onChange={(e) => handleContentEdit("grid", { solutionOverlayBehind: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 accent-purple-500 cursor-pointer"
                  />
                  <label htmlFor="grid-solution-overlay-behind" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                    Draw Solution Overlay Behind Letters
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="grid-hide-solution-grid-borders"
                    checked={selectedElement.content.hideSolutionGridBorders ?? false}
                    onChange={(e) => handleContentEdit("grid", { hideSolutionGridBorders: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 accent-purple-500 cursor-pointer"
                  />
                  <label htmlFor="grid-hide-solution-grid-borders" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                    Hide Grid Background/Borders in Solutions
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. Word Bank Element Properties */}
        {selectedElement && selectedElement.type === "wordbank" && !isCover && (
          <div className="flex flex-col gap-4">
            <div className="border-b border-slate-800 pb-1.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Word Bank / Clues Customization</h3>
            </div>

            {/* Font Family Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Font Family</label>
              <select
                value={selectedElement.content.fontFamily || "Modern Sans"}
                onChange={(e) => handleContentEdit("wordbank", { fontFamily: e.target.value })}
                className="bg-slate-800 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 cursor-pointer outline-none"
              >
                {fontOptions.map(font => (
                  <option key={font.value} value={font.value} className="bg-slate-800">{font.label}</option>
                ))}
              </select>
            </div>

            {/* Font Size Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span className="font-semibold">Font Size</span>
                <span className="text-amber-400 font-mono font-bold">{selectedElement.content.fontSize ?? 12}px</span>
              </div>
              <input
                type="range"
                min="7"
                max="24"
                step="0.5"
                value={selectedElement.content.fontSize ?? 12}
                onChange={(e) => handleContentEdit("wordbank", { fontSize: parseFloat(e.target.value) })}
                className="accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none w-full"
              />
            </div>

            {isWordSearch && (
              <>
                {/* Columns layout */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-400">Layout Columns</label>
                  <select
                    value={selectedElement.content.columns || 3}
                    onChange={(e) => handleContentEdit("wordbank", { columns: parseInt(e.target.value) })}
                    className="bg-slate-800 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 cursor-pointer outline-none"
                  >
                    <option value="2" className="bg-slate-800">2 Columns</option>
                    <option value="3" className="bg-slate-800">3 Columns</option>
                    <option value="4" className="bg-slate-800">4 Columns</option>
                  </select>
                </div>

                {/* Bullet/Checkbox selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-400">Bullet/Selector Prefix</label>
                  <select
                    value={selectedElement.content.selectorStyle || "Clean Text (No Bullets)"}
                    onChange={(e) => handleContentEdit("wordbank", { selectorStyle: e.target.value })}
                    className="bg-slate-800 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 cursor-pointer outline-none"
                  >
                    <option value="Clean Text (No Bullets)" className="bg-slate-800">Clean Text (No Bullets)</option>
                    <option value="Classic Bullet Points" className="bg-slate-800">Classic Bullet Points (•)</option>
                    <option value="Checkbox [ ] Style" className="bg-slate-800">Checkbox [ ] Style</option>
                  </select>
                </div>
              </>
            )}

            {/* Word Bank Color Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-400">Text Color</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={selectedElement.content.color || "#334155"} 
                  onChange={(e) => handleContentEdit("wordbank", { color: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-750 cursor-pointer p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={selectedElement.content.color || "#334155"} 
                  onChange={(e) => handleContentEdit("wordbank", { color: e.target.value })}
                  className="bg-slate-800 border border-slate-750 rounded p-1.5 text-xs text-slate-200 font-mono flex-1 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Art Layer Properties */}
        {selectedArtLayer && (
          <div className="flex flex-col gap-4">
            <div className="border-b border-slate-800 pb-1.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Art Layer Settings</h3>
            </div>

            {/* Opacity Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span className="font-semibold">Layer Opacity</span>
                <span className="text-emerald-400 font-mono font-bold">{Math.round((selectedArtLayer.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedArtLayer.opacity ?? 1}
                onChange={(e) => isCover ? updateCoverArtLayer(selectedArtLayer.id, { opacity: parseFloat(e.target.value) }) : updateArtLayer(activePage!.id, selectedArtLayer.id, { opacity: parseFloat(e.target.value) })}
                className="accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none w-full"
              />
            </div>

            {/* Z-Index Controls */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Z-Index (Layer Order)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={selectedArtLayer.zIndex ?? 1}
                  onChange={(e) => isCover ? updateCoverArtLayer(selectedArtLayer.id, { zIndex: parseInt(e.target.value) || 1 }) : updateArtLayer(activePage!.id, selectedArtLayer.id, { zIndex: parseInt(e.target.value) || 1 })}
                  className="bg-slate-800 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 font-mono w-1/3 outline-none"
                />
                <span className="text-[10px] text-slate-500 leading-normal flex-1 flex items-center">
                  Lower numbers go behind the text/grid elements.
                </span>
              </div>
            </div>

            {/* Image URL display / change */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Image Source URL</label>
              <textarea
                value={selectedArtLayer.url.startsWith("data:") ? "Local Upload (Base64)" : selectedArtLayer.url}
                disabled={selectedArtLayer.url.startsWith("data:")}
                onChange={(e) => isCover ? updateCoverArtLayer(selectedArtLayer.id, { url: e.target.value }) : updateArtLayer(activePage!.id, selectedArtLayer.id, { url: e.target.value })}
                className="bg-slate-800 border border-slate-750 rounded-lg p-2 text-[10px] font-mono h-16 text-slate-300 outline-none resize-none disabled:opacity-50"
              />
            </div>

            <button
              onClick={() => handleDeleteArtLayer(selectedArtLayer.id)}
              className="mt-2 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 text-rose-400 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Trash2 size={14} /> Remove Art Layer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
