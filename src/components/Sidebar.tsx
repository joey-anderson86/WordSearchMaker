import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore, PuzzlePayload, WordSearchData } from "../store";
import { 
  Settings, 
  FileText, 
  Grid3x3, 
  Type, 
  Printer, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  BookOpen 
} from "lucide-react";

const defaultThemes = [
  { name: "Programming", words: "RUST\nTAURI\nREACT\nTYPESCRIPT\nZUSTAND" },
  { name: "Animals", words: "LION\nTIGER\nBEAR\nELEPHANT\nGIRAFFE\nMONKEY\nZEBRA\nDOLPHIN" },
  { name: "Space", words: "PLANET\nGALAXY\nASTEROID\nCOMET\nNEBULA\nSTAR\nMETEOR\nORBIT" },
  { name: "Fruits", words: "APPLE\nBANANA\nCHERRY\nORANGE\nGRAPE\nLEMON\nPEACH\nMELON" },
  { name: "Weather", words: "SUNNY\nRAINY\nCLOUDY\nWINDY\nSTORMY\nSNOWY\nFOGGY\nHUMID" },
  { name: "Colors", words: "RED\nBLUE\nGREEN\nYELLOW\nORANGE\nPURPLE\nPINK\nBROWN" }
];

export function Sidebar() {
  const puzzles = useStore((state) => state.puzzles);
  const selectedPuzzleId = useStore((state) => state.selectedPuzzleId);
  const pageSize = useStore((state) => state.pageSize);
  const bookTitle = useStore((state) => state.bookTitle);
  const includeSolutions = useStore((state) => state.includeSolutions);

  const setBookTitle = useStore((state) => state.setBookTitle);
  const setPageSize = useStore((state) => state.setPageSize);
  const setIncludeSolutions = useStore((state) => state.setIncludeSolutions);
  const setSelectedPuzzleId = useStore((state) => state.setSelectedPuzzleId);
  const addPuzzle = useStore((state) => state.addPuzzle);
  const updatePuzzle = useStore((state) => state.updatePuzzle);
  const deletePuzzle = useStore((state) => state.deletePuzzle);
  const reorderPuzzles = useStore((state) => state.reorderPuzzles);

  const [editTitle, setEditTitle] = useState("");
  const [editWidth, setEditWidth] = useState(15);
  const [editHeight, setEditHeight] = useState(15);
  const [editWords, setEditWords] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedPuzzle = puzzles.find((p) => p.id === selectedPuzzleId);

  // Synchronize local editor state when the selected puzzle changes
  useEffect(() => {
    if (selectedPuzzle) {
      setEditTitle(selectedPuzzle.title);
      setEditWidth(selectedPuzzle.grid[0]?.length || 15);
      setEditHeight(selectedPuzzle.grid.length || 15);
      setEditWords(selectedPuzzle.specific_data.word_bank.join("\n"));
    }
  }, [selectedPuzzleId, selectedPuzzle?.id]);

  // Auto-generate a default puzzle on mount if puzzles list is empty
  useEffect(() => {
    if (puzzles.length === 0) {
      handleAddPuzzle();
    }
  }, [puzzles.length]);

  const handleAddPuzzle = async () => {
    setIsGenerating(true);
    try {
      const themeIndex = puzzles.length % defaultThemes.length;
      const theme = defaultThemes[themeIndex];
      const wordList = theme.words
        .split("\n")
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      const result: PuzzlePayload<WordSearchData> = await invoke("generate_puzzle", {
        width: 15,
        height: 15,
        words: wordList,
      });

      result.title = `Puzzle ${puzzles.length + 1}: ${theme.name}`;
      addPuzzle(result);
    } catch (e) {
      console.error("Failed to generate default puzzle", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setEditTitle(val);
    if (selectedPuzzle) {
      updatePuzzle(selectedPuzzle.id, {
        ...selectedPuzzle,
        title: val,
      });
    }
  };

  const handleRegenerate = async () => {
    if (!selectedPuzzle) return;
    setIsGenerating(true);
    try {
      const wordList = editWords
        .split("\n")
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      const result: PuzzlePayload<WordSearchData> = await invoke("generate_puzzle", {
        width: editWidth,
        height: editHeight,
        words: wordList,
      });

      // Retain the current ID and modified title
      result.id = selectedPuzzle.id;
      result.title = editTitle;

      updatePuzzle(selectedPuzzle.id, result);
    } catch (e) {
      console.error("Failed to regenerate puzzle", e);
      alert("Failed to regenerate puzzle. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-80 bg-slate-900 text-slate-100 flex flex-col h-screen overflow-hidden shadow-xl z-10 border-r border-slate-800">
      {/* Book Configuration Section */}
      <div className="p-5 pb-4 border-b border-slate-800 flex flex-col gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen className="text-emerald-400" size={24} />
          <h2 className="text-lg font-bold tracking-wide">Book Settings</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Type size={14} /> Book Title
            </label>
            <input
              type="text"
              className="bg-slate-855 border border-slate-700/80 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Printer size={14} /> Page Size
            </label>
            <select
              className="bg-slate-855 border border-slate-700/80 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer text-slate-100"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
            >
              <option value="A4">A4 (210 x 297 mm)</option>
              <option value="Letter">US Letter (8.5 x 11 in)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id="include-solutions"
              checked={includeSolutions}
              onChange={(e) => setIncludeSolutions(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-800 border-slate-700 accent-emerald-500 cursor-pointer"
            />
            <label htmlFor="include-solutions" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
              Include Solutions Section at End
            </label>
          </div>
        </div>
      </div>

      {/* Book Pages Directory (Scrollable) */}
      <div className="flex-1 p-5 pt-3 overflow-y-auto flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Puzzles List ({puzzles.length})</span>
          <button
            onClick={handleAddPuzzle}
            disabled={isGenerating}
            className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-400 hover:text-emerald-300 text-xs font-semibold py-1 px-2.5 rounded border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus size={14} /> Add Page
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {puzzles.map((p, idx) => {
            const isSelected = p.id === selectedPuzzleId;
            const cols = p.grid[0]?.length || 0;
            const rows = p.grid.length || 0;
            const wordCount = p.specific_data.word_bank.length;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPuzzleId(p.id)}
                className={`group flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-slate-800/80 border-emerald-500 shadow-md shadow-slate-950/20"
                    : "bg-slate-850 border-slate-800 hover:bg-slate-800/40 hover:border-slate-750"
                }`}
              >
                <div className="flex flex-col gap-1 overflow-hidden pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 flex-shrink-0">#{idx + 1}</span>
                    <span className="text-xs font-bold truncate text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {p.title || `Puzzle ${idx + 1}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>{wordCount} words</span>
                    <span>•</span>
                    <span>{cols}x{rows}</span>
                  </div>
                </div>

                {/* Reorder and Delete Actions */}
                <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderPuzzles(idx, idx - 1);
                    }}
                    disabled={idx === 0}
                    className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderPuzzles(idx, idx + 1);
                    }}
                    disabled={idx === puzzles.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (puzzles.length > 1) {
                        deletePuzzle(p.id);
                      } else {
                        alert("You must have at least one puzzle in the book.");
                      }
                    }}
                    className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Puzzle Editor Panel (Fixed at Bottom) */}
      <div className="p-5 border-t border-slate-800 bg-slate-950/20 flex flex-col gap-3 flex-shrink-0 overflow-y-auto max-h-[45%]">
        {selectedPuzzle ? (
          <>
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
              <Settings className="text-emerald-400" size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Edit Page #{puzzles.findIndex((p) => p.id === selectedPuzzle.id) + 1}
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400">Title</label>
                <input
                  type="text"
                  className="bg-slate-800 border border-slate-750 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-100"
                  value={editTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="text-[10px] font-semibold text-slate-400 flex justify-between">
                    <span>Width</span>
                    <span className="font-bold text-emerald-400">{editWidth}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    className="accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                    value={editWidth}
                    onChange={(e) => setEditWidth(parseInt(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="text-[10px] font-semibold text-slate-400 flex justify-between">
                    <span>Height</span>
                    <span className="font-bold text-emerald-400">{editHeight}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    className="accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                    value={editHeight}
                    onChange={(e) => setEditHeight(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <FileText size={10} /> Word List (one per line)
                </label>
                <textarea
                  className="bg-slate-800 border border-slate-750 rounded p-2 text-[11px] h-24 focus:ring-1 focus:ring-emerald-500 outline-none resize-none font-mono text-slate-100 leading-normal"
                  value={editWords}
                  onChange={(e) => setEditWords(e.target.value)}
                ></textarea>
              </div>

              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold py-2 px-3 rounded shadow-md transition-all flex justify-center items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                {isGenerating ? "Generating..." : "Regenerate Grid"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-2 bg-slate-900/30 rounded border border-slate-850 p-4">
            <Grid3x3 size={24} className="opacity-20" />
            <p>Select a page from the list to edit its parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
