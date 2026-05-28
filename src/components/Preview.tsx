import { useStore } from "../store";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Download, AlertCircle } from "lucide-react";

export function Preview() {
  const puzzles = useStore((state) => state.puzzles);

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
        payload: activePuzzle
      });
      
      alert(`Successfully saved to ${filePath}`);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export PDF. Check console for details.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-8 lg:p-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800">{activePuzzle.title}</h1>
            <p className="text-slate-500 mt-1 font-medium">
              {activePuzzle.grid[0]?.length || 0} x {activePuzzle.grid.length || 0} Grid
            </p>
          </div>
          
          <button
            onClick={handleExportPDF}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg shadow-md shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
          >
            <Download size={18} /> Export to PDF
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 flex justify-center">
          <div 
            className="grid gap-1 font-mono text-lg font-bold text-slate-700 select-none"
            style={{ 
              gridTemplateColumns: `repeat(${activePuzzle.grid[0]?.length || 1}, minmax(0, 1fr))` 
            }}
          >
            {activePuzzle.grid.map((row, y) => (
              row.map((cell, x) => (
                <div 
                  key={`${x}-${y}`} 
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 cursor-default"
                >
                  {cell}
                </div>
              ))
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 text-lg border-b pb-2">Word Bank</h3>
          <div className="flex flex-wrap gap-2">
            {activePuzzle.specific_data.word_bank.map((word, i) => {
              const unplaced = activePuzzle.specific_data.unplaced_words.includes(word);
              return (
                <span 
                  key={i} 
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold tracking-wide flex items-center gap-1.5 ${
                    unplaced 
                      ? "bg-red-100 text-red-700 border border-red-200" 
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {unplaced && <AlertCircle size={14} />}
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
