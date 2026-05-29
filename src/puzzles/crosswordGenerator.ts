export interface CrosswordClue {
  id: string;
  number: number;
  direction: "across" | "down";
  row: number;
  col: number;
  clue: string;
  answer: string;
}

export interface CrosswordClueInput {
  word: string;
  clue: string;
}

/**
 * Default starting clues when a developer or user adds a new crossword page.
 */
export const DEFAULT_CROSSWORD_INPUTS: CrosswordClueInput[] = [
  { word: "RUST", clue: "A systems programming language focused on safety and speed." },
  { word: "REACT", clue: "A popular frontend library created by Meta." },
  { word: "TAURI", clue: "Desktop app framework written in Rust." },
  { word: "VITE", clue: "A modern, fast frontend build tool." },
  { word: "CODE", clue: "Instructions written for a computer to execute." },
  { word: "OPEN", clue: "Opposite of closed, as in source." }
];

/**
 * Validates whether a word can be placed in a grid at the specified coordinates and direction
 * without violating crossword grid layout conventions (no boundary clashes, no side-by-side adjacencies, etc.).
 */
function validatePlacement(
  word: string,
  row: number,
  col: number,
  direction: "across" | "down",
  grid: (string | null)[][],
  width: number,
  height: number,
  isFirst: boolean
): { isValid: boolean; intersections: number } {
  // 1. Boundary checks
  if (row < 0 || col < 0) return { isValid: false, intersections: 0 };
  if (direction === "across") {
    if (col + word.length > width) return { isValid: false, intersections: 0 };
  } else {
    if (row + word.length > height) return { isValid: false, intersections: 0 };
  }

  // 2. Grid cell immediately BEFORE the word must be empty
  const beforeRow = row - (direction === "down" ? 1 : 0);
  const beforeCol = col - (direction === "across" ? 1 : 0);
  if (beforeRow >= 0 && beforeRow < height && beforeCol >= 0 && beforeCol < width) {
    if (grid[beforeRow][beforeCol] !== null) return { isValid: false, intersections: 0 };
  }

  // 3. Grid cell immediately AFTER the word must be empty
  const afterRow = row + (direction === "down" ? word.length : 0);
  const afterCol = col + (direction === "across" ? word.length : 0);
  if (afterRow >= 0 && afterRow < height && afterCol >= 0 && afterCol < width) {
    if (grid[afterRow][afterCol] !== null) return { isValid: false, intersections: 0 };
  }

  // 4. Validate character matches and adjacent grid cells
  let intersections = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + (direction === "down" ? i : 0);
    const c = col + (direction === "across" ? i : 0);
    const cellValue = grid[r][c];

    if (cellValue !== null) {
      // Cell already contains a letter - it must match the word's letter at this index
      if (cellValue !== word[i]) {
        return { isValid: false, intersections: 0 };
      }
      intersections++;
    } else {
      // Cell is empty - check side cells to prevent parallel lines of letters touching
      if (direction === "across") {
        if (r - 1 >= 0 && grid[r - 1][c] !== null) return { isValid: false, intersections: 0 };
        if (r + 1 < height && grid[r + 1][c] !== null) return { isValid: false, intersections: 0 };
      } else {
        if (c - 1 >= 0 && grid[r][c - 1] !== null) return { isValid: false, intersections: 0 };
        if (c + 1 < width && grid[r][c + 1] !== null) return { isValid: false, intersections: 0 };
      }
    }
  }

  // If this is not the first word, it must connect with at least one placed word
  if (!isFirst && intersections === 0) {
    return { isValid: false, intersections: 0 };
  }

  return { isValid: true, intersections };
}

interface PlacedWord {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

/**
 * Dynamic crossword layout compiler.
 * Automatically arranges word/clue pairs into an intersecting grid.
 */
export function layoutCrossword(
  cluesInput: CrosswordClueInput[],
  width: number,
  height: number
) {
  // Normalize and clean inputs: uppercase and filter out non-alphabetic pairs
  const sanitizedInput = cluesInput
    .map(c => ({
      word: c.word.trim().toUpperCase().replace(/[^A-Z]/g, ""),
      clue: c.clue.trim()
    }))
    .filter(c => c.word.length > 1 && c.clue.length > 0);

  // Sort words by length descending
  const sortedInput = [...sanitizedInput].sort((a, b) => b.word.length - a.word.length);

  const grid: (string | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));
  const placedWords: PlacedWord[] = [];
  const unplacedWords: CrosswordClueInput[] = [];

  if (sortedInput.length === 0) {
    return {
      grid: grid.map(row => row.map(() => "#")),
      solution: grid.map(row => row.map(() => "#")),
      clues: [] as CrosswordClue[],
      unplaced: [] as CrosswordClueInput[]
    };
  }

  // 1. Place the longest word in the middle to anchor the crossword grid
  const firstItem = sortedInput[0];
  const midRow = Math.floor(height / 2);
  const midCol = Math.max(0, Math.floor((width - firstItem.word.length) / 2));

  // Verify it fits inside the grid dimensions
  if (firstItem.word.length <= width) {
    for (let i = 0; i < firstItem.word.length; i++) {
      grid[midRow][midCol + i] = firstItem.word[i];
    }
    placedWords.push({
      word: firstItem.word,
      clue: firstItem.clue,
      row: midRow,
      col: midCol,
      direction: "across"
    });
  } else {
    unplacedWords.push(firstItem);
  }

  // 2. Iterate through the remaining words and find optimal intersections
  for (let i = 1; i < sortedInput.length; i++) {
    const item = sortedInput[i];
    let bestPlacement: PlacedWord | null = null;
    let maxIntersections = -1;

    // Scan grid cells to look for matching letters
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const gridChar = grid[r][c];
        if (gridChar === null) continue;

        // Check if the current grid letter exists in the candidate word
        let matchIdx = item.word.indexOf(gridChar);
        while (matchIdx !== -1) {
          // Check placement in "across" orientation
          const acrossRow = r;
          const acrossCol = c - matchIdx;
          const acrossCheck = validatePlacement(item.word, acrossRow, acrossCol, "across", grid, width, height, false);
          if (acrossCheck.isValid && acrossCheck.intersections > maxIntersections) {
            maxIntersections = acrossCheck.intersections;
            bestPlacement = {
              word: item.word,
              clue: item.clue,
              row: acrossRow,
              col: acrossCol,
              direction: "across"
            };
          }

          // Check placement in "down" orientation
          const downRow = r - matchIdx;
          const downCol = c;
          const downCheck = validatePlacement(item.word, downRow, downCol, "down", grid, width, height, false);
          if (downCheck.isValid && downCheck.intersections > maxIntersections) {
            maxIntersections = downCheck.intersections;
            bestPlacement = {
              word: item.word,
              clue: item.clue,
              row: downRow,
              col: downCol,
              direction: "down"
            };
          }

          // Search for another index of the letter in the word to explore all intersection routes
          matchIdx = item.word.indexOf(gridChar, matchIdx + 1);
        }
      }
    }

    // Place the word at the location yielding the most intersections
    if (bestPlacement) {
      const { word, row, col, direction } = bestPlacement;
      for (let charIdx = 0; charIdx < word.length; charIdx++) {
        const r = row + (direction === "down" ? charIdx : 0);
        const c = col + (direction === "across" ? charIdx : 0);
        grid[r][c] = word[charIdx];
      }
      placedWords.push(bestPlacement);
    } else {
      unplacedWords.push(item);
    }
  }

  // 3. sweep grid from top-left to bottom-right to assign starting clue numbers
  const clueNumbers: (number | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));
  const coordinateToNumber = new Map<string, number>();
  let currentClueNumber = 1;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] === null) continue;

      const startsAcross = placedWords.some(w => w.row === r && w.col === c && w.direction === "across");
      const startsDown = placedWords.some(w => w.row === r && w.col === c && w.direction === "down");

      if (startsAcross || startsDown) {
        clueNumbers[r][c] = currentClueNumber;
        coordinateToNumber.set(`${r}-${c}`, currentClueNumber);
        currentClueNumber++;
      }
    }
  }

  // 4. Construct final CrosswordClue output objects
  const finalClues: CrosswordClue[] = placedWords.map(w => {
    const num = coordinateToNumber.get(`${w.row}-${w.col}`)!;
    return {
      id: `${num}${w.direction === "across" ? "a" : "d"}`,
      number: num,
      direction: w.direction,
      row: w.row,
      col: w.col,
      clue: w.clue,
      answer: w.word
    };
  });

  // Sort clues by clue number
  finalClues.sort((a, b) => a.number - b.number);

  // 5. Build start grid and solved solution grid
  // Black blocks are marked as "#"
  const puzzleGrid: (string | null)[][] = Array.from({ length: height }, () => Array(width).fill("#"));
  const solutionGrid: string[][] = Array.from({ length: height }, () => Array(width).fill("#"));

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] !== null) {
        puzzleGrid[r][c] = "";
        solutionGrid[r][c] = grid[r][c]!;
      }
    }
  }

  return {
    grid: puzzleGrid,
    solution: solutionGrid,
    clues: finalClues,
    unplaced: unplacedWords
  };
}
