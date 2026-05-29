# Extensible Puzzle Framework Scaffolding

This directory contains the scaffolding for a highly extensible, strictly-typed puzzle application. The design separates puzzle metadata and data schemas from rendering and validation processes, using TypeScript discriminated unions and a dynamic registry pattern.

## Directory Structure

- [`types.ts`](file:///Users/josephanderson/Documents/Documents%20-%20Joseph’s%20MacBook%20Pro/WordSearchMaker/src/puzzles/types.ts): Contains core schemas, enums, payload interfaces, and union types.
- [`manager.ts`](file:///Users/josephanderson/Documents/Documents%20-%20Joseph’s%20MacBook%20Pro/WordSearchMaker/src/puzzles/manager.ts): Houses the router class (`PuzzleManager`) and the base `PuzzleHandler` interface.
- [`test.ts`](file:///Users/josephanderson/Documents/Documents%20-%20Joseph’s%20MacBook%20Pro/WordSearchMaker/src/puzzles/test.ts): Script to verify implementation, correct type inference, and dynamic rendering.

---

## Architectural Pattern

This system is built using three key architectural patterns:
1. **Discriminated Union Schema (`PuzzlePayload`)**: Keeps payload definition type-safe. By reading the `type` property, the TypeScript compiler automatically narrows the payload interface, preventing access to fields that do not exist on that puzzle type.
2. **Registry/Factory Pattern (`PuzzleManager`)**: Facilitates dynamic extension. New puzzle types can register their handlers at runtime, avoiding the need to modify core router logic (Open-Closed Principle).
3. **Exhaustive Switch-Case Control**: A static alternative that enforces compile-time checks, ensuring that developers are forced by the compiler to address newly added puzzle types.

---

## How to Add a New Puzzle Type

Suppose you want to add support for a topological **Map Coloring** puzzle. Here is the step-by-step guide to doing so without rewriting or altering the core application engine.

### Step 1: Update the `PuzzleType` Enum
Open [`types.ts`](file:///Users/josephanderson/Documents/Documents%20-%20Joseph’s%20MacBook%20Pro/WordSearchMaker/src/puzzles/types.ts) and add the new puzzle key:

```typescript
export enum PuzzleType {
  // ... existing types
  MAP_COLORING = "MAP_COLORING"
}
```

### Step 2: Define the New Puzzle Payload Interface
In [`types.ts`](file:///Users/josephanderson/Documents/Documents%20-%20Joseph’s%20MacBook%20Pro/WordSearchMaker/src/puzzles/types.ts), extend `BasePuzzlePayload` to capture the unique requirements of the Map Coloring puzzle:

```typescript
export interface Region {
  id: string;
  adjacentRegionIds: string[];
}

export interface MapColoringPayload extends BasePuzzlePayload {
  type: PuzzleType.MAP_COLORING;
  /** The regions that make up the map */
  regions: Region[];
  /** The set of colors allowed for coloring */
  availableColors: string[];
  /** Pre-colored regions (optional) */
  preColored?: Record<string, string>;
}
```

### Step 3: Add to the Discriminated Union
Add the new payload interface to the `PuzzlePayload` union at the bottom of [`types.ts`](file:///Users/josephanderson/Documents/Documents%20-%20Joseph’s%20MacBook%20Pro/WordSearchMaker/src/puzzles/types.ts):

```typescript
export type PuzzlePayload =
  | GridValuePayload
  | NodeGraphPayload
  | RelationalPayload
  | MapColoringPayload; // <-- Add your new payload here
```

### Step 4: Implement a Concrete `PuzzleHandler`
Create a new handler class in your feature module or inside [`manager.ts`](file:///Users/josephanderson/Documents/Documents%20-%20Joseph’s%20MacBook%20Pro/WordSearchMaker/src/puzzles/manager.ts):

```typescript
import { MapColoringPayload } from "./types";
import { PuzzleHandler } from "./manager";

export class MapColoringHandler implements PuzzleHandler<MapColoringPayload> {
  render(payload: MapColoringPayload): string {
    const { id, title, regions, availableColors } = payload;
    let output = `--- [MAP_COLORING] "${title}" (ID: ${id}) ---\n`;
    output += `Regions count: ${regions.length}\n`;
    output += `Available colors: ${availableColors.join(", ")}\n`;
    return output;
  }

  validate(payload: MapColoringPayload): boolean {
    // Implement regional adjacency color checks here
    return true;
  }
}
```

### Step 5: Register the Handler with `PuzzleManager`
You can register the new handler dynamically at runtime anywhere you instantiate the manager:

```typescript
import { PuzzleManager } from "./manager";
import { PuzzleType } from "./types";
import { MapColoringHandler } from "./MapColoringHandler";

const manager = new PuzzleManager();
manager.registerHandler(PuzzleType.MAP_COLORING, new MapColoringHandler());
```

Or you can add it to the default constructors within the manager itself if it should be built-in.

*Note: If you are using the static method `staticStaticRender`, TypeScript will throw a compilation error at `assertUnreachable` until you add a case block for `PuzzleType.MAP_COLORING` to exhaust the compiler check.*
