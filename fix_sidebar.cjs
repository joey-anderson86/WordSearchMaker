const fs = require('fs');

function fixSidebar() {
    let content = fs.readFileSync('src/features/puzzles/components/Sidebar.tsx', 'utf8');
    
    // Remove puzzle_type: "Sudoku" etc from object literals
    content = content.replace(/puzzle_type:\s*"[^"]+",\s*/g, '');

    fs.writeFileSync('src/features/puzzles/components/Sidebar.tsx', content);
}

fixSidebar();
