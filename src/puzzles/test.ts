import { PuzzleType, GridValuePayload, NodeGraphPayload, RelationalPayload, PuzzlePayload } from "./types";
import { PuzzleManager } from "./manager";

// Create instances of each puzzle payload type to verify types and functionality.

const sudokuPuzzle: GridValuePayload = {
  id: "sudoku-1",
  type: PuzzleType.SUDOKU,
  title: "Simple 4x4 Sudoku",
  difficulty: "easy",
  dimensions: { rows: 4, cols: 4 },
  grid: [
    [1, null, 3, null],
    [null, 2, null, 4],
    [3, null, 1, null],
    [null, 4, null, 2]
  ]
};

const hashiPuzzle: NodeGraphPayload = {
  id: "hashi-1",
  type: PuzzleType.HASHI,
  title: "Hashi Island Connector",
  difficulty: "medium",
  dimensions: { rows: 5, cols: 5 },
  nodes: [
    { id: "island-a", position: { x: 0, y: 0 }, value: 2 },
    { id: "island-b", position: { x: 0, y: 4 }, value: 2 },
    { id: "island-c", position: { x: 4, y: 0 }, value: 4 },
    { id: "island-d", position: { x: 4, y: 4 }, value: 2 }
  ],
  edges: [
    { id: "bridge-ab", sourceNodeId: "island-a", targetNodeId: "island-b", weight: 1 },
    { id: "bridge-ac", sourceNodeId: "island-a", targetNodeId: "island-c", weight: 1 }
  ]
};

const futoshikiPuzzle: RelationalPayload = {
  id: "futoshiki-1",
  type: PuzzleType.FUTOSHIKI,
  title: "Futoshiki 4x4",
  difficulty: "hard",
  dimensions: { rows: 4, cols: 4 },
  grid: [
    [null, null, 2, null],
    [null, null, null, null],
    [null, 1, null, null],
    [null, null, null, 4]
  ],
  constraints: [
    {
      sourceCell: { row: 0, col: 0 },
      targetCell: { row: 0, col: 1 },
      operator: "less_than"
    },
    {
      sourceCell: { row: 1, col: 2 },
      targetCell: { row: 2, col: 2 },
      operator: "greater_than"
    }
  ]
};

function runVerification() {
  console.log("=== Initiating Puzzle Framework Verification ===");
  const manager = new PuzzleManager();

  const puzzles: PuzzlePayload[] = [sudokuPuzzle, hashiPuzzle, futoshikiPuzzle];

  puzzles.forEach(puzzle => {
    console.log(`\n--- Verification for Puzzle ID: ${puzzle.id} ---`);
    
    // 1. Verify registry-based dynamic routing
    console.log("Dynamic Registry Rendering Output:");
    const dynamicOutput = manager.render(puzzle);
    console.log(dynamicOutput);

    // 2. Verify static-narrowing routing
    console.log("Static Type-Narrowed Rendering Output:");
    const staticOutput = manager.staticStaticRender(puzzle);
    console.log(staticOutput);

    // 3. Verify validation router
    const isValid = manager.validate(puzzle);
    console.log(`Validation result: ${isValid}`);
  });

  console.log("\n=== Verification Completed Successfully ===");
}

runVerification();
