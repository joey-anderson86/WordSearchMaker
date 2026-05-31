import { Sidebar } from "./features/puzzles/components/Sidebar";
import { Preview } from "./features/puzzles/components/Preview";
import { RightPanel } from "./features/puzzles/components/RightPanel";
import "./App.css";

function App() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 text-slate-900 font-sans">
      <Sidebar />
      <Preview />
      <RightPanel />
    </div>
  );
}

export default App;
