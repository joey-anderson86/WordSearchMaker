import { Sidebar } from "./features/puzzles/components/Sidebar";
import { Preview } from "./features/puzzles/components/Preview";
import { RightPanel } from "./features/puzzles/components/RightPanel";
import { CoverEditor } from "./features/cover/CoverEditor";
import { useStore } from "./store";
import "./App.css";

function App() {
  const viewMode = useStore(state => state.viewMode);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 text-slate-900 font-sans">
      {viewMode === "interior" ? (
        <>
          <Sidebar />
          <Preview />
          <RightPanel />
        </>
      ) : (
        <CoverEditor />
      )}
    </div>
  );
}

export default App;
