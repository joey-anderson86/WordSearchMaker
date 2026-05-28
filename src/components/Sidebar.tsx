import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore, PuzzlePayload, WordSearchData } from "../store";
import { Settings, FileText, Grid3x3, Type } from "lucide-react";

export function Sidebar() {
  const [title, setTitle] = useState("My Word Search");
  const [width, setWidth] = useState(15);
  const [height, setHeight] = useState(15);
  const [words, setWords] = useState("RUST\nTAURI\nREACT\nTAILWIND\nZUSTAND");
  const [isGenerating, setIsGenerating] = useState(false);

  const addPuzzle = useStore((state) => state.addPuzzle);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const wordList = words
        .split("\n")
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
      
      const result: PuzzlePayload<WordSearchData> = await invoke("generate_puzzle", {
        width,
        height,
        words: wordList,
      });

      // Update the puzzle title manually since Rust backend hardcodes it
      result.title = title;
      
      addPuzzle(result);
    } catch (e) {
      console.error("Failed to generate puzzle", e);
      alert("Failed to generate puzzle. See console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-80 bg-slate-900 text-slate-100 p-6 flex flex-col gap-6 h-screen overflow-y-auto shadow-xl z-10 border-r border-slate-800">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Grid3x3 className="text-emerald-400" size={28} />
        <h2 className="text-xl font-bold tracking-wide">Puzzle Config</h2>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <Type size={16} /> Book Title
          </label>
          <input
            type="text"
            className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-2 w-1/2">
            <label className="text-sm font-semibold text-slate-400">Width ({width})</label>
            <input
              type="range"
              min="5"
              max="30"
              className="accent-emerald-500"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2 w-1/2">
            <label className="text-sm font-semibold text-slate-400">Height ({height})</label>
            <input
              type="range"
              min="5"
              max="30"
              className="accent-emerald-500"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <FileText size={16} /> Word List (one per line)
          </label>
          <textarea
            className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm h-48 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none font-mono transition-all"
            value={words}
            onChange={(e) => setWords(e.target.value)}
          ></textarea>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="mt-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-900/50 transition-all flex justify-center items-center gap-2 active:scale-95"
      >
        <Settings size={20} className={isGenerating ? "animate-spin" : ""} />
        {isGenerating ? "Generating..." : "Generate Puzzle"}
      </button>
    </div>
  );
}
