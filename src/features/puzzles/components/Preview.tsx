import { useState, useEffect, useRef } from "react";
import { useStore } from "../../../store";
import { save } from "@tauri-apps/plugin-dialog";
import { Download, AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { writeFile } from "@tauri-apps/plugin-fs";
import { PdfDocument } from "../../pdf/components/PdfDocument";
import { getPageDimensions } from "../../../types/pageSizes";

const fontStyleMap: Record<string, string> = {
  "Modern Sans": "'Montserrat', 'Inter', sans-serif",
  "Display Geometric": "'Oswald', sans-serif",
  "Developer Mono": "'JetBrains Mono', 'Fira Code', monospace"
};

const formatTitle = (title: string, themeAccents?: boolean) => {
  if (!themeAccents) return title;
  const match = title.match(/^(Puzzle \d+:\s*)(.*)$/);
  if (match) {
    const prefix = match[1];
    const rest = match[2];
    const tag = rest.replace(/[^a-zA-Z0-9]/g, "");
    return `${prefix}<${tag} />`;
  }
  return `<${title.replace(/[^a-zA-Z0-9]/g, "")} />`;
};

const isCellInSolution = (x: number, y: number, solutions: any[]) => {
  if (!solutions) return false;
  return solutions.some((sol) => {
    const dx = Math.sign(sol.end_x - sol.start_x);
    const dy = Math.sign(sol.end_y - sol.start_y);
    const len = Math.max(Math.abs(sol.end_x - sol.start_x), Math.abs(sol.end_y - sol.start_y)) + 1;
    for (let i = 0; i < len; i++) {
      if (sol.start_x + i * dx === x && sol.start_y + i * dy === y) {
        return true;
      }
    }
    return false;
  });
};

export function Preview() {
  const pages = useStore((state) => state.pages);
  const selectedPageId = useStore((state) => state.selectedPageId);
  const setSelectedPageId = useStore((state) => state.setSelectedPageId);
  const selectedElementId = useStore((state) => state.selectedElementId);
  const setSelectedElementId = useStore((state) => state.setSelectedElementId);
  
  const updatePageElementLayout = useStore((state) => state.updatePageElementLayout);
  const updateArtLayer = useStore((state) => state.updateArtLayer);
  const resetPageLayout = useStore((state) => state.resetPageLayout);
  
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

    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({
      width: Math.max(100, rect.width - 48),
      height: Math.max(100, rect.height - 48),
    });

    return () => observer.disconnect();
  }, [pages.length]);

  if (pages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8">
        <div className="w-24 h-24 mb-6 opacity-20 border-4 border-dashed rounded-xl flex items-center justify-center">
          <span className="text-4xl font-black">?</span>
        </div>
        <p className="text-xl font-medium">No pages generated yet.</p>
        <p className="text-sm mt-2 text-slate-500">Configure your settings in the sidebar and click Generate.</p>
      </div>
    );
  }

  const activePage = pages.find((p) => p.id === selectedPageId) || pages[pages.length - 1];
  const activeIndex = pages.findIndex((p) => p.id === activePage?.id);

  const handlePrevPage = () => {
    if (activeIndex > 0) {
      setSelectedPageId(pages[activeIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (activeIndex < pages.length - 1) {
      setSelectedPageId(pages[activeIndex + 1].id);
    }
  };

  const handleExportPagePDF = async () => {
    if (!activePage) return;
    try {
      const filePath = await save({
        filters: [{
          name: 'PDF Document',
          extensions: ['pdf']
        }],
        defaultPath: `${activePage.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      });
      
      if (!filePath) return;
      
      const blob = await pdf(
        <PdfDocument
          pages={[activePage]}
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
    if (pages.length === 0) return;
    try {
      const filePath = await save({
        filters: [{
          name: 'PDF Document',
          extensions: ['pdf']
        }],
        defaultPath: `${bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      });
      
      if (!filePath) return;
      
      const blob = await pdf(
        <PdfDocument
          pages={pages}
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

  const pageDims = getPageDimensions(pageSize);
  
  // New canvas physical dimensions including bleed
  const bleedSize = 9; // 0.125 inches in points
  const safeMargin = 27; // 0.375 inches in points from trim
  const canvasDims = {
    width: pageDims.width + (bleedSize * 2),
    height: pageDims.height + (bleedSize * 2)
  };

  const containerW = dimensions.width;
  const containerH = dimensions.height;
  const scale = Math.min(
    containerW / canvasDims.width,
    containerH / canvasDims.height
  );

  const activePuzzle = activePage.metadata;
  const isSudoku = activePuzzle.specificData.type === "Sudoku";
  const isCrossword = activePuzzle.specificData.type === "Crossword";
  const cols = activePuzzle.grid[0]?.length || 0;
  const rows = activePuzzle.grid.length || 0;

  // Mouse Drag Handler with Snapping
  const handleDragMouseDown = (
    e: React.MouseEvent,
    elementId: string,
    startX: number,
    startY: number,
    elementType: "grid" | "art"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElementId(elementId);

    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;

    const snapSize = activePage.gridSnapSize ?? 10;
    const margin = activePage.margin ?? { top: 40, bottom: 50, inside: 50, outside: 40 };
    
    const pageNum = activeIndex + 1;
    const isEven = pageNum % 2 === 0;
    
    // Backwards compatibility for old saved states
    const insideMargin = margin.inside ?? (margin as any).left ?? 50;
    const outsideMargin = margin.outside ?? (margin as any).right ?? 40;
    
    const leftMargin = isEven ? outsideMargin : insideMargin;
    const rightMargin = isEven ? insideMargin : outsideMargin;

    let elWidth = 0;
    let elHeight = 0;
    if (elementType === "grid") {
      const el = activePage.gridLayout.find(g => g.id === elementId);
      if (el) {
        elWidth = el.width;
        elHeight = el.height;
      }
    } else {
      const l = activePage.artLayers.find(art => art.id === elementId);
      if (l) {
        elWidth = l.width;
        elHeight = l.height;
      }
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - initialMouseX) / scale;
      const deltaY = (moveEvent.clientY - initialMouseY) / scale;

      let newX = startX + deltaX;
      let newY = startY + deltaY;

      // Snapping to margins (6pt tolerance)
      const tolerance = 6;
      
      // Horizontal Snaps
      if (Math.abs(newX - leftMargin) < tolerance) {
        newX = leftMargin;
      } else if (Math.abs((newX + elWidth) - (pageDims.width - rightMargin)) < tolerance) {
        newX = pageDims.width - rightMargin - elWidth;
      } else if (snapSize > 0) {
        newX = Math.round(newX / snapSize) * snapSize;
      }

      // Vertical Snaps
      if (Math.abs(newY - margin.top) < tolerance) {
        newY = margin.top;
      } else if (Math.abs((newY + elHeight) - (pageDims.height - margin.bottom)) < tolerance) {
        newY = pageDims.height - margin.bottom - elHeight;
      } else if (snapSize > 0) {
        newY = Math.round(newY / snapSize) * snapSize;
      }

      newX = Math.round(Math.max(0, newX) * 10) / 10;
      newY = Math.round(Math.max(0, newY) * 10) / 10;

      if (elementType === "grid") {
        updatePageElementLayout(activePage.id, elementId, { x: newX, y: newY });
      } else {
        updateArtLayer(activePage.id, elementId, { x: newX, y: newY });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Mouse Resize Handler with Snapping
  const handleResizeMouseDown = (
    e: React.MouseEvent,
    elementId: string,
    startW: number,
    startH: number,
    elementType: "grid" | "art"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const snapSize = activePage.gridSnapSize ?? 10;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - initialMouseX) / scale;
      const deltaY = (moveEvent.clientY - initialMouseY) / scale;

      let newW = startW + deltaX;
      let newH = startH + deltaY;

      if (snapSize > 0) {
        newW = Math.round(newW / snapSize) * snapSize;
        newH = Math.round(newH / snapSize) * snapSize;
      }

      newW = Math.round(Math.max(20, newW) * 10) / 10;
      newH = Math.round(Math.max(20, newH) * 10) / 10;

      if (elementType === "grid") {
        updatePageElementLayout(activePage.id, elementId, { width: newW, height: newH });
      } else {
        updateArtLayer(activePage.id, elementId, { width: newW, height: newH });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const renderElementContent = (el: any) => {
    if (el.type === "title") {
      const titleFontFamily = fontStyleMap[el.content.fontFamily || activePuzzle.titleFont || "Modern Sans"];
      return (
        <div 
          className="w-full h-full flex flex-col justify-center select-none"
          style={{
            color: el.content.color || "#0f172a",
            textAlign: el.content.align || "left",
            fontFamily: titleFontFamily,
            letterSpacing: `${el.content.letterSpacing || 0}px`,
            lineHeight: 1.1,
          }}
        >
          <h1 className="font-bold leading-none select-none" style={{ fontSize: `${el.content.fontSize || 28}px` }}>
            {showSolutions 
              ? `Solution: ${formatTitle(el.content.text, el.content.themeAccents)}` 
              : formatTitle(el.content.text, el.content.themeAccents)
            }
          </h1>
          {(isSudoku || isCrossword) && (
            <p className="text-slate-500 mt-1 select-none" style={{ fontSize: `${Math.max(10, (el.content.fontSize || 28) * 0.45)}px` }}>
              {isSudoku ? "Sudoku • " + (activePuzzle.specificData.data as any).difficulty?.toUpperCase() : `Crossword • ${(activePuzzle.specificData.data as any).difficulty?.toUpperCase()}`}
            </p>
          )}
        </div>
      );
    }

    if (el.type === "grid") {
      const gridFont = el.content.gridFont || activePuzzle.gridFont || "Modern Sans";
      const cellBordersSetting = el.content.cellBorders ?? false;
      const ideThemeSetting = el.content.ideTheme ?? false;
      const letterTrackingSetting = el.content.letterTracking ?? 0;
      const solutionStyleSetting = el.content.solutionStyle || "Greyscale Mute";
      
      const gridFontFamily = fontStyleMap[gridFont];
      
      const paddingOffset = ideThemeSetting ? 32 : 0;
      const gapOffset = isSudoku || isCrossword ? 0 : (cols > 20 || rows > 20 ? 2 : 4);
      
      const availableW = el.width - paddingOffset;
      const availableH = el.height - (ideThemeSetting ? 56 : 0);
      
      const maxCellSizeW = (availableW - (cols - 1) * gapOffset) / cols;
      const maxCellSizeH = (availableH - (rows - 1) * gapOffset) / rows;
      
      const cellSize = Math.max(10, Math.min(maxCellSizeW, maxCellSizeH));
      const fontSize = cellSize * 0.55;
      
      const step = cellSize + gapOffset;
      const gridWidth = cols * step - gapOffset;
      const gridHeight = rows * step - gapOffset;

      return (
        <div 
          className={`w-full h-full flex items-center justify-center ${ideThemeSetting ? "border-2 border-slate-700 bg-slate-900 rounded-xl p-4 pt-10 shadow-2xl" : ""}`}
          style={{ position: 'relative' }}
        >
          {ideThemeSetting && (
            <div className="absolute top-3.5 left-4 flex gap-1.5 pointer-events-none select-none">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600"></div>
            </div>
          )}
          <div 
            className="grid select-none"
            style={{ 
              fontFamily: gridFontFamily,
              gridTemplateColumns: `repeat(${cols || 1}, minmax(0, 1fr))`,
              gap: `${gapOffset}px`,
              width: `${gridWidth}px`,
              height: `${gridHeight}px`,
              border: isSudoku || isCrossword ? "3px solid #334155" : "none",
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
                    displayVal = (activePuzzle.specificData.data as any).solution?.[y]?.[x] ?? null;
                    isSolutionValue = true;
                  }
                } else if (isCrossword) {
                  if (!isBlackCell && showSolutions) {
                    displayVal = (activePuzzle.specificData.data as any).solution?.[y]?.[x] ?? "";
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
                } else {
                  cellBorders = cellBordersSetting
                    ? (ideThemeSetting ? "border border-slate-750" : "border border-slate-200")
                    : "";
                }

                const crosswordClue = isCrossword
                  ? (activePuzzle.specificData.data as any).clues?.find((c: any) => c.row === y && c.col === x)
                  : null;

                let charClass = "text-slate-700 font-bold font-semibold";
                if (!isSudoku && !isCrossword) {
                  if (showSolutions) {
                    const inSol = isCellInSolution(x, y, (activePuzzle.specificData.data as any).solutions);
                    if (solutionStyleSetting === "Greyscale Mute") {
                      if (inSol) {
                        charClass = ideThemeSetting
                          ? "text-emerald-400 font-black"
                          : "text-indigo-650 font-black bg-indigo-50/40 rounded";
                      } else {
                        charClass = ideThemeSetting
                          ? "text-slate-600 opacity-30"
                          : "text-slate-350 opacity-35";
                      }
                    } else {
                      charClass = ideThemeSetting ? "text-slate-100 font-bold" : "text-slate-700 font-bold";
                    }
                  } else {
                    charClass = ideThemeSetting ? "text-slate-100 font-bold" : "text-slate-700 font-bold";
                  }
                }

                return (
                  <div 
                    key={`${x}-${y}`} 
                    className={`relative flex items-center justify-center cursor-default ${cellBorders} ${charClass} ${
                      isSudoku 
                        ? isSolutionValue 
                          ? "text-indigo-650 bg-indigo-50/40" 
                          : "text-slate-900 font-extrabold bg-white"
                        : isCrossword
                          ? isBlackCell
                            ? "bg-slate-800"
                            : isSolutionValue
                              ? "text-indigo-650 bg-indigo-50/20 font-extrabold"
                              : "bg-white"
                          : "rounded hover:bg-slate-100"
                    }`}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      fontSize: `${fontSize}px`,
                      letterSpacing: `${letterTrackingSetting}px`,
                      textIndent: `${letterTrackingSetting}px`
                    }}
                  >
                    {isCrossword && crosswordClue && (
                      <span 
                        className="absolute top-0.5 left-0.5 text-slate-500 font-bold leading-none select-none pointer-events-none"
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

          {/* Solutions Circle SVG Overlay */}
          {!isSudoku && !isCrossword && showSolutions && (
            <svg 
              className="absolute pointer-events-none"
              style={{ 
                overflow: "visible",
                left: ideThemeSetting ? "16px" : "0px",
                top: ideThemeSetting ? "40px" : "0px",
                width: `${gridWidth}px`,
                height: `${gridHeight}px`,
                zIndex: 50,
              }}
              viewBox={`0 0 ${gridWidth} ${gridHeight}`}
            >
              {(activePuzzle.specificData.data as any).solutions.map((sol: any, index: number) => {
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
                    {(solutionStyleSetting === "Pill Outlines" || isHovered) && (
                      <rect
                        x={x1 - hRadius}
                        y={y1 - hRadius}
                        width={L + hHeight}
                        height={hHeight}
                        rx={hRadius}
                        ry={hRadius}
                        transform={`rotate(${angle}, ${x1}, ${y1})`}
                        stroke={isHovered ? "#ef4444" : "#f43f5e"}
                        strokeWidth={isHovered ? cellSize * 0.11 : cellSize * 0.08}
                        fill="none"
                        className="transition-all duration-200 ease-in-out"
                        style={{
                          opacity: isAnyHovered && !isHovered ? 0.35 : 1,
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      );
    }

    if (el.type === "wordbank") {
      const isWordSearch = activePuzzle.specificData.type === "WordSearch";
      const isSudoku = activePuzzle.specificData.type === "Sudoku";
      const isCrossword = activePuzzle.specificData.type === "Crossword";
      
      const columns = el.content.columns || 3;
      const selectorStyle = el.content.selectorStyle || "Clean Text (No Bullets)";
      const font = el.content.fontFamily || "Modern Sans";
      const fontSize = el.content.fontSize || 12;
      const color = el.content.color || "#334155";
      
      const textFontFamily = fontStyleMap[font];

      if (isWordSearch) {
        return (
          <div className="w-full h-full bg-slate-50/50 p-4 rounded border border-slate-200 flex flex-col text-left overflow-hidden" style={{ fontFamily: textFontFamily, color }}>
            <h3 className="font-bold text-slate-800 mb-2 border-b pb-1 flex justify-between" style={{ fontSize: `${fontSize + 2}px` }}>
              <span>Word Bank</span>
            </h3>
            <div 
              className="grid gap-x-4 gap-y-1.5 flex-1 overflow-y-auto"
              style={{ 
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                fontSize: `${fontSize}px`
              }}
            >
              {(activePuzzle.specificData.data as any).word_bank.map((word: string, i: number) => {
                const unplaced = (activePuzzle.specificData.data as any).unplaced_words.includes(word);
                const upperWord = word.toUpperCase();
                const isHovered = hoveredWord === upperWord;
                const isAnyHovered = hoveredWord !== null;

                let prefixStr = "";
                if (selectorStyle === "Classic Bullet Points") {
                  prefixStr = "• ";
                } else if (selectorStyle === "Checkbox [ ] Style") {
                  prefixStr = "[ ] ";
                }

                return (
                  <span 
                    key={i} 
                    onMouseEnter={() => setHoveredWord(upperWord)}
                    onMouseLeave={() => setHoveredWord(null)}
                    className={`font-semibold tracking-wide flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${
                      unplaced 
                        ? isHovered ? "text-rose-600 scale-105" : "text-rose-500" 
                        : isHovered ? "text-emerald-700 scale-105" : "text-slate-700"
                    }`}
                    style={{
                      opacity: isAnyHovered && !isHovered ? 0.4 : 1,
                    }}
                  >
                    {unplaced && <AlertCircle size={fontSize} />}
                    {prefixStr}{word}
                  </span>
                );
              })}
            </div>
          </div>
        );
      }

      if (isSudoku) {
        return (
          <div className="w-full h-full bg-slate-50/50 p-3 rounded border border-slate-200 flex flex-col overflow-hidden" style={{ fontFamily: textFontFamily, color }}>
            <h3 className="font-bold text-slate-800 mb-2 border-b pb-1 flex justify-between" style={{ fontSize: `${fontSize + 2}px` }}>
              <span>Sudoku Number Counter</span>
              <span className="text-[10px] text-slate-400 font-normal">Clues frequency</span>
            </h3>
            <div className="flex flex-wrap gap-1.5 justify-around flex-1 overflow-y-auto">
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
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border min-w-[55px] ${
                      count === 9 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                        : "bg-slate-50 border-slate-150 text-slate-700"
                    }`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    <span className="font-extrabold">{num}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      if (isCrossword) {
        const acrossClues = (activePuzzle.specificData.data as any).clues.filter((c: any) => c.direction === "across");
        const downClues = (activePuzzle.specificData.data as any).clues.filter((c: any) => c.direction === "down");
        
        return (
          <div className="w-full h-full bg-slate-50/50 p-3 rounded border border-slate-200 flex flex-col overflow-hidden" style={{ fontFamily: textFontFamily, color }}>
            <h3 className="font-bold text-slate-800 mb-2 border-b pb-1.5 flex justify-between" style={{ fontSize: `${fontSize + 2}px` }}>
              <span>Crossword Clues</span>
            </h3>
            {(activePuzzle.specificData.data as any).unplaced_words?.length > 0 && (
              <div className="mb-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 leading-tight">
                Warning: {(activePuzzle.specificData.data as any).unplaced_words.length} clue(s) could not fit in the grid.
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
              <div className="flex flex-col overflow-hidden">
                <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 mb-1 border-b pb-0.5">Across</h4>
                <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1" style={{ fontSize: `${fontSize}px` }}>
                  {acrossClues.map((c: any) => (
                    <div key={c.id} className="text-slate-700 leading-normal flex gap-1">
                      <span className="font-bold text-indigo-650 min-w-4">{c.number}.</span>
                      <span>{c.clue} <span className="text-[8px] text-slate-400 font-bold">({c.answer.length})</span></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col overflow-hidden">
                <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 mb-1 border-b pb-0.5">Down</h4>
                <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1" style={{ fontSize: `${fontSize}px` }}>
                  {downClues.map((c: any) => (
                    <div key={c.id} className="text-slate-700 leading-normal flex gap-1">
                      <span className="font-bold text-indigo-650 min-w-4">{c.number}.</span>
                      <span>{c.clue} <span className="text-[8px] text-slate-400 font-bold">({c.answer.length})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header Panel */}
      <div className="p-6 pb-2 max-w-7xl mx-auto w-full flex justify-between items-end flex-shrink-0">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-800">Page Preview</h2>
        </div>

        {/* Page Selector Toolbar */}
        {pages.length > 1 && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm mb-0.5">
            <button
              onClick={handlePrevPage}
              disabled={activeIndex === 0}
              className="p-1 rounded hover:bg-slate-150 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer text-slate-700 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-bold text-slate-600 select-none">
              Page {activeIndex + 1} of {pages.length}
            </span>
            <button
              onClick={handleNextPage}
              disabled={activeIndex === pages.length - 1}
              className="p-1 rounded hover:bg-slate-150 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer text-slate-700 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => resetPageLayout(activePage.id, pageSize)}
            title="Reset active page layout to defaults"
            className="bg-white border border-slate-200 text-slate-755 hover:bg-slate-50 font-semibold py-2 px-3 rounded-lg shadow-md shadow-slate-100 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer text-xs"
          >
            <RefreshCw size={14} /> Reset Layout
          </button>

          <button
            onClick={() => setShowSolutions(!showSolutions)}
            className={`font-semibold py-2 px-4 rounded-lg shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer border text-xs ${
              showSolutions
                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-rose-100"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-slate-100"
            }`}
          >
            {showSolutions ? <EyeOff size={16} /> : <Eye size={16} />}
            {showSolutions ? "Hide Solutions" : "Show Solutions"}
          </button>

          <button
            onClick={handleExportPagePDF}
            className="bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg shadow-md shadow-slate-100 transition-all flex items-center gap-2 active:scale-95 cursor-pointer text-xs"
          >
            <Download size={16} /> Export Page
          </button>

          <button
            onClick={handleExportBookPDF}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg shadow-md shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95 cursor-pointer text-xs"
          >
            <Download size={16} /> Export Book
          </button>
        </div>
      </div>

      {/* Main Canvas Editor Area */}
      <div 
        className="flex-1 min-h-0 p-6 pt-2 pb-6 flex items-center justify-center max-w-7xl mx-auto w-full overflow-hidden" 
        ref={containerRef}
        onClick={() => setSelectedElementId(null)}
      >
        <div 
          className="shadow-2xl relative flex-shrink-0 border border-slate-350 overflow-hidden"
          style={{
            width: `${canvasDims.width}px`,
            height: `${canvasDims.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            backgroundColor: activePage.backgroundColor || "#ffffff"
          }}
        >
          {/* New Trim & Safe Guides */}
          {activePage.showMargins && (() => {
            const margin = activePage.margin ?? { top: 40, bottom: 50, inside: 50, outside: 40 };
            const pageNum = activeIndex + 1;
            const isEven = pageNum % 2 === 0;
            
            // Backwards compatibility for old saved states
            const insideMargin = margin.inside ?? (margin as any).left ?? 50;
            const outsideMargin = margin.outside ?? (margin as any).right ?? 40;
            
            const leftMargin = isEven ? outsideMargin : insideMargin;
            const rightMargin = isEven ? insideMargin : outsideMargin;

            return (
              <>
                {/* Bleed area is simply the canvas itself, Trim Guide inside it */}
                <div 
                  className="absolute border border-slate-400/80 pointer-events-none"
                  style={{
                    left: `${bleedSize}px`,
                    top: `${bleedSize}px`,
                    width: `${pageDims.width}px`,
                    height: `${pageDims.height}px`,
                    zIndex: 0
                  }}
                />
                {/* Safe Guide */}
                <div 
                  className="absolute border border-blue-400/60 border-dashed pointer-events-none"
                  style={{
                    left: `${bleedSize + safeMargin}px`,
                    top: `${bleedSize + safeMargin}px`,
                    width: `${pageDims.width - (safeMargin * 2)}px`,
                    height: `${pageDims.height - (safeMargin * 2)}px`,
                    zIndex: 0
                  }}
                />
                {/* Visual Margin Guides (Dashed Box) */}
                <div 
                  className="absolute border border-dashed border-red-400/50 pointer-events-none rounded"
                  style={{
                    left: `${leftMargin + bleedSize}px`,
                    top: `${margin.top + bleedSize}px`,
                    width: `${pageDims.width - leftMargin - rightMargin}px`,
                    height: `${pageDims.height - margin.top - margin.bottom}px`,
                    zIndex: 0
                  }}
                />
              </>
            );
          })()}

          {/* 1. Render Art Layers */}
          {activePage.artLayers.map((layer) => {
            const isSelected = selectedElementId === layer.id;
            return (
              <div
                key={layer.id}
                className={`absolute group cursor-move ${isSelected ? "ring-2 ring-emerald-500 ring-offset-1" : "hover:ring-1 hover:ring-slate-300"}`}
                style={{
                  left: `${layer.x + bleedSize}px`,
                  top: `${layer.y + bleedSize}px`,
                  width: `${layer.width}px`,
                  height: `${layer.height}px`,
                  zIndex: layer.zIndex ?? 1,
                  opacity: layer.opacity ?? 1,
                }}
                onMouseDown={(e) => handleDragMouseDown(e, layer.id, layer.x, layer.y, "art")}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(layer.id);
                }}
              >
                <img
                  src={layer.url}
                  alt="Art Layer"
                  className="w-full h-full object-contain pointer-events-none"
                />
                
                {/* Resize Handle */}
                {isSelected && (
                  <div
                    className="absolute right-[-4px] bottom-[-4px] w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow cursor-se-resize z-50 hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id, layer.width, layer.height, "art")}
                  />
                )}
              </div>
            );
          })}

          {/* 2. Render Layout Elements */}
          {activePage.gridLayout.map((el) => {
            const isSelected = selectedElementId === el.id;
            return (
              <div
                key={el.id}
                className={`absolute group cursor-move ${isSelected ? "ring-2 ring-emerald-500 ring-offset-1" : "hover:ring-1 hover:ring-slate-355"}`}
                style={{
                  left: `${el.x + bleedSize}px`,
                  top: `${el.y + bleedSize}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  zIndex: el.zIndex ?? 10,
                }}
                onMouseDown={(e) => handleDragMouseDown(e, el.id, el.x, el.y, "grid")}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(el.id);
                }}
              >
                {renderElementContent(el)}

                {/* Resize Handle */}
                {isSelected && (
                  <div
                    className="absolute right-[-4px] bottom-[-4px] w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow cursor-se-resize z-50 hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, el.id, el.width, el.height, "grid")}
                  />
                )}
              </div>
            );
          })}

          {/* Page Footer */}
          <div 
            className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-slate-400 border-t border-slate-100 pt-1.5 mx-10 pointer-events-none"
            style={{ zIndex: 100 }}
          >
            Page {activeIndex + 1}
          </div>
        </div>
      </div>
    </div>
  );
}
