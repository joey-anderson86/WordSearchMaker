import { Document, Page, View, Text, StyleSheet, Svg, Line } from "@react-pdf/renderer";
import { PuzzlePayload, WordSearchData } from "../store";

interface PdfDocumentProps {
  puzzles: PuzzlePayload<WordSearchData>[];
  pageSize: string;
  includeSolutions: boolean;
  isSinglePage?: boolean;
}

const getPageDimensions = (pageSize: string) => {
  if (pageSize.toUpperCase() === "LETTER") {
    return { width: 612.00, height: 792.00 };
  }
  return { width: 595.27, height: 841.89 }; // Default to A4
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 10,
    flexGrow: 1,
    justifyContent: 'center',
  },
  gridOuter: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 4,
    overflow: 'hidden',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
  cell: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  },
  cellText: {
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  wordBankContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
  },
  wordBankTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 3,
  },
  wordBankGrid: {
    display: 'flex',
    flexDirection: 'column',
  },
  wordBankRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 2,
  },
  wordBankCell: {
    flex: 1,
    paddingHorizontal: 2,
  },
  wordBankText: {
    fontSize: 8.5,
    color: '#475569',
    fontFamily: 'Helvetica',
  },
  unplacedContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 6,
  },
  unplacedTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#991b1b',
    marginBottom: 4,
  },
  unplacedGrid: {
    display: 'flex',
    flexDirection: 'column',
  },
  unplacedRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 2,
  },
  unplacedCell: {
    flex: 1,
    paddingHorizontal: 2,
  },
  unplacedText: {
    fontSize: 8,
    color: '#991b1b',
    fontFamily: 'Helvetica',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 0.5,
    borderTopColor: '#f1f5f9',
    paddingTop: 5,
  },
});

const renderPuzzlePage = (
  puzzle: PuzzlePayload<WordSearchData>,
  drawSolutions: boolean,
  pageSize: string
) => {
  const { title, grid, specific_data } = puzzle;
  const { word_bank, unplaced_words, solutions } = specific_data;

  const cols = grid[0]?.length || 0;
  const rows = grid.length || 0;

  const { width: pageWidth } = getPageDimensions(pageSize);

  // Spacing calculations to fit standard layouts comfortably
  const maxGridWidth = pageWidth - 80;
  const maxGridHeight = 360;
  const cellWidth = maxGridWidth / cols;
  const cellHeight = maxGridHeight / rows;
  const cellSize = Math.min(22, cellWidth, cellHeight);
  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

  // Placed words columns chunking
  const placedWords = word_bank.filter((w) => !unplaced_words.includes(w));
  const numCols = 4;
  const wordRows: string[][] = [];
  for (let i = 0; i < placedWords.length; i += numCols) {
    wordRows.push(placedWords.slice(i, i + numCols));
  }

  // Unplaced words columns chunking
  const unplacedRows: string[][] = [];
  for (let i = 0; i < unplaced_words.length; i += numCols) {
    unplacedRows.push(unplaced_words.slice(i, i + numCols));
  }

  return (
    <Page
      key={`${puzzle.id}-${drawSolutions ? "sol" : "puz"}`}
      size={pageSize.toUpperCase() as any}
      style={styles.page}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {drawSolutions ? `Solution: ${title}` : title}
          </Text>
          <Text style={styles.subtitle}>
            {cols} x {rows} Grid
          </Text>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridContainer}>
        <View style={[styles.gridOuter, { width: gridWidth, height: gridHeight }]}>
          {/* Solution Overlay */}
          {drawSolutions && (
            <Svg width={gridWidth} height={gridHeight} style={styles.svgOverlay}>
              {solutions.map((sol, index) => {
                const x1 = sol.start_x * cellSize + cellSize / 2;
                const y1 = sol.start_y * cellSize + cellSize / 2;
                const x2 = sol.end_x * cellSize + cellSize / 2;
                const y2 = sol.end_y * cellSize + cellSize / 2;
                return (
                  <Line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#f43f5e"
                    strokeWidth={cellSize * 0.75}
                    strokeLinecap="round"
                    strokeOpacity={0.25}
                  />
                );
              })}
            </Svg>
          )}

          {/* Grid Characters */}
          <View style={styles.grid}>
            {grid.map((row, rIdx) => (
              <View key={rIdx} style={styles.row}>
                {row.map((char, cIdx) => (
                  <View
                    key={cIdx}
                    style={[styles.cell, { width: cellSize, height: cellSize }]}
                  >
                    <Text style={[styles.cellText, { fontSize: cellSize * 0.6 }]}>
                      {char}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Word Bank Container */}
      {placedWords.length > 0 && (
        <View style={styles.wordBankContainer}>
          <Text style={styles.wordBankTitle}>Word Bank</Text>
          <View style={styles.wordBankGrid}>
            {wordRows.map((row, rIdx) => (
              <View key={rIdx} style={styles.wordBankRow}>
                {row.map((word, cIdx) => (
                  <View key={cIdx} style={styles.wordBankCell}>
                    <Text style={styles.wordBankText}>• {word}</Text>
                  </View>
                ))}
                {row.length < numCols &&
                  Array.from({ length: numCols - row.length }).map((_, padIdx) => (
                    <View key={`pad-${padIdx}`} style={styles.wordBankCell} />
                  ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Unplaced Words */}
      {unplaced_words.length > 0 && (
        <View style={styles.unplacedContainer}>
          <Text style={styles.unplacedTitle}>
            Unplaced Words (Could not fit in grid):
          </Text>
          <View style={styles.unplacedGrid}>
            {unplacedRows.map((row, rIdx) => (
              <View key={rIdx} style={styles.unplacedRow}>
                {row.map((word, cIdx) => (
                  <View key={cIdx} style={styles.unplacedCell}>
                    <Text style={styles.unplacedText}>• {word}</Text>
                  </View>
                ))}
                {row.length < numCols &&
                  Array.from({ length: numCols - row.length }).map((_, padIdx) => (
                    <View key={`pad-${padIdx}`} style={styles.unplacedCell} />
                  ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <Text
        style={styles.footer}
        render={({ pageNumber }) => `Page ${pageNumber}`}
        fixed
      />
    </Page>
  );
};

export function PdfDocument({
  puzzles,
  pageSize,
  includeSolutions,
  isSinglePage = false,
}: PdfDocumentProps) {
  return (
    <Document>
      {/* 1. Puzzle Pages */}
      {puzzles.map((puzzle) =>
        renderPuzzlePage(puzzle, false, pageSize)
      )}

      {/* 2. Solution Pages (if not single page and includeSolutions is true) */}
      {!isSinglePage &&
        includeSolutions &&
        puzzles.map((puzzle) =>
          renderPuzzlePage(puzzle, true, pageSize)
        )}
    </Document>
  );
}
