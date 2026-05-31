const fs = require('fs');
const path = require('path');

function refactorFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace puzzle_type with specific_data.type
    content = content.replace(/(\w+)\.puzzle_type/g, '$1.specific_data.type');
    
    // Replace specific_data.xxx with specific_data.data.xxx
    // Wait, first let's list the known properties of specific_data
    const props = ['word_bank', 'unplaced_words', 'solutions', 'difficulty', 'solution', 'clues'];
    props.forEach(prop => {
        const regex = new RegExp(`(\\.specific_data)\\.(${prop})`, 'g');
        content = content.replace(regex, '$1.data.$2');
    });

    // Handle puzzle generation where we create specific_data object
    // Replace: specific_data: { difficulty: "easy", solution: solution }
    // With: specific_data: { type: "Sudoku", data: { difficulty: "easy", solution: solution } }
    
    // We have specific puzzle creation blocks in Sidebar.tsx
    // Let's do some manual regex for the object literals:
    content = content.replace(/specific_data:\s*\{\s*difficulty:\s*"easy",\s*solution:\s*solution\s*\}/g, 'specific_data: { type: "Sudoku", data: { difficulty: "easy", solution: solution } }');
    content = content.replace(/specific_data:\s*\{\s*difficulty:\s*"easy",\s*solution:\s*solution,\s*clues:\s*clues,\s*word_bank:\s*DEFAULT_CROSSWORD_INPUTS\.map\(c => \(\{ \.\.\.c \}\)\),\s*unplaced_words:\s*unplaced\s*\}/g, 'specific_data: { type: "Crossword", data: { difficulty: "easy", solution: solution, clues: clues, word_bank: DEFAULT_CROSSWORD_INPUTS.map(c => ({ ...c })), unplaced_words: unplaced } }');
    content = content.replace(/specific_data:\s*\{\s*\.\.\.selectedPuzzle\.specific_data,\s*solution,\s*clues,\s*unplaced_words:\s*unplaced\s*\}/g, 'specific_data: { ...selectedPuzzle.specific_data, data: { ...selectedPuzzle.specific_data.data, solution, clues, unplaced_words: unplaced } }');
    content = content.replace(/specific_data:\s*\{\s*\.\.\.selectedPuzzle\.specific_data,\s*word_bank:\s*updatedBank,\s*solution,\s*clues,\s*unplaced_words:\s*unplaced\s*\}/g, 'specific_data: { ...selectedPuzzle.specific_data, data: { ...selectedPuzzle.specific_data.data, word_bank: updatedBank, solution, clues, unplaced_words: unplaced } }');
    content = content.replace(/specific_data:\s*\{\s*difficulty,\s*solution\s*\}/g, 'specific_data: { type: "Sudoku", data: { difficulty, solution } }');
    
    // Replace imports from "../store"
    content = content.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*"(\.\.\/)?store";/g, (match, p1, p2) => {
        // We'll replace it with:
        // import { useStore } from "path/to/store";
        // import { PuzzlePayload } from "path/to/types/generated/PuzzlePayload";
        // etc
        return match; // We'll handle imports manually using replace_file_content
    });

    fs.writeFileSync(filePath, content);
}

const files = [
    'src/components/Sidebar.tsx',
    'src/components/Preview.tsx',
    'src/components/PdfDocument.tsx'
];

files.forEach(f => refactorFile(path.join(__dirname, f)));
