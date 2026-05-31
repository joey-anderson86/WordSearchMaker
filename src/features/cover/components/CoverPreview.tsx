import { useRef, useState, useEffect } from 'react';
import { useStore } from '../../../store';
import { getPageDimensions } from '../../../types/pageSizes';
import { Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { CoverDocument } from '../CoverDocument';

export function CoverPreview() {
    const {
        pageSize, pages, includeSolutions,
        coverBgImage, coverBgColor, coverTitle, coverSubtitle,
        coverAuthor, coverSpineText, coverTitleFont, coverTitleColor, coverTitleSize
    } = useStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const totalPages = pages.length * 2 + (includeSolutions ? 10 : 0);
    const bleedPt = 0.125 * 72; // 9pt
    const spineWidthPt = Math.max((totalPages * 0.002252) * 72, 10);
    
    const dims = getPageDimensions(pageSize);
    const trimWidth = dims.width;
    const trimHeight = dims.height;
    
    const totalWidth = (trimWidth * 2) + spineWidthPt + (bleedPt * 2);
    const totalHeight = trimHeight + (bleedPt * 2);

    useEffect(() => {
        const calculateScale = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const padding = 60;
                const scaleX = (clientWidth - padding) / totalWidth;
                const scaleY = (clientHeight - padding) / totalHeight;
                setScale(Math.min(scaleX, scaleY, 1.5)); // Max scale 1.5
            }
        };

        calculateScale();
        // Delay one frame to ensure container is fully sized
        requestAnimationFrame(calculateScale);
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [totalWidth, totalHeight]);

    const handleExport = async () => {
        const blob = await pdf(
            <CoverDocument 
                pageSize={pageSize}
                pageCount={totalPages}
                bgImage={coverBgImage}
                bgColor={coverBgColor}
                title={coverTitle}
                subtitle={coverSubtitle}
                author={coverAuthor}
                spineText={coverSpineText}
                titleFont={coverTitleFont}
                titleColor={coverTitleColor}
                titleSize={coverTitleSize}
            />
        ).toBlob();
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-${pageSize.toLowerCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
            {/* Header Toolbar */}
            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-sm font-bold text-slate-100 tracking-wide">Cover Preview</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg shadow-md shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95 cursor-pointer text-xs"
                    >
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div 
                className="flex-1 min-h-0 p-6 flex items-center justify-center overflow-hidden" 
                ref={containerRef}
            >
                <div 
                    className="shadow-2xl relative flex-shrink-0 border border-slate-700 overflow-hidden"
                    style={{
                        width: `${totalWidth}px`,
                        height: `${totalHeight}px`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                        backgroundColor: coverBgColor
                    }}
                >
                    {coverBgImage && (
                        <img src={coverBgImage} alt="Cover Background" className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none" />
                    )}

                    {/* Bleed Guide (Red Dashed Box) */}
                    <div 
                        className="absolute border border-dashed border-red-500/50 pointer-events-none"
                        style={{
                            top: `${bleedPt}px`,
                            left: `${bleedPt}px`,
                            right: `${bleedPt}px`,
                            bottom: `${bleedPt}px`,
                            zIndex: 10
                        }}
                    />

                    {/* Left (Back Cover) */}
                    <div 
                        className="absolute border-r border-blue-500/30 border-dashed pointer-events-none"
                        style={{
                            top: 0,
                            left: 0,
                            width: `${trimWidth + bleedPt}px`,
                            height: `${totalHeight}px`,
                        }}
                    >
                        {/* Barcode */}
                        <div 
                            className="absolute bg-white flex items-center justify-center border border-slate-300 shadow-sm"
                            style={{
                                bottom: `${bleedPt + 18}px`,
                                right: `18px`,
                                width: `144px`,
                                height: `86.4px`,
                            }}
                        >
                            <span className="text-[8px] text-slate-400 font-mono">Barcode / ISBN</span>
                        </div>
                    </div>

                    {/* Center (Spine) */}
                    <div 
                        className="absolute border-r border-blue-500/30 border-dashed flex items-center justify-center overflow-hidden"
                        style={{
                            top: 0,
                            left: `${trimWidth + bleedPt}px`,
                            width: `${spineWidthPt}px`,
                            height: `${totalHeight}px`,
                        }}
                    >
                        <span 
                            style={{
                                transform: 'rotate(-90deg)',
                                whiteSpace: 'nowrap',
                                color: coverTitleColor,
                                fontFamily: coverTitleFont === 'Modern Sans' ? 'sans-serif' : 'monospace', // Fallbacks since we don't load the real font in CSS here right now
                                fontSize: '10px',
                                fontWeight: 'bold'
                            }}
                        >
                            {coverSpineText}
                        </span>
                    </div>

                    {/* Right (Front Cover) */}
                    <div 
                        className="absolute flex flex-col items-center justify-center p-8"
                        style={{
                            top: 0,
                            left: `${trimWidth + bleedPt + spineWidthPt}px`,
                            width: `${trimWidth + bleedPt}px`,
                            height: `${totalHeight}px`,
                        }}
                    >
                        <h1 
                            className="text-center w-full mb-4 px-4"
                            style={{ 
                                color: coverTitleColor, 
                                fontSize: `${coverTitleSize}px`,
                                fontFamily: coverTitleFont === 'Modern Sans' ? 'sans-serif' : 'monospace',
                                fontWeight: 'bold',
                                lineHeight: 1.1
                            }}
                        >
                            {coverTitle}
                        </h1>
                        {coverSubtitle && (
                            <h2 
                                className="text-center w-full mb-12 px-8"
                                style={{ 
                                    color: coverTitleColor, 
                                    fontSize: `${coverTitleSize * 0.4}px`,
                                    fontFamily: coverTitleFont === 'Modern Sans' ? 'sans-serif' : 'monospace',
                                    lineHeight: 1.2
                                }}
                            >
                                {coverSubtitle}
                            </h2>
                        )}
                        {coverAuthor && (
                            <div 
                                className="absolute w-full text-center"
                                style={{ 
                                    bottom: `${bleedPt + 36}px`,
                                    color: coverTitleColor, 
                                    fontSize: `${coverTitleSize * 0.3}px`,
                                    fontFamily: coverTitleFont === 'Modern Sans' ? 'sans-serif' : 'monospace',
                                }}
                            >
                                {coverAuthor}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
