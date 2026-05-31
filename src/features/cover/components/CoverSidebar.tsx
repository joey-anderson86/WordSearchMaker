import React, { useRef } from 'react';
import { useStore } from '../../../store';
import { Settings, Image as ImageIcon, Type, Palette } from 'lucide-react';

const FONTS = [
  "Modern Sans",
  "Oswald",
  "Montserrat",
  "JetBrains Mono",
  "Fira Code"
];

export function CoverSidebar() {
    const {
        coverBgColor, setCoverBgColor,
        coverTitle, setCoverTitle,
        coverSubtitle, setCoverSubtitle,
        coverAuthor, setCoverAuthor,
        coverSpineText, setCoverSpineText,
        coverTitleFont, setCoverTitleFont,
        coverTitleColor, setCoverTitleColor,
        coverTitleSize, setCoverTitleSize,
        setCoverBgImage, setViewMode,
        pages, includeSolutions
    } = useStore(state => ({
        ...state,
        pages: state.pages,
        includeSolutions: state.includeSolutions
    }));

    const fileInputRef = useRef<HTMLInputElement>(null);
    const totalPages = pages.length * 2 + (includeSolutions ? 10 : 0); // rough estimate of physical pages

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setCoverBgImage(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-[300px] h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-10 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-slate-800 flex-shrink-0">
                <div className="flex gap-1 bg-slate-800 p-0.5 rounded text-xs font-semibold">
                    <button onClick={() => setViewMode('interior')} className="text-slate-400 hover:text-slate-200 px-3 py-1 rounded cursor-pointer">Interior</button>
                    <button className="bg-slate-600 text-white px-3 py-1 rounded shadow-sm cursor-default">Cover</button>
                </div>
            </div>

            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <Settings className="text-emerald-400" size={18} />
                <h2 className="font-bold text-slate-200 tracking-wide text-sm">Cover Settings</h2>
            </div>
            
            <div className="p-4 flex flex-col gap-6">
                {/* Book Details */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Type size={14}/> Details</h3>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400">Main Title</label>
                        <input type="text" value={coverTitle} onChange={e => setCoverTitle(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-100" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400">Subtitle</label>
                        <input type="text" value={coverSubtitle} onChange={e => setCoverSubtitle(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-100" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400">Author</label>
                        <input type="text" value={coverAuthor} onChange={e => setCoverAuthor(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-100" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400">Spine Text</label>
                        <input type="text" value={coverSpineText} onChange={e => setCoverSpineText(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-100" />
                    </div>
                </div>

                {/* Typography */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Palette size={14}/> Typography</h3>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400">Font Family</label>
                        <select value={coverTitleFont} onChange={e => setCoverTitleFont(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs outline-none text-slate-100 cursor-pointer">
                            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex flex-col gap-1.5 w-1/2">
                            <label className="text-[10px] text-slate-400">Title Size (pt)</label>
                            <input type="number" value={coverTitleSize} onChange={e => setCoverTitleSize(Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs outline-none text-slate-100" />
                        </div>
                        <div className="flex flex-col gap-1.5 w-1/2">
                            <label className="text-[10px] text-slate-400">Text Color</label>
                            <input type="color" value={coverTitleColor} onChange={e => setCoverTitleColor(e.target.value)} className="h-8 w-full cursor-pointer bg-slate-800 border border-slate-700 rounded outline-none p-0.5" />
                        </div>
                    </div>
                </div>

                {/* Background */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><ImageIcon size={14}/> Background</h3>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400">Fill Color</label>
                        <input type="color" value={coverBgColor} onChange={e => setCoverBgColor(e.target.value)} className="h-8 w-full cursor-pointer bg-slate-800 border border-slate-700 rounded outline-none p-0.5" />
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2">
                        <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded shadow transition-all flex items-center justify-center gap-2">
                            <ImageIcon size={14}/> Upload Wrap Image
                        </button>
                        <button onClick={() => setCoverBgImage(null)} className="text-[10px] text-rose-400 hover:text-rose-300 underline mt-1 text-center">Remove Image</button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                </div>
                
                {/* Stats */}
                <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-750">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Estimated Page Count:</span>
                        <span className="text-emerald-400 font-bold">{totalPages}</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                        <span className="text-slate-400">Est. Spine Width:</span>
                        <span className="text-emerald-400 font-bold">{(totalPages * 0.002252).toFixed(3)}"</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
