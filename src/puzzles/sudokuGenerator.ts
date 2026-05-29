/**
 * Base valid Sudoku solution to derive all variations from.
 * Uses a fully solved valid Sudoku grid as seed.
 */
const BASE_SOLUTION = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

/**
 * Maps the difficulty levels to target numbers of visible starting cells (clues).
 * Traditional Sudokus have between 17 and 40 clues:
 * - Easy: ~40 clues
 * - Medium: ~32 clues
 * - Hard: ~26 clues
 * - Expert: ~21 clues
 */
const DIFFICULTY_CLUES = {
  easy: 40,
  medium: 32,
  hard: 26,
  expert: 21
};

export type SudokuDifficulty = "easy" | "medium" | "hard" | "expert";

/**
 * Generates a valid randomized 9x9 Sudoku board and its complete solution.
 * Applies digit mappings and structural transformations (row/column permutations)
 * to ensure that every generated puzzle feels unique while remaining mathematically correct.
 */
export function generateSudoku(difficulty: SudokuDifficulty) {
  // 1. Generate a random digit mapping (shuffle numbers 1-9)
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }

  // Helper to map values using the shuffled digits
  const mapDigit = (val: number) => digits[val - 1];

  let solution = BASE_SOLUTION.map(row => row.map(mapDigit));

  // 2. Perform row permutations within each 3-row block (keeps Sudoku constraints valid)
  const permuteRowsWithinBlocks = (grid: number[][]) => {
    const result = grid.map(row => [...row]);
    for (let block = 0; block < 3; block++) {
      // Get the 3 row indices in this block
      const rows = [0, 1, 2].map(r => r + block * 3);
      // Shuffle row indices
      for (let i = 2; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[rows[i]];
        result[rows[i]] = result[rows[j]];
        result[rows[j]] = temp;
      }
    }
    return result;
  };

  solution = permuteRowsWithinBlocks(solution);

  // Helper to transpose matrix
  const transpose = (grid: number[][]) => {
    return grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
  };

  // 3. Perform column permutations (by transposing, shuffling rows in block, transposing back)
  solution = transpose(solution);
  solution = permuteRowsWithinBlocks(solution);
  solution = transpose(solution);

  // 4. Create the starting grid by masking cells based on difficulty
  const clueCount = DIFFICULTY_CLUES[difficulty];
  const totalCells = 81;
  const cellIndices = Array.from({ length: totalCells }, (_, i) => i);

  // Fisher-Yates shuffle of grid cell indices
  for (let i = cellIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
  }

  // Selection of clue cell positions to keep visible
  const visibleIndices = new Set(cellIndices.slice(0, clueCount));

  // Build the masked starting board (null represents empty cells)
  const grid: (number | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const index = r * 9 + c;
      if (visibleIndices.has(index)) {
        grid[r][c] = solution[r][c];
      }
    }
  }

  return {
    grid,
    solution
  };
}
