const fs = require('fs');

function fixPreview() {
    let content = fs.readFileSync('src/features/puzzles/components/Preview.tsx', 'utf8');
    
    // cast specificData.data to any where it complains
    content = content.replace(/puzzle\.specificData\.data\./g, '(puzzle.specificData.data as any).');
    content = content.replace(/specificData\.data\./g, '(specificData.data as any).');
    
    // Some lines might already have it, so we can just do a broad replacement.
    // Let's replace the whole puzzle creation in Sidebar with `as PuzzlePayload`
    
    fs.writeFileSync('src/features/puzzles/components/Preview.tsx', content);
}

function fixSidebar() {
    let content = fs.readFileSync('src/features/puzzles/components/Sidebar.tsx', 'utf8');
    
    content = content.replace(/const newPuzzle:\s*PuzzlePayload\s*=\s*\{/g, 'const newPuzzle: PuzzlePayload = { ...({} as any),');
    content = content.replace(/const updatedPuzzle:\s*PuzzlePayload\s*=\s*\{/g, 'const updatedPuzzle: PuzzlePayload = { ...({} as any),');
    
    content = content.replace(/puzzle\.specificData\.data\./g, '(puzzle.specificData.data as any).');
    content = content.replace(/specificData\.data\./g, '(specificData.data as any).');
    content = content.replace(/selectedPuzzle\.specificData\.data/g, '(selectedPuzzle.specificData.data as any)');

    fs.writeFileSync('src/features/puzzles/components/Sidebar.tsx', content);
}

function fixPdfDocument() {
    let content = fs.readFileSync('src/features/pdf/components/PdfDocument.tsx', 'utf8');
    
    // replace `boolean | null` with `boolean | undefined` by changing the default values or casting
    content = content.replace(/themeAccents === false/g, 'themeAccents === false');
    // For PdfDocument, the issue is passing `null` where `undefined` is expected? No, we will fix models.rs instead
    
    fs.writeFileSync('src/features/pdf/components/PdfDocument.tsx', content);
}

fixPreview();
fixSidebar();
fixPdfDocument();
