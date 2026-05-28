import { Sidebar } from "./components/Sidebar";
import { Preview } from "./components/Preview";
import "./App.css";

function App() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 text-slate-900 font-sans">
      <Sidebar />
      <Preview />
    </div>
  );
}

export default App;
