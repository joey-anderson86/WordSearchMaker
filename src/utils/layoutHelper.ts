import { PageState } from "../types/generated/PageState";
import { PuzzlePayload } from "../types/generated/PuzzlePayload";
import { GridElement } from "../types/generated/GridElement";
import { getPageDimensions } from "../types/pageSizes";

/**
 * Get KDP compliant margins based on page count
 */
export function getKdpMargins(pageCount: number = 100) {
  let insideGutter = 27; // <= 150 pages: 0.375"
  if (pageCount > 150 && pageCount <= 300) insideGutter = 36; // 0.5"
  else if (pageCount > 300 && pageCount <= 500) insideGutter = 45; // 0.625"
  else if (pageCount > 500) insideGutter = 54; // 0.75"

  return {
    top: 36,      // 0.5"
    bottom: 36,   // 0.5"
    outside: 36,  // 0.5"
    inside: insideGutter + 18, // Gutter + 0.25" safe area
  };
}

/**
 * Creates the default PageState layout for a newly generated puzzle.
 */
export function createDefaultPageState(
  puzzle: PuzzlePayload, 
  pageSize: string, 
  defaultMargins: { top: number; bottom: number; inside: number; outside: number },
  defaultGridSnapSize: number
): PageState {
  const dims = getPageDimensions(pageSize);
  const isSudoku = puzzle.specificData.type === "Sudoku";
  const isCrossword = puzzle.specificData.type === "Crossword";

  const safeWidth = dims.width - defaultMargins.inside - defaultMargins.outside;

  const gridLayout: GridElement[] = [
    // 1. Title Element
    {
      id: "title",
      type: "title",
      x: defaultMargins.inside,
      y: defaultMargins.top,
      width: safeWidth,
      height: 45,
      zIndex: 10,
      content: {
        text: puzzle.title,
        fontFamily: puzzle.titleFont || "Modern Sans",
        fontSize: 28,
        color: "#0f172a",
        align: "left",
        letterSpacing: 0,
        themeAccents: puzzle.themeAccents ?? false,
      }
    },
    // 2. Grid Element
    {
      id: "grid",
      type: "grid",
      x: defaultMargins.inside,
      y: defaultMargins.top + 65,
      width: safeWidth,
      height: isSudoku ? 360 : isCrossword ? 320 : 360,
      zIndex: 10,
      content: {
        gridFont: puzzle.gridFont || "Modern Sans",
        cellBorders: puzzle.cellBorders ?? false,
        ideTheme: puzzle.ideTheme ?? false,
        letterTracking: puzzle.letterTracking ?? 0,
        solutionStyle: puzzle.solutionStyle || "Greyscale Mute",
        color: "#1e293b",
      }
    }
  ];

  // 3. Word Bank or Clues Element
  if (isSudoku) {
    gridLayout.push({
      id: "wordbank",
      type: "wordbank",
      x: defaultMargins.inside,
      y: defaultMargins.top + 445,
      width: safeWidth,
      height: 120,
      zIndex: 10,
      content: {
        columns: 3,
        selectorStyle: "Clean Text (No Bullets)",
        fontSize: 9,
        color: "#475569",
        fontFamily: puzzle.titleFont || "Modern Sans",
      }
    });
  } else if (isCrossword) {
    gridLayout.push({
      id: "wordbank",
      type: "wordbank",
      x: defaultMargins.inside,
      y: defaultMargins.top + 410,
      width: safeWidth,
      height: 200,
      zIndex: 10,
      content: {
        columns: 2,
        selectorStyle: "Clean Text (No Bullets)",
        fontSize: 9,
        color: "#475569",
        fontFamily: puzzle.titleFont || "Modern Sans",
      }
    });
  } else {
    // Word Search
    gridLayout.push({
      id: "wordbank",
      type: "wordbank",
      x: defaultMargins.inside,
      y: defaultMargins.top + 455,
      width: safeWidth,
      height: 180,
      zIndex: 10,
      content: {
        columns: puzzle.wordBankColumns || 3,
        selectorStyle: puzzle.selectorStyle || "Clean Text (No Bullets)",
        fontSize: 10,
        color: "#475569",
        fontFamily: puzzle.titleFont || "Modern Sans",
      }
    });
  }

  return {
    id: puzzle.id,
    title: puzzle.title,
    gridLayout,
    artLayers: [],
    fontProperties: {
      titleFont: puzzle.titleFont || "Modern Sans",
      gridFont: puzzle.gridFont || "Modern Sans",
      titleSize: 28,
      gridSize: 14,
      color: "#1e293b",
    },
    metadata: puzzle,
    backgroundColor: "#ffffff",
    themeColor: "#4f46e5",
    margin: defaultMargins,
    gridSnapSize: defaultGridSnapSize,
    showMargins: true
  };
}

/**
 * Scale the coordinates and dimensions of layout elements relatively when shifting page size.
 */
export function scalePageLayout(page: PageState, oldSize: string, newSize: string): PageState {
  const oldDims = getPageDimensions(oldSize);
  const newDims = getPageDimensions(newSize);

  const scaleX = newDims.width / oldDims.width;
  const scaleY = newDims.height / oldDims.height;

  const scaledLayout = page.gridLayout.map(el => ({
    ...el,
    x: Math.round(el.x * scaleX * 100) / 100,
    y: Math.round(el.y * scaleY * 100) / 100,
    width: Math.round(el.width * scaleX * 100) / 100,
    height: Math.round(el.height * scaleY * 100) / 100,
  }));

  const scaledArt = page.artLayers.map(l => ({
    ...l,
    x: Math.round(l.x * scaleX * 100) / 100,
    y: Math.round(l.y * scaleY * 100) / 100,
    width: Math.round(l.width * scaleX * 100) / 100,
    height: Math.round(l.height * scaleY * 100) / 100,
  }));

  const scaledMargin = page.margin ? {
    top: Math.round(page.margin.top * scaleY * 100) / 100,
    bottom: Math.round(page.margin.bottom * scaleY * 100) / 100,
    inside: Math.round(page.margin.inside * scaleX * 100) / 100,
    outside: Math.round(page.margin.outside * scaleX * 100) / 100,
  } : undefined;

  return {
    ...page,
    gridLayout: scaledLayout,
    artLayers: scaledArt,
    margin: scaledMargin
  };
}
