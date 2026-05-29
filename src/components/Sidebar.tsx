import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore, PuzzlePayload, WordSearchData, SudokuData, CrosswordData, PuzzlePayloadType } from "../store";
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
  BookOpen,
  Upload,
  Download,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { importBookFromJson, ImportValidationError } from "../utils/importJson";
import { downloadTemplate } from "../utils/templateGenerator";

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
  const clearPuzzles = useStore((state) => state.clearPuzzles);

  const [selectedTypeToCreate, setSelectedTypeToCreate] = useState<PuzzlePayloadType>("WordSearch");
  const [editTitle, setEditTitle] = useState("");
  const [editWidth, setEditWidth] = useState(15);
  const [editHeight, setEditHeight] = useState(15);
  const [editWords, setEditWords] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // States for adding new custom crossword clues
  const [newCwWord, setNewCwWord] = useState("");
  const [newCwClue, setNewCwClue] = useState("");

  const selectedPuzzle = puzzles.find((p) => p.id === selectedPuzzleId);

  // Synchronize local editor state when the selected puzzle changes
  useEffect(() => {
    if (selectedPuzzle) {
      setEditTitle(selectedPuzzle.title);
      setEditWidth(selectedPuzzle.grid[0]?.length || 15);
      setEditHeight(selectedPuzzle.grid.length || 15);
      if (selectedPuzzle.puzzle_type === "WordSearch") {
        setEditWords(selectedPuzzle.specific_data.word_bank.join("\n"));
      } else {
        setEditWords("");
      }
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
      if (selectedTypeToCreate === "Sudoku") {
        const { generateSudoku } = await import("../puzzles/sudokuGenerator");
        const { grid, solution } = generateSudoku("easy");

        const newPuzzle: PuzzlePayload<SudokuData> = {
          id: `sudoku-${Date.now()}`,
          puzzle_type: "Sudoku",
          title: `Puzzle ${puzzles.length + 1}: Sudoku (Easy)`,
          grid: grid,
          specific_data: {
            difficulty: "easy",
            solution: solution
          }
        };
        addPuzzle(newPuzzle);
      } else if (selectedTypeToCreate === "Crossword") {
        const { layoutCrossword, DEFAULT_CROSSWORD_INPUTS } = await import("../puzzles/crosswordGenerator");
        const { grid, solution, clues, unplaced } = layoutCrossword(DEFAULT_CROSSWORD_INPUTS, 11, 11);

        const newPuzzle: PuzzlePayload<CrosswordData> = {
          id: `crossword-${Date.now()}`,
          puzzle_type: "Crossword",
          title: `Puzzle ${puzzles.length + 1}: Crossword Grid`,
          grid: grid,
          specific_data: {
            difficulty: "easy",
            solution: solution,
            clues: clues,
            word_bank: DEFAULT_CROSSWORD_INPUTS.map(c => ({ ...c })),
            unplaced_words: unplaced
          }
        };
        addPuzzle(newPuzzle);
      } else {
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
      }
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

  const handleSudokuDifficultyChange = async (difficulty: "easy" | "medium" | "hard" | "expert") => {
    if (!selectedPuzzle || selectedPuzzle.puzzle_type !== "Sudoku") return;
    setIsGenerating(true);
    try {
      const { generateSudoku } = await import("../puzzles/sudokuGenerator");
      const { grid, solution } = generateSudoku(difficulty);

      const updatedPuzzle: PuzzlePayload<SudokuData> = {
        ...selectedPuzzle,
        title: `Puzzle ${puzzles.indexOf(selectedPuzzle) + 1}: Sudoku (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`,
        grid: grid,
        specific_data: {
          difficulty,
          solution
        }
      };
      updatePuzzle(selectedPuzzle.id, updatedPuzzle);
      setEditTitle(updatedPuzzle.title);
    } catch (e) {
      console.error("Failed to regenerate Sudoku with new difficulty", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSudoku = () => {
    if (!selectedPuzzle || selectedPuzzle.puzzle_type !== "Sudoku") return;
    const diff = selectedPuzzle.specific_data.difficulty || "easy";
    handleSudokuDifficultyChange(diff);
  };

  const handleRegenerateCrossword = async () => {
    if (!selectedPuzzle || selectedPuzzle.puzzle_type !== "Crossword") return;
    setIsGenerating(true);
    try {
      const { layoutCrossword } = await import("../puzzles/crosswordGenerator");
      const { grid, solution, clues, unplaced } = layoutCrossword(
        selectedPuzzle.specific_data.word_bank,
        editWidth,
        editHeight
      );

      const updatedPuzzle: PuzzlePayload<CrosswordData> = {
        ...selectedPuzzle,
        grid: grid,
        title: editTitle,
        specific_data: {
          ...selectedPuzzle.specific_data,
          solution,
          clues,
          unplaced_words: unplaced
        }
      };
      updatePuzzle(selectedPuzzle.id, updatedPuzzle);
    } catch (e) {
      console.error("Failed to compile crossword layout", e);
      alert("Failed to compile crossword layout. Make sure you have intersecting characters or expand the grid size.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCwClue = () => {
    if (!selectedPuzzle || selectedPuzzle.puzzle_type !== "Crossword") return;
    if (!newCwWord.trim() || !newCwClue.trim()) return;

    const newCluePair = {
      word: newCwWord.trim().toUpperCase().replace(/[^A-Z]/g, ""),
      clue: newCwClue.trim()
    };

    if (newCluePair.word.length < 2) {
      alert("Word must be at least 2 letters long.");
      return;
    }

    const updatedBank = [...selectedPuzzle.specific_data.word_bank, newCluePair];

    import("../puzzles/crosswordGenerator").then(({ layoutCrossword }) => {
      const { grid, solution, clues, unplaced } = layoutCrossword(
        updatedBank,
        editWidth,
        editHeight
      );

      updatePuzzle(selectedPuzzle.id, {
        ...selectedPuzzle,
        grid: grid,
        specific_data: {
          ...selectedPuzzle.specific_data,
          word_bank: updatedBank,
          solution,
          clues,
          unplaced_words: unplaced
        }
      });
    });

    setNewCwWord("");
    setNewCwClue("");
  };

  const handleRemoveCwClue = (index: number) => {
    if (!selectedPuzzle || selectedPuzzle.puzzle_type !== "Crossword") return;

    const updatedBank = selectedPuzzle.specific_data.word_bank.filter((_: any, idx: number) => idx !== index);

    import("../puzzles/crosswordGenerator").then(({ layoutCrossword }) => {
      const { grid, solution, clues, unplaced } = layoutCrossword(
        updatedBank,
        editWidth,
        editHeight
      );

      updatePuzzle(selectedPuzzle.id, {
        ...selectedPuzzle,
        grid: grid,
        specific_data: {
          ...selectedPuzzle.specific_data,
          word_bank: updatedBank,
          solution,
          clues,
          unplaced_words: unplaced
        }
      });
    });
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

  const handleDownloadTemplate = async () => {
    try {
      const saved = await downloadTemplate();
      if (saved) {
        setImportError(null); // Clear any previous errors
      }
    } catch (err) {
      console.error("Failed to save template:", err);
      setImportError(
        `Failed to save template: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const handleImportJson = async () => {
    setImportError(null);
    setIsImporting(true);
    setImportProgress("Opening file picker...");

    try {
      const bookData = await importBookFromJson();

      // User cancelled the dialog
      if (!bookData) {
        setIsImporting(false);
        setImportProgress("");
        return;
      }

      // Clear existing puzzles
      clearPuzzles();

      // Update book title if provided
      if (bookData.bookTitle) {
        setBookTitle(bookData.bookTitle);
      }

      // Batch-generate each page
      const totalPages = bookData.pages.length;
      for (let i = 0; i < totalPages; i++) {
        const page = bookData.pages[i];
        setImportProgress(`Generating page ${i + 1} of ${totalPages}: ${page.title}...`);

        try {
          const result: PuzzlePayload<WordSearchData> = await invoke("generate_puzzle", {
            width: page.gridWidth,
            height: page.gridHeight,
            words: page.words,
          });

          result.title = page.title;
          addPuzzle(result);
        } catch (pageErr) {
          console.error(`Failed to generate page ${i + 1}: ${page.title}`, pageErr);
          // Continue with remaining pages
          setImportError(
            `Warning: Page "${page.title}" failed to generate. ${
              pageErr instanceof Error ? pageErr.message : String(pageErr)
            }`
          );
        }
      }

      setImportProgress("");
    } catch (err) {
      console.error("Import failed:", err);
      if (err instanceof ImportValidationError) {
        setImportError(err.message);
      } else {
        setImportError(
          `Import failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    } finally {
      setIsImporting(false);
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

          {/* Import from JSON Button */}
          <button
            onClick={handleImportJson}
            disabled={isImporting || isGenerating}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600/25 to-teal-600/25 hover:from-emerald-600/40 hover:to-teal-600/40 disabled:from-slate-800 disabled:to-slate-800 text-emerald-400 hover:text-emerald-300 disabled:text-slate-500 border border-emerald-500/30 disabled:border-slate-700 text-xs font-bold py-2.5 px-3 rounded-lg transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed mt-1 shadow-sm"
          >
            {isImporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={14} />
                Import Book from JSON
              </>
            )}
          </button>

          {/* Download LLM Template Button */}
          <button
            onClick={handleDownloadTemplate}
            disabled={isImporting}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-sky-600/20 to-indigo-600/20 hover:from-sky-600/35 hover:to-indigo-600/35 disabled:from-slate-800 disabled:to-slate-800 text-sky-400 hover:text-sky-300 disabled:text-slate-500 border border-sky-500/25 disabled:border-slate-700 text-xs font-bold py-2.5 px-3 rounded-lg transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed shadow-sm"
          >
            <Download size={14} />
            Download LLM Template
          </button>

          {/* Import Progress */}
          {isImporting && importProgress && (
            <div className="flex items-center gap-2 p-2 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-[10px] text-emerald-300 animate-pulse">
              <Loader2 size={10} className="animate-spin flex-shrink-0" />
              <span className="truncate">{importProgress}</span>
            </div>
          )}

          {/* Import Error */}
          {importError && !isImporting && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-950/40 border border-rose-800/40 rounded-lg text-[10px] text-rose-300 leading-relaxed">
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="break-words">{importError}</span>
                <button
                  onClick={() => setImportError(null)}
                  className="self-end text-[9px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Book Pages Directory (Scrollable) */}
      <div className="flex-1 p-5 pt-3 overflow-y-auto flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Puzzles ({puzzles.length})</span>
          <div className="flex items-center gap-1">
            <select
              value={selectedTypeToCreate}
              onChange={(e) => setSelectedTypeToCreate(e.target.value as PuzzlePayloadType)}
              className="bg-slate-800 border border-slate-700 rounded py-0.5 px-1 text-[11px] focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer text-slate-200"
            >
              <option value="WordSearch">Word Search</option>
              <option value="Sudoku">Sudoku</option>
              <option value="Crossword">Crossword</option>
            </select>
            <button
              onClick={handleAddPuzzle}
              disabled={isGenerating}
              className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold py-0.5 px-2 rounded border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {puzzles.map((p, idx) => {
            const isSelected = p.id === selectedPuzzleId;
            const cols = p.grid[0]?.length || 0;
            const rows = p.grid.length || 0;
            const isWordSearch = p.puzzle_type === "WordSearch";
            const isCrossword = p.puzzle_type === "Crossword";
            const infoText = isWordSearch 
              ? `${p.specific_data.word_bank.length} words`
              : isCrossword
                ? `${p.specific_data.clues.length} clues`
                : `${p.specific_data.difficulty || "easy"}`;

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
                    <span className="capitalize">{infoText}</span>
                    <span>•</span>
                    <span>{cols}x{rows}</span>
                    <span>•</span>
                    <span className="text-[9px] text-emerald-500 font-semibold">{p.puzzle_type}</span>
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
      <div className="p-5 border-t border-slate-800 bg-slate-950/20 flex flex-col gap-3 flex-shrink-0 overflow-y-auto max-h-[50%]">
        {selectedPuzzle ? (
          <>
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
              <Settings className="text-emerald-400" size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Edit Page #{puzzles.findIndex((p) => p.id === selectedPuzzle.id) + 1} ({selectedPuzzle.puzzle_type})
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

              {selectedPuzzle.puzzle_type === "Sudoku" ? (
                /* Sudoku Editor Panel */
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400">Difficulty</label>
                    <select
                      className="bg-slate-800 border border-slate-750 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-100"
                      value={selectedPuzzle.specific_data.difficulty || "easy"}
                      onChange={(e) => handleSudokuDifficultyChange(e.target.value as any)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div className="text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800/60 leading-normal">
                    <p className="font-bold text-slate-350 mb-0.5">Sudoku Rules:</p>
                    Ensure every row, column, and 3x3 block contains all numbers from 1 to 9.
                  </div>

                  <button
                    onClick={handleRegenerateSudoku}
                    disabled={isGenerating}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold py-2 px-3 rounded shadow-md transition-all flex justify-center items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                    {isGenerating ? "Regenerating..." : "Regenerate Sudoku"}
                  </button>
                </div>
              ) : selectedPuzzle.puzzle_type === "Crossword" ? (
                /* Crossword Editor Panel */
                <div className="flex flex-col gap-3">
                  {/* Grid Dimensions */}
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1 w-1/2">
                      <label className="text-[10px] font-semibold text-slate-400 flex justify-between">
                        <span>Width</span>
                        <span className="font-bold text-emerald-400">{editWidth}</span>
                      </label>
                      <input
                        type="range"
                        min="6"
                        max="22"
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
                        min="6"
                        max="22"
                        className="accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                        value={editHeight}
                        onChange={(e) => setEditHeight(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Word List Manager */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-400">Manage Clues ({selectedPuzzle.specific_data.word_bank.length})</label>
                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      {selectedPuzzle.specific_data.word_bank.map((c: any, index: number) => (
                        <div key={index} className="flex justify-between items-start gap-1.5 bg-slate-800/60 p-1.5 rounded text-[11px] border border-slate-750">
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="font-extrabold text-emerald-400 tracking-wide truncate">{c.word}</span>
                            <span className="text-[10px] text-slate-400 leading-tight italic truncate">{c.clue}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveCwClue(index)}
                            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded flex-shrink-0"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form to Add Clue */}
                  <div className="bg-slate-900/40 p-2.5 rounded border border-slate-800/60 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Add Word & Clue</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Word"
                        className="bg-slate-800 border border-slate-750 rounded p-1 text-xs w-1/3 outline-none text-slate-100 font-mono"
                        value={newCwWord}
                        onChange={(e) => setNewCwWord(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Clue"
                        className="bg-slate-800 border border-slate-750 rounded p-1 text-xs w-2/3 outline-none text-slate-100"
                        value={newCwClue}
                        onChange={(e) => setNewCwClue(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleAddCwClue}
                      className="bg-emerald-650/30 hover:bg-emerald-600/45 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold py-1 px-2.5 rounded active:scale-95 cursor-pointer self-end"
                    >
                      + Add Pair
                    </button>
                  </div>

                  <button
                    onClick={handleRegenerateCrossword}
                    disabled={isGenerating}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold py-2 px-3 rounded shadow-md transition-all flex justify-center items-center gap-1.5 active:scale-95 cursor-pointer mt-1"
                  >
                    <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                    {isGenerating ? "Compiling..." : "Re-Compile Grid"}
                  </button>
                </div>
              ) : (
                /* Word Search Editor Panel */
                <>
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
                </>
              )}
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
