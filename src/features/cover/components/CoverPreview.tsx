import { useRef, useState, useEffect } from 'react';
import { useStore } from '../../../store';
import { getPageDimensions } from '../../../types/pageSizes';
import { Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { CoverDocument } from '../CoverDocument';

export function CoverPreview() {
    const coverState = useStore();
    const {
        pageSize, pages, includeSolutions,
        coverBgImage, coverBgColor, coverElements, coverArtLayers
    } = coverState;

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
        // Find trim size (no bleed dims)
        const trimDims = getPageDimensions(pageSize.replace("_BLEED", "_NO_BLEED"));
        const trimWidthInches = trimDims.width / 72;
        const trimHeightInches = trimDims.height / 72;

        const blob = await pdf(
            <CoverDocument 
                coverState={coverState}
                pageCount={totalPages}
                trimWidth={trimWidthInches}
                trimHeight={trimHeightInches}
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

                    {/* Guides Container (Pointer Events None) */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                        {/* Bleed Guide (Red Dashed Box) */}
                        <div 
                            className="absolute border border-dashed border-red-500/50"
                            style={{
                                top: `${bleedPt}px`,
                                left: `${bleedPt}px`,
                                right: `${bleedPt}px`,
                                bottom: `${bleedPt}px`,
                            }}
                        />

                        {/* Back Cover Guide */}
                        <div 
                            className="absolute border-r border-blue-500/30 border-dashed"
                            style={{
                                top: 0,
                                left: 0,
                                width: `${trimWidth + bleedPt}px`,
                                height: `${totalHeight}px`,
                            }}
                        />

                        {/* Spine Guide */}
                        <div 
                            className="absolute border-r border-blue-500/30 border-dashed"
                            style={{
                                top: 0,
                                left: `${trimWidth + bleedPt}px`,
                                width: `${spineWidthPt}px`,
                                height: `${totalHeight}px`,
                            }}
                        />

                        {/* Barcode Location Guide */}
                        <div 
                            className="absolute bg-white/80 flex items-center justify-center border border-slate-400 border-dashed"
                            style={{
                                bottom: `${bleedPt + 18}px`,
                                left: `${trimWidth + bleedPt - 18 - 144}px`, // 18px from spine fold on the back cover
                                width: `144px`,
                                height: `86.4px`,
                            }}
                        >
                            <span className="text-[8px] text-slate-500 font-mono">Barcode / ISBN Area</span>
                        </div>
                    </div>

                    {/* Art Layers */}
                    {coverArtLayers.map(layer => (
                        <img
                            key={layer.id}
                            src={layer.url}
                            alt="Art layer"
                            className="absolute pointer-events-none"
                            style={{
                                left: `${layer.x}px`,
                                top: `${layer.y}px`,
                                width: `${layer.width}px`,
                                height: `${layer.height}px`,
                                opacity: layer.opacity ?? 1,
                                zIndex: layer.zIndex ?? 1
                            }}
                        />
                    ))}

                    {/* Text Elements */}
                    {coverElements.map(el => {
                        const isSpine = el.type === 'spine';
                        return (
                            <div
                                key={el.id}
                                className="absolute flex items-center pointer-events-none"
                                style={{
                                    left: `${el.x}px`,
                                    top: `${el.y}px`,
                                    width: `${el.width}px`,
                                    height: `${el.height}px`,
                                    zIndex: el.zIndex ?? 10,
                                    transform: isSpine ? 'rotate(-90deg)' : 'none',
                                    transformOrigin: 'center center',
                                    justifyContent: el.content.align === 'center' ? 'center' : (el.content.align === 'right' ? 'flex-end' : 'flex-start'),
                                }}
                            >
                                <span
                                    style={{
                                        color: el.content.color || '#000000',
                                        fontSize: `${el.content.fontSize ?? 12}px`,
                                        fontFamily: el.content.fontFamily === 'Modern Sans' ? 'sans-serif' : 'monospace',
                                        fontWeight: 'bold',
                                        textAlign: el.content.align as any,
                                        whiteSpace: isSpine ? 'nowrap' : 'normal',
                                        lineHeight: 1.1
                                    }}
                                >
                                    {el.content.text}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
