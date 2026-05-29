import {
  PuzzlePayload,
  PuzzleType,
  GridValuePayload,
  NodeGraphPayload,
  RelationalPayload
} from "./types";

/**
 * Interface representing a component or controller that handles a specific category of puzzles.
 * This structure separates rendering/validation concerns from the main routing coordinator.
 */
export interface PuzzleHandler<T extends PuzzlePayload> {
  /**
   * Mock rendering function that takes the specific puzzle payload and returns a string layout representation.
   * In a production application, this might return a JSX.Element, a canvas reference, or a WebGL context.
   */
  render(payload: T): string;

  /**
   * Future hook for validating a puzzle's current state against its solution or rules.
   */
  validate?(payload: T): boolean;

  /**
   * Future hook for solving the puzzle programmatically.
   */
  solve?(payload: T): T;
}

/**
 * Concrete handler for Grid-based puzzles (Sudoku, Hitori, Crossword, Nurikabe).
 */
export class GridPuzzleHandler implements PuzzleHandler<GridValuePayload> {
  render(payload: GridValuePayload): string {
    const { id, title, type, difficulty, grid } = payload;
    
    let output = `--- [${type}] "${title}" (ID: ${id}, Diff: ${difficulty}) ---\n`;
    output += `Grid dimensions: ${grid.length}x${grid[0]?.length || 0}\n`;
    
    const visualGrid = grid
      .map(row => row.map(cell => (cell === null ? "." : cell)).join(" | "))
      .join("\n");
      
    output += visualGrid + "\n";
    return output;
  }

  validate(payload: GridValuePayload): boolean {
    console.log(`Validating grid puzzle: ${payload.id}`);
    return true;
  }
}

/**
 * Concrete handler for Graph/Node-based puzzles (Hashi, Masyu).
 */
export class GraphPuzzleHandler implements PuzzleHandler<NodeGraphPayload> {
  render(payload: NodeGraphPayload): string {
    const { id, title, type, difficulty, nodes, edges = [] } = payload;
    
    let output = `--- [${type}] "${title}" (ID: ${id}, Diff: ${difficulty}) ---\n`;
    output += `Nodes count: ${nodes.length}, Predefined Edges count: ${edges.length}\n`;
    
    output += "Nodes:\n";
    nodes.forEach(n => {
      output += `  * Node ${n.id} at (${n.position.x}, ${n.position.y})` + (n.value !== undefined ? ` [Value/Req: ${n.value}]` : "") + "\n";
    });
    
    if (edges.length > 0) {
      output += "Edges:\n";
      edges.forEach(e => {
        output += `  - Bridge ${e.id}: ${e.sourceNodeId} <-> ${e.targetNodeId}` + (e.weight ? ` (x${e.weight})` : "") + "\n";
      });
    }
    
    return output;
  }

  validate(payload: NodeGraphPayload): boolean {
    console.log(`Validating graph puzzle: ${payload.id}`);
    return true;
  }
}

/**
 * Concrete handler for Relational/Comparison-based puzzles (Futoshiki).
 */
export class RelationalPuzzleHandler implements PuzzleHandler<RelationalPayload> {
  render(payload: RelationalPayload): string {
    const { id, title, type, difficulty, grid, constraints } = payload;
    
    let output = `--- [${type}] "${title}" (ID: ${id}, Diff: ${difficulty}) ---\n`;
    output += `Grid dimensions: ${grid.length}x${grid[0]?.length || 0}\n`;
    output += `Active Constraints: ${constraints.length}\n`;
    
    output += "Constraints List:\n";
    constraints.forEach((c, idx) => {
      const opSign = c.operator === "less_than" ? "<" : ">";
      output += `  [${idx}] Cell (${c.sourceCell.row},${c.sourceCell.col}) ${opSign} Cell (${c.targetCell.row},${c.targetCell.col})\n`;
    });
    
    return output;
  }

  validate(payload: RelationalPayload): boolean {
    console.log(`Validating relational puzzle: ${payload.id}`);
    return true;
  }
}

/**
 * The core coordinator class that manages the routing and rendering of puzzles.
 * It is built for extensibility: new puzzle types and handlers can be registered dynamically
 * without altering the main router logic, satisfying the Open-Closed Principle.
 */
export class PuzzleManager {
  // A dynamic registry of puzzle handlers indexed by PuzzleType.
  private registry = new Map<PuzzleType, PuzzleHandler<any>>();

  constructor() {
    // Register the default handlers scaffolded above
    this.registerDefaultHandlers();
  }

  /**
   * Registers a new handler for a given puzzle type.
   * Allows third-party developers or future modules to inject new puzzle types seamlessly.
   */
  public registerHandler<T extends PuzzlePayload>(
    type: PuzzleType,
    handler: PuzzleHandler<T>
  ): void {
    this.registry.set(type, handler);
  }

  /**
   * Retrieves the handler registered for a specific puzzle type.
   */
  public getHandler<T extends PuzzlePayload>(type: PuzzleType): PuzzleHandler<T> | undefined {
    return this.registry.get(type) as PuzzleHandler<T> | undefined;
  }

  /**
   * Main routing function. Reads the discriminator ('type') of the payload,
   * resolves the correct handler from the registry, and delegates rendering.
   */
  public render(payload: PuzzlePayload): string {
    const handler = this.getHandler(payload.type);
    if (!handler) {
      throw new Error(`No registered handler found for puzzle type: ${payload.type}`);
    }

    // Delegate rendering to the mapped handler
    return handler.render(payload);
  }

  /**
   * Dynamic factory method that routes validating tasks.
   */
  public validate(payload: PuzzlePayload): boolean {
    const handler = this.getHandler(payload.type);
    if (!handler || !handler.validate) {
      console.warn(`Validation logic not implemented for type: ${payload.type}`);
      return false;
    }
    return handler.validate(payload);
  }

  /**
   * Populates the registry with standard puzzle handlers.
   */
  private registerDefaultHandlers(): void {
    const gridHandler = new GridPuzzleHandler();
    
    // Register the grid handler for all grid-based puzzle types
    this.registerHandler(PuzzleType.SUDOKU, gridHandler);
    this.registerHandler(PuzzleType.HITORI, gridHandler);
    this.registerHandler(PuzzleType.CROSSWORD, gridHandler);
    this.registerHandler(PuzzleType.NURIKABE, gridHandler);

    // Register graph handlers
    const graphHandler = new GraphPuzzleHandler();
    this.registerHandler(PuzzleType.HASHI, graphHandler);
    this.registerHandler(PuzzleType.MASYU, graphHandler);

    // Register relational handlers
    this.registerHandler(PuzzleType.FUTOSHIKI, new RelationalPuzzleHandler());
  }

  /**
   * Compile-time exhaustiveness check helper.
   * If a developer adds a new puzzle type to the `PuzzleType` enum but fails to handle
   * it in static switch-case routing (if static routing is used), this method helps enforce it.
   */
  public assertUnreachable(x: never): never {
    throw new Error(`Unhandled puzzle union member: ${JSON.stringify(x)}`);
  }

  /**
   * Alternative static router demonstrating discriminated union narrowing.
   * This is useful when the developer wants static guarantees and exhaustiveness checks
   * via TypeScript, rather than runtime registry mapping.
   */
  public staticStaticRender(payload: PuzzlePayload): string {
    switch (payload.type) {
      case PuzzleType.SUDOKU:
      case PuzzleType.HITORI:
      case PuzzleType.CROSSWORD:
      case PuzzleType.NURIKABE:
        // TypeScript narrows 'payload' to 'GridValuePayload' inside this block
        return new GridPuzzleHandler().render(payload);

      case PuzzleType.HASHI:
      case PuzzleType.MASYU:
        // TypeScript narrows 'payload' to 'NodeGraphPayload' inside this block
        return new GraphPuzzleHandler().render(payload);

      case PuzzleType.FUTOSHIKI:
        // TypeScript narrows 'payload' to 'RelationalPayload' inside this block
        return new RelationalPuzzleHandler().render(payload);

      default:
        // If a new puzzle type is added to PuzzleType enum but not to the union or switch,
        // TypeScript will flag a compile error here because the type of 'payload' has not been fully exhausted.
        return this.assertUnreachable(payload);
    }
  }
}
