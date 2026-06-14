import { PageState } from "../types/generated/PageState";
import { PuzzlePayload } from "../types/generated/PuzzlePayload";
import { GridElement } from "../types/generated/GridElement";
import { getPageDimensions, KDP_PAPER_THICKNESS, KDP_COVER_BLEED } from "../types/pageSizes";

/**
 * Chunk an array into smaller arrays of a specified size.
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

/**
 * Enforce Large Print KDP requirements.
 * Large Print requires a minimum font size of 16pt.
 */
export function enforceLargePrint(
  isLargePrint: boolean,
  elementFontSize?: number,
  elementCellSize?: number
): { fontSize: number; cellSize: number } {
  const minFontSize = 16;
  const fontRatio = 0.6;
  const minCellSize = Math.ceil(minFontSize / fontRatio); // 27

  let finalFontSize = elementFontSize || 10;
  let finalCellSize = elementCellSize || 10;

  if (isLargePrint) {
    finalFontSize = Math.max(finalFontSize, minFontSize);
    finalCellSize = Math.max(finalCellSize, minCellSize);
  }

  return { fontSize: finalFontSize, cellSize: finalCellSize };
}

/**
 * Creates a text block page for front or back matter.
 */
export function createTextBlockPage(title: string, textContent: string, _pageSize: string): PageState {
  
  // Use default margins for simple text blocks
  const margins = { top: 72, bottom: 72, inside: 72, outside: 72 };

  return {
    id: crypto.randomUUID(),
    title,
    pageType: "TEXT_BLOCK",
    textContent,
    gridLayout: [],
    artLayers: [],
    fontProperties: {
      titleFont: "Modern Sans",
      gridFont: "Modern Sans",
      titleSize: 28,
      gridSize: 14,
      color: "#1e293b",
    },
    metadata: {
      id: crypto.randomUUID(),
      title,
      grid: [],
      specific_data: { type: "WordSearch", data: { word_bank: [], unplaced_words: [], solutions: [] } }
    } as any,
    backgroundColor: "#ffffff",
    themeColor: "#4f46e5",
    margin: margins,
    gridSnapSize: 10,
    showMargins: false
  };
}

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

/**
 * Calculate the exact Cover dimensions (Back + Spine + Front) for KDP.
 * Measurements are converted from inches to points (1 inch = 72 pt) for PDF rendering.
 */
export function calculateCoverDimensions(
  trimWidth: number, // in inches
  trimHeight: number, // in inches
  pageCount: number,
  paperType: "white" | "cream" = "white"
) {
  const thickness = KDP_PAPER_THICKNESS[paperType];
  const spineWidthInches = Math.max(pageCount * thickness, 0.1); // min spine width
  
  // Total Width = Bleed + BackCover + Spine + FrontCover + Bleed
  const totalWidthInches = KDP_COVER_BLEED + trimWidth + spineWidthInches + trimWidth + KDP_COVER_BLEED;
  // Total Height = Bleed + TrimHeight + Bleed
  const totalHeightInches = KDP_COVER_BLEED + trimHeight + KDP_COVER_BLEED;

  const PTS_PER_INCH = 72;

  return {
    totalWidthPt: totalWidthInches * PTS_PER_INCH,
    totalHeightPt: totalHeightInches * PTS_PER_INCH,
    spineWidthPt: spineWidthInches * PTS_PER_INCH,
    trimWidthPt: trimWidth * PTS_PER_INCH,
    trimHeightPt: trimHeight * PTS_PER_INCH,
    bleedPt: KDP_COVER_BLEED * PTS_PER_INCH,
  };
}
