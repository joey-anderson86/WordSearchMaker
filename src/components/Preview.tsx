import { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Download, AlertCircle, Eye, EyeOff } from "lucide-react";

export function Preview() {
  const puzzles = useStore((state) => state.puzzles);
  const pageSize = useStore((state) => state.pageSize);
  const [showSolutions, setShowSolutions] = useState(true);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(containerRef.current);

    // Initial measurement
    const rect = containerRef.current.getBoundingClientRect();
    // Padding is p-6 (24px each side) -> 48px total to subtract
    setDimensions({
      width: Math.max(100, rect.width - 48),
      height: Math.max(100, rect.height - 48),
    });

    return () => observer.disconnect();
  }, [puzzles.length]);

  if (puzzles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8">
        <div className="w-24 h-24 mb-6 opacity-20 border-4 border-dashed rounded-xl flex items-center justify-center">
          <span className="text-4xl font-black">?</span>
        </div>
        <p className="text-xl font-medium">No puzzles generated yet.</p>
        <p className="text-sm mt-2 text-slate-500">Configure your settings in the sidebar and click Generate.</p>
      </div>
    );
  }

  const activePuzzle = puzzles[puzzles.length - 1];

  const handleExportPDF = async () => {
    try {
      const filePath = await save({
        filters: [{
          name: 'PDF Document',
          extensions: ['pdf']
        }],
        defaultPath: `${activePuzzle.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      });
      
      if (!filePath) return; // User canceled
      
      await invoke("export_to_pdf", {
        path: filePath,
        payload: activePuzzle,
        pageSize: pageSize
      });
      
      alert(`Successfully saved to ${filePath}`);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export PDF. Check console for details.");
    }
  };

  const cols = activePuzzle.grid[0]?.length || 0;
  const rows = activePuzzle.grid.length || 0;

  // Sizing calculations to fit the container
  const gap = cols > 20 || rows > 20 ? 2 : 4;
  const containerW = dimensions.width;
  const containerH = dimensions.height;

  const maxCellSizeW = (containerW - (cols - 1) * gap) / cols;
  const maxCellSizeH = (containerH - (rows - 1) * gap) / rows;
  const cellSize = Math.min(32, Math.max(10, Math.min(maxCellSizeW, maxCellSizeH)));
  const fontSize = cellSize * 0.55;

  const step = cellSize + gap;
  const gridWidth = cols * step - gap;
  const gridHeight = rows * step - gap;

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header Panel */}
      <div className="p-6 pb-2 max-w-7xl mx-auto w-full flex justify-between items-end flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 leading-none">{activePuzzle.title}</h1>
          <p className="text-slate-500 mt-2 font-medium">
            {cols} x {rows} Grid
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSolutions(!showSolutions)}
            className={`font-semibold py-2 px-4 rounded-lg shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer border ${
              showSolutions
                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-rose-100"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-slate-100"
            }`}
          >
            {showSolutions ? <EyeOff size={18} /> : <Eye size={18} />}
            {showSolutions ? "Hide Solutions" : "Show Solutions"}
          </button>

          <button
            onClick={handleExportPDF}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg shadow-md shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Download size={18} /> Export to PDF
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 p-6 pt-2 pb-6 flex flex-col gap-4 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Grid Container */}
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center overflow-hidden"
        >
          <div 
            className="relative"
            style={{
              width: `${gridWidth}px`,
              height: `${gridHeight}px`,
            }}
          >
            <div 
              className="grid font-mono font-bold text-slate-700 select-none"
              style={{ 
                gridTemplateColumns: `repeat(${cols || 1}, minmax(0, 1fr))`,
                gap: `${gap}px`,
                width: `${gridWidth}px`,
                height: `${gridHeight}px`,
              }}
            >
              {activePuzzle.grid.map((row, y) => (
                row.map((cell, x) => (
                  <div 
                    key={`${x}-${y}`} 
                    className="flex items-center justify-center rounded hover:bg-slate-100 cursor-default"
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      fontSize: `${fontSize}px`,
                    }}
                  >
                    {cell}
                  </div>
                ))
              ))}
            </div>

            {showSolutions && (
              <svg 
                className="absolute inset-0 pointer-events-none w-full h-full"
                style={{ overflow: "visible" }}
                viewBox={`0 0 ${gridWidth} ${gridHeight}`}
              >
                {activePuzzle.specific_data.solutions.map((sol, index) => {
                  const x1 = sol.start_x * step + cellSize / 2;
                  const y1 = sol.start_y * step + cellSize / 2;
                  const x2 = sol.end_x * step + cellSize / 2;
                  const y2 = sol.end_y * step + cellSize / 2;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const L = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                  const isHovered = hoveredWord === sol.word;
                  const isAnyHovered = hoveredWord !== null;

                  // Highlighting dimensions scale with cell size
                  const hHeight = cellSize * 1.125;
                  const hRadius = hHeight / 2;
                  const hoverHeight = hHeight + 8;
                  const hoverRadius = hoverHeight / 2;

                  return (
                    <g 
                      key={index}
                      className="pointer-events-auto cursor-pointer"
                      onMouseEnter={() => setHoveredWord(sol.word)}
                      onMouseLeave={() => setHoveredWord(null)}
                    >
                      {/* Invisible wider boundary to make hovering easy */}
                      <rect
                        x={x1 - hoverRadius}
                        y={y1 - hoverRadius}
                        width={L + hoverHeight}
                        height={hoverHeight}
                        rx={hoverRadius}
                        ry={hoverRadius}
                        transform={`rotate(${angle}, ${x1}, ${y1})`}
                        fill="transparent"
                      />
                      {/* Visible rounded highlighting box */}
                      <rect
                        x={x1 - hRadius}
                        y={y1 - hRadius}
                        width={L + hHeight}
                        height={hHeight}
                        rx={hRadius}
                        ry={hRadius}
                        transform={`rotate(${angle}, ${x1}, ${y1})`}
                        stroke="#ef4444"
                        strokeWidth={isHovered ? cellSize * 0.11 : cellSize * 0.08}
                        fill={isHovered ? "rgba(239, 68, 68, 0.18)" : "rgba(239, 68, 68, 0.08)"}
                        className="transition-all duration-200 ease-in-out"
                        style={{
                          opacity: isAnyHovered && !isHovered ? 0.35 : 1,
                        }}
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Word Bank Container */}
        <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex-shrink-0 max-h-[30%] overflow-y-auto">
          <h3 className="font-bold text-slate-800 mb-3 text-base border-b pb-1.5 flex items-center justify-between">
            <span>Word Bank</span>
            <span className="text-xs text-slate-400 font-normal">
              {activePuzzle.specific_data.word_bank.length - activePuzzle.specific_data.unplaced_words.length} / {activePuzzle.specific_data.word_bank.length} Placed
            </span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {activePuzzle.specific_data.word_bank.map((word, i) => {
              const unplaced = activePuzzle.specific_data.unplaced_words.includes(word);
              const upperWord = word.toUpperCase();
              const isHovered = hoveredWord === upperWord;
              const isAnyHovered = hoveredWord !== null;

              // Word bank dynamic styling based on cellSize (or isLargeGrid)
              let wordBankFontSize = "text-sm";
              let wordBankPadding = "px-3 py-1.5";
              if (cellSize < 16) {
                wordBankFontSize = "text-[10px]";
                wordBankPadding = "px-1.5 py-0.5";
              } else if (cellSize < 24) {
                wordBankFontSize = "text-xs";
                wordBankPadding = "px-2.5 py-1";
              }

              return (
                <span 
                  key={i} 
                  onMouseEnter={() => setHoveredWord(upperWord)}
                  onMouseLeave={() => setHoveredWord(null)}
                  className={`rounded-full font-semibold tracking-wide flex items-center gap-1.5 cursor-pointer transition-all duration-200 border ${wordBankFontSize} ${wordBankPadding} ${
                    unplaced 
                      ? isHovered
                        ? "bg-red-200 text-red-800 border-red-300 scale-105 shadow-md shadow-red-100"
                        : "bg-red-100 text-red-700 border-red-200" 
                      : isHovered
                        ? "bg-emerald-200 text-emerald-900 border-emerald-300 scale-105 shadow-md shadow-emerald-100"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
                  style={{
                    opacity: isAnyHovered && !isHovered ? 0.4 : 1,
                  }}
                >
                  {unplaced && <AlertCircle size={cellSize < 16 ? 10 : 14} />}
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
