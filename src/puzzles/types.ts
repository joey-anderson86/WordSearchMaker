/**
 * Enum defining standard puzzle types supported by the system.
 * Categorized by their structural layout and mathematical properties.
 */
export enum PuzzleType {
  // Grid-based puzzles (typically 2D arrays of values/characters/cell states)
  SUDOKU = "SUDOKU",
  HITORI = "HITORI",
  CROSSWORD = "CROSSWORD",
  NURIKABE = "NURIKABE",

  // Graph/Node-based puzzles (nodes placed on a field with connecting lines/bridges)
  HASHI = "HASHI",
  MASYU = "MASYU",

  // Relational/Comparison-based puzzles (grid cells with explicit mathematical constraints between them)
  FUTOSHIKI = "FUTOSHIKI"
}

/**
 * Common difficulty ratings for puzzles.
 */
export type Difficulty = "easy" | "medium" | "hard" | "expert";

/**
 * Dimensions interface for grid/coordinate bounds.
 */
export interface GridDimensions {
  rows: number;
  cols: number;
}

/**
 * Base interface that every puzzle payload must implement.
 * This contains metadata common to all puzzles.
 */
export interface BasePuzzlePayload {
  /** Unique identifier for this puzzle instance */
  id: string;
  /** The specific type of the puzzle, serving as the discriminator for union types */
  type: PuzzleType;
  /** Human-readable title of the puzzle */
  title: string;
  /** Difficulty rating */
  difficulty: Difficulty;
  /** Optional grid dimensions. Helpful for layout and coordinate boundaries. */
  dimensions?: GridDimensions;
}

/**
 * Payload interface for value-based grid puzzles like Sudoku, Hitori, Crossword, and Nurikabe.
 * A 2D array stores cell values, where null represents empty/unfilled slots.
 * Extends the BasePuzzlePayload with grid-specific properties.
 */
export interface GridValuePayload extends BasePuzzlePayload {
  /** Limit type discriminator to Grid-based Puzzle Types */
  type: PuzzleType.SUDOKU | PuzzleType.HITORI | PuzzleType.CROSSWORD | PuzzleType.NURIKABE;
  /** The starting grid configuration. Rows and columns match dimensions. */
  grid: (number | string | null)[][];
  /** Optional predefined solution grid */
  solution?: (number | string)[][];
}

/**
 * Node position in 2D coordinate space.
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * A node in a graph-based puzzle (e.g., a Hashi island or a Masyu circle).
 */
export interface GraphNode {
  id: string;
  position: NodePosition;
  /** Optional value requirement, e.g., number of bridges for Hashi, or color/state for Masyu */
  value?: number | string;
}

/**
 * An edge connecting two nodes in a graph-based puzzle (e.g., Hashi bridges).
 */
export interface GraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  /** Edge weight or multiplicity (e.g., single vs double bridge in Hashi) */
  weight?: number;
}

/**
 * Payload interface for graph/network-based puzzles like Hashi or Masyu.
 * Represents entities as vertices (nodes) and their relationships as edges.
 * Extends the BasePuzzlePayload with graph-specific properties.
 */
export interface NodeGraphPayload extends BasePuzzlePayload {
  /** Limit type discriminator to Graph-based Puzzle Types */
  type: PuzzleType.HASHI | PuzzleType.MASYU;
  /** Vertices/Points of interest on the puzzle board */
  nodes: GraphNode[];
  /** Connections/Bridges that are predefined or form the solution */
  edges?: GraphEdge[];
}

/**
 * Comparison operators for relational puzzles.
 */
export type RelationOperator = "less_than" | "greater_than";

/**
 * Defines a comparison constraint between two adjacent cells in a grid.
 */
export interface RelationalConstraint {
  /** Source cell coordinate */
  sourceCell: { row: number; col: number };
  /** Target cell coordinate */
  targetCell: { row: number; col: number };
  /** Constraint operator: e.g., sourceCell < targetCell */
  operator: RelationOperator;
}

/**
 * Payload interface for relational grid puzzles like Futoshiki.
 * Combines a standard values grid with explicit comparison/ordering constraints.
 * Extends the BasePuzzlePayload with relational-specific properties.
 */
export interface RelationalPayload extends BasePuzzlePayload {
  /** Limit type discriminator to Relational Puzzle Types */
  type: PuzzleType.FUTOSHIKI;
  /** Initial grid state (numbers or null for blank cells) */
  grid: (number | null)[][];
  /** Comparison constraints between adjacent cells */
  constraints: RelationalConstraint[];
}

/**
 * Discriminated union type representing any valid puzzle payload.
 * By querying the `type` property, TypeScript can narrow this union to
 * the specific payload type, allowing compile-time type-safe access to fields like
 * `grid`, `nodes`, and `constraints`.
 * 
 * To add a new puzzle category, define its payload interface, include it in this union,
 * and update the PuzzleType enum.
 */
export type PuzzlePayload =
  | GridValuePayload
  | NodeGraphPayload
  | RelationalPayload;
