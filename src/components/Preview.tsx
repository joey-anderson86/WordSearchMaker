import { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { save } from "@tauri-apps/plugin-dialog";
import { Download, AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { writeFile } from "@tauri-apps/plugin-fs";
import { PdfDocument } from "./PdfDocument";

export function Preview() {
  const puzzles = useStore((state) => state.puzzles);
  const selectedPuzzleId = useStore((state) => state.selectedPuzzleId);
  const setSelectedPuzzleId = useStore((state) => state.setSelectedPuzzleId);
  const pageSize = useStore((state) => state.pageSize);
  const bookTitle = useStore((state) => state.bookTitle);
  const includeSolutions = useStore((state) => state.includeSolutions);

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

  const activePuzzle = puzzles.find((p) => p.id === selectedPuzzleId) || puzzles[puzzles.length - 1];
  const activeIndex = puzzles.findIndex((p) => p.id === activePuzzle?.id);

  const handlePrevPage = () => {
    if (activeIndex > 0) {
      setSelectedPuzzleId(puzzles[activeIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (activeIndex < puzzles.length - 1) {
      setSelectedPuzzleId(puzzles[activeIndex + 1].id);
    }
  };

  const handleExportPagePDF = async () => {
    if (!activePuzzle) return;
    try {
      const filePath = await save({
        filters: [{
          name: 'PDF Document',
          extensions: ['pdf']
        }],
        defaultPath: `${activePuzzle.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      });
      
      if (!filePath) return; // User canceled
      
      const blob = await pdf(
        <PdfDocument
          puzzles={[activePuzzle]}
          pageSize={pageSize}
          includeSolutions={false}
          isSinglePage={true}
        />
      ).toBlob();
      
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await writeFile(filePath, uint8Array);
      
      alert(`Successfully saved page to ${filePath}`);
    } catch (e) {
      console.error("Export page failed", e);
      alert("Failed to export PDF page. Check console for details.");
    }
  };

  const handleExportBookPDF = async () => {
    if (puzzles.length === 0) return;
    try {
      const filePath = await save({
        filters: [{
          name: 'PDF Document',
          extensions: ['pdf']
        }],
        defaultPath: `${bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      });
      
      if (!filePath) return; // User canceled
      
      const blob = await pdf(
        <PdfDocument
          puzzles={puzzles}
          pageSize={pageSize}
          includeSolutions={includeSolutions}
          isSinglePage={false}
        />
      ).toBlob();
      
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await writeFile(filePath, uint8Array);
      
      alert(`Successfully saved book to ${filePath}`);
    } catch (e) {
      console.error("Export book failed", e);
      alert("Failed to export book PDF. Check console for details.");
    }
  };

  const isSudoku = activePuzzle.puzzle_type === "Sudoku";
  const isCrossword = activePuzzle.puzzle_type === "Crossword";
  const cols = activePuzzle.grid[0]?.length || 0;
  const rows = activePuzzle.grid.length || 0;

  // Sizing calculations to fit the container
  const gap = isSudoku || isCrossword ? 0 : (cols > 20 || rows > 20 ? 2 : 4);
  const containerW = dimensions.width;
  const containerH = dimensions.height;

  const maxCellSizeW = (containerW - (cols - 1) * gap) / cols;
  const maxCellSizeH = (containerH - (rows - 1) * gap) / rows;
  const cellSize = isSudoku || isCrossword
    ? Math.min(48, Math.max(20, Math.min(maxCellSizeW, maxCellSizeH)))
    : Math.min(32, Math.max(10, Math.min(maxCellSizeW, maxCellSizeH)));
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
            {isSudoku ? "Sudoku • 9 x 9 Grid" : isCrossword ? `Crossword • ${cols} x ${rows} Grid` : `${cols} x ${rows} Grid`}
          </p>
        </div>

        {/* Page Selector Toolbar */}
        {puzzles.length > 1 && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm mb-0.5">
            <button
              onClick={handlePrevPage}
              disabled={activeIndex === 0}
              className="p-1 rounded hover:bg-slate-150 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer text-slate-700 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-bold text-slate-600 select-none">
              Page {activeIndex + 1} of {puzzles.length}
            </span>
            <button
              onClick={handleNextPage}
              disabled={activeIndex === puzzles.length - 1}
              className="p-1 rounded hover:bg-slate-150 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer text-slate-700 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        
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
            onClick={handleExportPagePDF}
            className="bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg shadow-md shadow-slate-100 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Download size={18} /> Export Page
          </button>

          <button
            onClick={handleExportBookPDF}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg shadow-md shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Download size={18} /> Export Book
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
                border: isSudoku || isCrossword ? "3px solid #334155" : "none"
              }}
            >
              {activePuzzle.grid.map((row, y) => (
                row.map((cell, x) => {
                  const startingVal = cell;
                  
                  let displayVal = cell;
                  let isSolutionValue = false;
                  let isBlackCell = isCrossword && cell === "#";
                  
                  if (isSudoku) {
                    const isStarting = startingVal !== null;
                    if (!isStarting && showSolutions) {
                      displayVal = activePuzzle.specific_data.solution?.[y]?.[x] ?? null;
                      isSolutionValue = true;
                    }
                  } else if (isCrossword) {
                    if (!isBlackCell && showSolutions) {
                      displayVal = activePuzzle.specific_data.solution?.[y]?.[x] ?? "";
                      isSolutionValue = true;
                    } else {
                      displayVal = "";
                    }
                  }

                  let cellBorders = "";
                  if (isSudoku) {
                    const topBorder = y % 3 === 0 ? "border-t-[3px] border-t-slate-700" : "border-t border-t-slate-200";
                    const leftBorder = x % 3 === 0 ? "border-l-[3px] border-l-slate-700" : "border-l border-l-slate-200";
                    const bottomBorder = y === 8 ? "border-b-[3px] border-b-slate-700" : "";
                    const rightBorder = x === 8 ? "border-r-[3px] border-r-slate-700" : "";
                    cellBorders = `${topBorder} ${leftBorder} ${bottomBorder} ${rightBorder}`;
                  } else if (isCrossword) {
                    cellBorders = "border border-slate-300";
                  }

                  // Find clue starting at y, x for crossword numbering
                  const crosswordClue = isCrossword
                    ? activePuzzle.specific_data.clues?.find((c: any) => c.row === y && c.col === x)
                    : null;

                  return (
                    <div 
                      key={`${x}-${y}`} 
                      className={`relative flex items-center justify-center cursor-default ${cellBorders} ${
                        isSudoku 
                          ? isSolutionValue 
                            ? "text-indigo-600 bg-indigo-50/40" 
                            : "text-slate-900 font-extrabold bg-white"
                          : isCrossword
                            ? isBlackCell
                              ? "bg-slate-800"
                              : isSolutionValue
                                ? "text-indigo-600 bg-indigo-50/20 font-extrabold"
                                : "bg-white"
                            : "rounded hover:bg-slate-100"
                      }`}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        fontSize: `${fontSize}px`,
                      }}
                    >
                      {isCrossword && crosswordClue && (
                        <span 
                          className="absolute top-0.5 left-0.5 text-slate-500 font-bold leading-none select-none"
                          style={{ fontSize: `${Math.max(6, fontSize * 0.45)}px` }}
                        >
                          {crosswordClue.number}
                        </span>
                      )}
                      {!isBlackCell ? (displayVal === null ? "" : displayVal) : ""}
                    </div>
                  );
                })
              ))}
            </div>

            {!isSudoku && !isCrossword && showSolutions && (
              <svg 
                className="absolute inset-0 pointer-events-none w-full h-full"
                style={{ overflow: "visible" }}
                viewBox={`0 0 ${gridWidth} ${gridHeight}`}
              >
                {activePuzzle.specific_data.solutions.map((sol: any, index: number) => {
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

        {/* Word Bank Container (Word Search) */}
        {activePuzzle.puzzle_type === "WordSearch" && (
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex-shrink-0 max-h-[30%] overflow-y-auto">
            <h3 className="font-bold text-slate-800 mb-3 text-base border-b pb-1.5 flex items-center justify-between">
              <span>Word Bank</span>
              <span className="text-xs text-slate-400 font-normal">
                {activePuzzle.specific_data.word_bank.length - activePuzzle.specific_data.unplaced_words.length} / {activePuzzle.specific_data.word_bank.length} Placed
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {activePuzzle.specific_data.word_bank.map((word: string, i: number) => {
                const unplaced = activePuzzle.specific_data.unplaced_words.includes(word);
                const upperWord = word.toUpperCase();
                const isHovered = hoveredWord === upperWord;
                const isAnyHovered = hoveredWord !== null;

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
        )}

        {/* Number Placement Helper (Sudoku) */}
        {activePuzzle.puzzle_type === "Sudoku" && (
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex-shrink-0">
            <h3 className="font-bold text-slate-800 mb-3 text-base border-b pb-1.5 flex items-center justify-between">
              <span>Sudoku Number Counter</span>
              <span className="text-xs text-slate-400 font-normal">
                Frequency of starting clues in the grid
              </span>
            </h3>
            <div className="flex flex-wrap gap-2 justify-around py-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                let count = 0;
                activePuzzle.grid.forEach(row => {
                  row.forEach(cell => {
                    if (cell === num) count++;
                  });
                });

                return (
                  <div 
                    key={num} 
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border min-w-[70px] transition-all ${
                      count === 9 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                        : "bg-slate-50 border-slate-150 text-slate-700"
                    }`}
                  >
                    <span className="text-base font-extrabold">{num}</span>
                    <span className="text-[10px] text-slate-400">
                      {count} / 9 clues
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Clues Panel (Crossword) */}
        {activePuzzle.puzzle_type === "Crossword" && (
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex-shrink-0 max-h-[35%] overflow-y-auto flex flex-col">
            <h3 className="font-bold text-slate-800 mb-3 text-base border-b pb-1.5 flex justify-between">
              <span>Crossword Clues</span>
              <span className="text-xs text-slate-400 font-normal">
                Theme: {activePuzzle.title.split(": ").slice(1).join("") || "General"}
              </span>
            </h3>
            {activePuzzle.specific_data.unplaced_words?.length > 0 && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-800">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> {activePuzzle.specific_data.unplaced_words.length} clue(s) could not fit in the grid: <strong>{activePuzzle.specific_data.unplaced_words.map((c: any) => c.word).join(", ")}</strong>. Try increasing grid dimensions.
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
              {/* Across Column */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-2 border-b pb-1">Across</h4>
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[120px] pr-2">
                  {activePuzzle.specific_data.clues
                    .filter((c: any) => c.direction === "across")
                    .map((c: any) => (
                      <div key={c.id} className="text-xs text-slate-700 leading-normal flex gap-1.5">
                        <span className="font-bold text-indigo-650 min-w-4">{c.number}.</span>
                        <span>{c.clue} <span className="text-[10px] text-slate-400 font-bold">({c.answer.length})</span></span>
                      </div>
                    ))}
                </div>
              </div>
              {/* Down Column */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-2 border-b pb-1">Down</h4>
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[120px] pr-2">
                  {activePuzzle.specific_data.clues
                    .filter((c: any) => c.direction === "down")
                    .map((c: any) => (
                      <div key={c.id} className="text-xs text-slate-700 leading-normal flex gap-1.5">
                        <span className="font-bold text-indigo-650 min-w-4">{c.number}.</span>
                        <span>{c.clue} <span className="text-[10px] text-slate-400 font-bold">({c.answer.length})</span></span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
