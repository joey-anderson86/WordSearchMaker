const fs = require('fs');

function fixImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace ../store with ../../../store for features/puzzles/components
    content = content.replace(/from "\.\.\/store"/g, 'from "../../../store"');
    
    // Replace ../utils with ../../../utils
    content = content.replace(/from "\.\.\/utils/g, 'from "../../../utils');
    
    // Replace ../puzzles with ../../../puzzles
    content = content.replace(/import\("\.\.\/puzzles/g, 'import("../../../puzzles');
    
    // PdfDocument import in Preview.tsx
    content = content.replace(/from "\.\/PdfDocument"/g, 'from "../../pdf/components/PdfDocument"');

    // Also we need to fix PdfDocument's store import
    if (filePath.includes('PdfDocument.tsx')) {
        content = content.replace(/from "\.\.\/types\/generated/g, 'from "../../../types/generated');
    } else {
        content = content.replace(/from "\.\.\/types\/generated/g, 'from "../../../types/generated');
    }

    fs.writeFileSync(filePath, content);
}

fixImports('src/features/puzzles/components/Sidebar.tsx');
fixImports('src/features/puzzles/components/Preview.tsx');
fixImports('src/features/pdf/components/PdfDocument.tsx');
