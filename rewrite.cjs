const fs = require('fs');
let code = fs.readFileSync('src/features/puzzles/components/Preview.tsx', 'utf8');

// Replace the header title
code = code.replace(
  `        <div>
          <h1 
            className="text-3xl font-black text-slate-800 leading-none"
            style={{ fontFamily: fontStyleMap[activePuzzle.titleFont || "Modern Sans"] }}
          >
            {formatTitle(activePuzzle.title, activePuzzle.themeAccents)}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {isSudoku ? "Sudoku • 9 x 9 Grid" : isCrossword ? \`Crossword • \${cols} x \${rows} Grid\` : \`\${cols} x \${rows} Grid\`}
          </p>
        </div>`,
  `        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-800">Page Preview</h2>
        </div>`
);

// Replace the Main Content Area wrapper
const oldMainContentAreaStart = `      {/* Main Content Area */}
      <div className="flex-1 min-h-0 p-6 pt-2 pb-6 flex flex-col gap-4 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Grid Container */}
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center overflow-hidden"
        >
          <div 
            className={\`relative \${ideThemeSetting ? "border-2 border-slate-700 bg-slate-900 rounded-xl p-4 pt-10 shadow-2xl" : ""}\`}
            style={{
              width: ideThemeSetting ? \`\${gridWidth + 32}px\` : \`\${gridWidth}px\`,
              height: ideThemeSetting ? \`\${gridHeight + 56}px\` : \`\${gridHeight}px\`,
            }}
          >`;

const newMainContentAreaStart = `      {/* Main Content Area */}
      <div className="flex-1 min-h-0 p-6 pt-2 pb-6 flex items-center justify-center max-w-7xl mx-auto w-full overflow-hidden" ref={containerRef}>
        <div 
          className="bg-white shadow-2xl flex flex-col relative flex-shrink-0"
          style={{
            width: \`\${pdfDims.width}px\`,
            height: \`\${pdfDims.height}px\`,
            transform: \`scale(\${scale})\`,
            transformOrigin: 'center center',
          }}
        >
          <div className="flex-1 flex flex-col py-10 px-10 w-full h-full text-slate-900 bg-white" style={{ fontFamily: 'sans-serif' }}>
            
            {/* Page Header inside Preview */}
            <div className="border-b border-slate-200 pb-2 mb-6 flex-shrink-0">
              <h1 
                className="text-[28px] font-bold text-slate-900 leading-none"
                style={{ fontFamily: titleFontFamily }}
              >
                {showSolutions ? \`Solution: \${formatTitle(activePuzzle.title, activePuzzle.themeAccents)}\` : formatTitle(activePuzzle.title, activePuzzle.themeAccents)}
              </h1>
              <p className="text-slate-500 mt-1 text-[13px]">
                {isSudoku ? "Sudoku • " + (activePuzzle.specificData.data as any).difficulty?.toUpperCase() : isCrossword ? \`Crossword • \${(activePuzzle.specificData.data as any).difficulty?.toUpperCase()}\` : \`\${cols} x \${rows} Grid\`}
              </p>
            </div>

            {/* Grid Container */}
            <div className="flex flex-col items-center justify-center flex-1 min-h-0 mb-4">
              <div 
                className={\`relative \${ideThemeSetting ? "border-2 border-slate-700 bg-slate-900 rounded-xl p-4 pt-10 shadow-2xl" : ""}\`}
                style={{
                  width: ideThemeSetting ? \`\${gridWidth + 32}px\` : \`\${gridWidth}px\`,
                  height: ideThemeSetting ? \`\${gridHeight + 56}px\` : \`\${gridHeight}px\`,
                }}
              >`;

code = code.replace(oldMainContentAreaStart, newMainContentAreaStart);

// Now we need to fix the closing tags of the Grid Container.
const oldGridContainerClose = `              </svg>
            )}
          </div>
        </div>

        {/* Word Bank Container (Word Search) */}`;

const newGridContainerClose = `              </svg>
            )}
          </div>
        </div>

        {/* Word Bank Container (Word Search) */}`;
// Actually, Grid container close is the same, except one less div closing tag, wait.
// Old structure:
// <div Main Content Area>
//   <div Grid Container outer>
//     <div Grid Container inner>
//
// New structure:
// <div Main Content Area>
//   <div Page Box>
//     <div Page Content>
//       ... header ...
//       <div Grid Container outer>
//         <div Grid Container inner>
// 
// So Grid Container outer needs to be matched.
// Let's replace the outer wrappers for Word Bank and Clues.

code = code.replace(
  `        {/* Word Bank Container (Word Search) */}
        {activePuzzle.specificData.type === "WordSearch" && (
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex-shrink-0 max-h-[30%] overflow-y-auto text-left">`,
  `        {/* Word Bank Container (Word Search) */}
        {activePuzzle.specificData.type === "WordSearch" && (
          <div className="bg-slate-50/50 p-4 rounded border border-slate-200 flex-shrink-0 text-left mt-auto">`
);

code = code.replace(
  `        {/* Number Placement Helper (Sudoku) */}
        {activePuzzle.specificData.type === "Sudoku" && (
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex-shrink-0">`,
  `        {/* Number Placement Helper (Sudoku) */}
        {activePuzzle.specificData.type === "Sudoku" && (
          <div className="bg-slate-50/50 p-4 rounded border border-slate-200 flex-shrink-0 mt-auto">`
);

code = code.replace(
  `        {/* Clues Panel (Crossword) */}
        {activePuzzle.specificData.type === "Crossword" && (
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex-shrink-0 max-h-[35%] overflow-y-auto flex flex-col">`,
  `        {/* Clues Panel (Crossword) */}
        {activePuzzle.specificData.type === "Crossword" && (
          <div className="flex gap-6 mt-auto">`
);
// Crossword clues needs more restructuring since it doesn't need to be a scrollable box anymore, it should be columns.
// In the original, Crossword Clues has an outer div, then an h3, then a warning, then grid columns.

// Replace the end of the file
const oldFooter = `      </div>
    </div>
  );
}`;

const newFooter = `              {/* Footer */}
              <div className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-slate-400 border-t border-slate-100 pt-1.5 mx-10">
                 Page {activeIndex + 1}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`;
code = code.replace(oldFooter, newFooter);

fs.writeFileSync('src/features/puzzles/components/Preview.tsx', code);
console.log('Successfully rewrote Preview.tsx');
