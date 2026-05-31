const fs = require('fs');

function castAnywhere(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // cast activePuzzle.specificData.data
    content = content.replace(/activePuzzle\.specificData\.data/g, '(activePuzzle.specificData.data as any)');
    
    // cast selectedPuzzle.specificData.data
    content = content.replace(/selectedPuzzle\.specificData\.data/g, '(selectedPuzzle.specificData.data as any)');
    
    // cast p.specificData.data
    content = content.replace(/p\.specificData\.data/g, '(p.specificData.data as any)');

    fs.writeFileSync(filePath, content);
}

castAnywhere('src/features/puzzles/components/Preview.tsx');
castAnywhere('src/features/puzzles/components/Sidebar.tsx');
