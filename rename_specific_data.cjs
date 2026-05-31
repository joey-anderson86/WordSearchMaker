const fs = require('fs');

function replaceSpecificData(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace specific_data with specificData
    content = content.replace(/specific_data/g, 'specificData');

    fs.writeFileSync(filePath, content);
}

replaceSpecificData('src/features/puzzles/components/Sidebar.tsx');
replaceSpecificData('src/features/puzzles/components/Preview.tsx');
replaceSpecificData('src/features/pdf/components/PdfDocument.tsx');
