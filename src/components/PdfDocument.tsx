import { Document, Page, View, Text, StyleSheet, Svg, Rect, Font } from "@react-pdf/renderer";
import { PuzzlePayload, WordSearchData } from "../store";

Font.register({
  family: 'Montserrat',
  src: '/fonts/montserrat.ttf'
});
Font.register({
  family: 'Inter',
  src: '/fonts/inter.ttf'
});
Font.register({
  family: 'Oswald',
  src: '/fonts/oswald.ttf'
});
Font.register({
  family: 'JetBrains Mono',
  src: '/fonts/jetbrains-mono.ttf'
});
Font.register({
  family: 'Fira Code',
  src: '/fonts/fira-code.ttf'
});

const fontStyleMap: Record<string, string> = {
  "Modern Sans": "Montserrat",
  "Display Geometric": "Oswald",
  "Developer Mono": "JetBrains Mono"
};

const formatTitle = (title: string, themeAccents?: boolean) => {
  if (!themeAccents) return title;
  const match = title.match(/^(Puzzle \d+:\s*)(.*)$/);
  if (match) {
    const prefix = match[1];
    const rest = match[2];
    const tag = rest.replace(/[^a-zA-Z0-9]/g, "");
    return `${prefix}<${tag} />`;
  }
  return `<${title.replace(/[^a-zA-Z0-9]/g, "")} />`;
};

const isCellInSolution = (x: number, y: number, solutions: any[]) => {
  if (!solutions) return false;
  return solutions.some((sol) => {
    const dx = Math.sign(sol.end_x - sol.start_x);
    const dy = Math.sign(sol.end_y - sol.start_y);
    const len = Math.max(Math.abs(sol.end_x - sol.start_x), Math.abs(sol.end_y - sol.start_y)) + 1;
    for (let i = 0; i < len; i++) {
      if (sol.start_x + i * dx === x && sol.start_y + i * dy === y) {
        return true;
      }
    }
    return false;
  });
};

interface PdfDocumentProps {
  puzzles: PuzzlePayload<any>[];
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
    flexWrap: 'nowrap',
  },
  cell: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
    flexShrink: 0,
    flexGrow: 0,
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

const renderWordSearchPage = (
  puzzle: PuzzlePayload<WordSearchData>,
  drawSolutions: boolean,
  pageSize: string
) => {
  const { title, grid, specific_data } = puzzle;
  const { word_bank, unplaced_words, solutions } = specific_data;

  const cols = grid[0]?.length || 0;
  const rows = grid.length || 0;

  const { width: pageWidth } = getPageDimensions(pageSize);

  const gridFont = puzzle.gridFont || "Modern Sans";
  const titleFont = puzzle.titleFont || "Modern Sans";
  const cellBordersSetting = puzzle.cellBorders || false;
  const ideThemeSetting = puzzle.ideTheme || false;
  const letterTrackingSetting = puzzle.letterTracking ?? 0;
  const wordBankColumnsSetting = puzzle.wordBankColumns || 3;
  const selectorStyleSetting = puzzle.selectorStyle || "Clean Text (No Bullets)";
  const solutionStyleSetting = puzzle.solutionStyle || "Greyscale Mute";

  const gridFontFamily = fontStyleMap[gridFont] || 'Helvetica-Bold';
  const titleFontFamily = fontStyleMap[titleFont] || 'Helvetica-Bold';

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
  const numCols = wordBankColumnsSetting;
  const wordRows: string[][] = [];
  for (let i = 0; i < placedWords.length; i += numCols) {
    wordRows.push(placedWords.slice(i, i + numCols));
  }

  // Unplaced words columns chunking
  const unplacedRows: string[][] = [];
  for (let i = 0; i < unplaced_words.length; i += numCols) {
    unplacedRows.push(unplaced_words.slice(i, i + numCols));
  }

  let prefix = "";
  if (selectorStyleSetting === "Classic Bullet Points") {
    prefix = "• ";
  } else if (selectorStyleSetting === "Checkbox [ ] Style") {
    prefix = "[ ] ";
  }

  const borderVal = cellBordersSetting ? 0.5 : 0;
  const borderCol = ideThemeSetting ? '#334155' : '#e2e8f0';

  return (
    <Page
      key={`${puzzle.id}-${drawSolutions ? "sol" : "puz"}`}
      size={pageSize.toUpperCase() as any}
      style={styles.page}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { fontFamily: titleFontFamily }]}>
            {drawSolutions ? `Solution: ${formatTitle(title, puzzle.themeAccents)}` : formatTitle(title, puzzle.themeAccents)}
          </Text>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridContainer}>
        <View style={[
          styles.gridOuter, 
          { 
            width: ideThemeSetting ? gridWidth + 24 : gridWidth, 
            height: ideThemeSetting ? gridHeight + 36 : gridHeight,
            backgroundColor: ideThemeSetting ? '#0f172a' : '#ffffff',
            borderColor: '#475569',
            borderWidth: 1.5,
            paddingTop: ideThemeSetting ? 24 : 0,
            paddingHorizontal: ideThemeSetting ? 12 : 0,
          }
        ]}>
          {ideThemeSetting && (
            <View style={{ position: 'absolute', top: 8, left: 10, display: 'flex', flexDirection: 'row', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' }} />
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' }} />
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
            </View>
          )}

          {/* Solution Overlay */}
          {drawSolutions && solutionStyleSetting === "Pill Outlines" && (
            <Svg width={gridWidth} height={gridHeight} style={[styles.svgOverlay, { left: ideThemeSetting ? 12 : 0, top: ideThemeSetting ? 24 : 0 }]}>
              {solutions.map((sol, index) => {
                const x1 = sol.start_x * cellSize + cellSize / 2;
                const y1 = sol.start_y * cellSize + cellSize / 2;
                const x2 = sol.end_x * cellSize + cellSize / 2;
                const y2 = sol.end_y * cellSize + cellSize / 2;
                const dx = x2 - x1;
                const dy = y2 - y1;
                const L = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                const hHeight = cellSize * 1.0;
                const hRadius = hHeight / 2;

                return (
                  <Rect
                    key={index}
                    x={x1 - hRadius}
                    y={y1 - hRadius}
                    width={L + hHeight}
                    height={hHeight}
                    rx={hRadius}
                    ry={hRadius}
                    transform={`rotate(${angle}, ${x1}, ${y1})`}
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    fill="none"
                  />
                );
              })}
            </Svg>
          )}

          {/* Grid Characters */}
          <View style={styles.grid}>
            {grid.map((row, rIdx) => (
              <View key={rIdx} style={styles.row}>
                {row.map((char, cIdx) => {
                  let cellTextOpacity = 1.0;
                  let cellTextCol = ideThemeSetting ? '#f8fafc' : '#1e293b';

                  if (drawSolutions) {
                    const inSol = isCellInSolution(cIdx, rIdx, solutions);
                    if (solutionStyleSetting === "Greyscale Mute") {
                      if (inSol) {
                        cellTextCol = ideThemeSetting ? '#34d399' : '#4f46e5';
                      } else {
                        cellTextOpacity = 0.3;
                        cellTextCol = ideThemeSetting ? '#475569' : '#cbd5e1';
                      }
                    }
                  }

                  return (
                    <View
                      key={cIdx}
                      style={[
                        styles.cell, 
                        { 
                          width: cellSize, 
                          height: cellSize,
                          borderWidth: borderVal,
                          borderColor: borderCol,
                          backgroundColor: ideThemeSetting ? 'transparent' : '#ffffff'
                        }
                      ]}
                    >
                      <Text style={[
                        styles.cellText, 
                        { 
                          fontSize: cellSize * 0.6, 
                          fontFamily: gridFontFamily, 
                          letterSpacing: letterTrackingSetting,
                          opacity: cellTextOpacity,
                          color: cellTextCol
                        }
                      ]}>
                        {char}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Word Bank Container */}
      {placedWords.length > 0 && (
        <View style={styles.wordBankContainer}>
          <Text style={[styles.wordBankTitle, { fontFamily: titleFontFamily }]}>Word Bank</Text>
          <View style={styles.wordBankGrid}>
            {wordRows.map((row, rIdx) => (
              <View key={rIdx} style={styles.wordBankRow}>
                {row.map((word, cIdx) => (
                  <View key={cIdx} style={styles.wordBankCell}>
                    <Text style={[styles.wordBankText, { fontFamily: titleFontFamily }]}>{prefix}{word}</Text>
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
          <Text style={[styles.unplacedTitle, { fontFamily: titleFontFamily }]}>
            Unplaced Words (Could not fit in grid):
          </Text>
          <View style={styles.unplacedGrid}>
            {unplacedRows.map((row, rIdx) => (
              <View key={rIdx} style={styles.unplacedRow}>
                {row.map((word, cIdx) => (
                  <View key={cIdx} style={styles.unplacedCell}>
                    <Text style={[styles.unplacedText, { fontFamily: titleFontFamily }]}>{prefix}{word}</Text>
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

const renderSudokuPage = (
  puzzle: PuzzlePayload<any>,
  drawSolutions: boolean,
  pageSize: string
) => {
  const { title, grid, specific_data } = puzzle;
  const { difficulty, solution } = specific_data;

  const cols = 9;
  const rows = 9;

  const { width: pageWidth } = getPageDimensions(pageSize);

  // Spacing calculations to fit standard layouts comfortably
  const maxGridWidth = pageWidth - 80;
  const maxGridHeight = 360;
  const cellSize = Math.min(36, maxGridWidth / cols, maxGridHeight / rows);
  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

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
            Sudoku • {difficulty.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridContainer}>
        <View style={[styles.gridOuter, { width: gridWidth, height: gridHeight, borderWidth: 2, borderColor: '#1e293b' }]}>
          <View style={styles.grid}>
            {grid.map((row: any[], rIdx: number) => (
              <View key={rIdx} style={styles.row}>
                {row.map((cell: any, cIdx: number) => {
                  const startingVal = cell;
                  const isStarting = startingVal !== null;
                  let displayVal = cell;
                  if (!isStarting && drawSolutions) {
                    displayVal = solution[rIdx][cIdx];
                  }

                  // Dynamically set subgrid borders in react-pdf
                  const borderTop = rIdx % 3 === 0 && rIdx !== 0 ? 2.5 : 0.5;
                  const borderLeft = cIdx % 3 === 0 && cIdx !== 0 ? 2.5 : 0.5;

                  return (
                    <View
                      key={cIdx}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          borderTopWidth: borderTop,
                          borderLeftWidth: borderLeft,
                          borderBottomWidth: 0,
                          borderRightWidth: 0,
                          borderColor: '#334155',
                          backgroundColor: isStarting ? '#ffffff' : (drawSolutions ? '#f5f3ff' : '#ffffff')
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          {
                            fontSize: cellSize * 0.5,
                            fontFamily: isStarting ? 'Helvetica-Bold' : 'Helvetica',
                            color: isStarting ? '#0f172a' : '#4f46e5'
                          }
                        ]}
                      >
                        {displayVal === null ? "" : displayVal}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Info panel at the bottom */}
      <View style={styles.wordBankContainer}>
        <Text style={styles.wordBankTitle}>Sudoku Instructions</Text>
        <Text style={[styles.wordBankText, { fontSize: 8.5, lineHeight: 1.4 }]}>
          Complete the grid so that every row, column, and 3x3 block contains every digit from 1 to 9.
          Predefined numbers (clues) are shown in bold black; filled cells are shown in blue.
        </Text>
      </View>

      {/* Footer */}
      <Text
        style={styles.footer}
        render={({ pageNumber }) => `Page ${pageNumber}`}
        fixed
      />
    </Page>
  );
};

const renderCrosswordPage = (
  puzzle: PuzzlePayload<any>,
  drawSolutions: boolean,
  pageSize: string
) => {
  const { title, grid, specific_data } = puzzle;
  const { difficulty, solution, clues } = specific_data;

  const cols = grid[0]?.length || 0;
  const rows = grid.length || 0;

  const { width: pageWidth } = getPageDimensions(pageSize);

  // Spacing calculations to fit standard layouts comfortably
  const maxGridWidth = pageWidth - 80;
  const maxGridHeight = 320;
  const cellWidth = maxGridWidth / cols;
  const cellHeight = maxGridHeight / rows;
  const cellSize = Math.min(26, cellWidth, cellHeight);
  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

  // Split clues into Across and Down
  const acrossClues = clues.filter((c: any) => c.direction === "across");
  const downClues = clues.filter((c: any) => c.direction === "down");

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
            Crossword • {difficulty.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridContainer}>
        <View style={[styles.gridOuter, { width: gridWidth, height: gridHeight, borderWidth: 1.5, borderColor: '#1e293b' }]}>
          <View style={styles.grid}>
            {grid.map((row: any[], rIdx: number) => (
              <View key={rIdx} style={styles.row}>
                {row.map((cell: any, cIdx: number) => {
                  const isBlack = cell === "#";
                  let displayVal = "";
                  if (!isBlack && drawSolutions) {
                    displayVal = solution[rIdx][cIdx];
                  }

                  // Find clue starting here for clue number in top-left
                  const clue = clues.find((c: any) => c.row === rIdx && c.col === cIdx);

                  return (
                    <View
                      key={cIdx}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          borderWidth: 0.5,
                          borderColor: '#94a3b8',
                          backgroundColor: isBlack ? '#1e293b' : '#ffffff',
                          position: 'relative'
                        }
                      ]}
                    >
                      {clue && (
                        <Text
                          style={{
                            position: 'absolute',
                            top: 1,
                            left: 1,
                            fontSize: cellSize * 0.25,
                            fontFamily: 'Helvetica-Bold',
                            color: '#64748b'
                          }}
                        >
                          {clue.number}
                        </Text>
                      )}
                      {!isBlack && (
                        <Text
                          style={[
                            styles.cellText,
                            {
                              fontSize: cellSize * 0.5,
                              fontFamily: 'Helvetica-Bold',
                              color: drawSolutions ? '#4f46e5' : '#1e293b'
                            }
                          ]}
                        >
                          {displayVal}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Clues section */}
      <View style={{ display: 'flex', flexDirection: 'row', gap: 15, marginTop: 15 }}>
        {/* Across Column */}
        <View style={[styles.wordBankContainer, { flex: 1, marginTop: 0 }]}>
          <Text style={styles.wordBankTitle}>Across Clues</Text>
          <View style={styles.wordBankGrid}>
            {acrossClues.map((c: any) => (
              <View key={c.id} style={{ display: 'flex', flexDirection: 'row', marginBottom: 3 }}>
                <Text style={[styles.wordBankText, { fontFamily: 'Helvetica-Bold', width: 14 }]}>
                  {c.number}.
                </Text>
                <Text style={[styles.wordBankText, { flex: 1 }]}>
                  {c.clue} ({c.answer.length})
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Down Column */}
        <View style={[styles.wordBankContainer, { flex: 1, marginTop: 0 }]}>
          <Text style={styles.wordBankTitle}>Down Clues</Text>
          <View style={styles.wordBankGrid}>
            {downClues.map((c: any) => (
              <View key={c.id} style={{ display: 'flex', flexDirection: 'row', marginBottom: 3 }}>
                <Text style={[styles.wordBankText, { fontFamily: 'Helvetica-Bold', width: 14 }]}>
                  {c.number}.
                </Text>
                <Text style={[styles.wordBankText, { flex: 1 }]}>
                  {c.clue} ({c.answer.length})
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Unplaced Clues */}
      {specific_data.unplaced_words?.length > 0 && (
        <View style={[styles.unplacedContainer, { marginTop: 10, padding: 6 }]}>
          <Text style={[styles.unplacedTitle, { fontSize: 8.5 }]}>
            Unplaced Clues (Could not fit in grid):
          </Text>
          <View style={styles.unplacedGrid}>
            <View style={styles.unplacedRow}>
              <View style={styles.unplacedCell}>
                <Text style={[styles.unplacedText, { fontSize: 7.5, lineHeight: 1.3 }]}>
                  {specific_data.unplaced_words.map((c: any) => `${c.word}: ${c.clue}`).join("   |   ")}
                </Text>
              </View>
            </View>
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
        puzzle.puzzle_type === "Sudoku"
          ? renderSudokuPage(puzzle, false, pageSize)
          : puzzle.puzzle_type === "Crossword"
            ? renderCrosswordPage(puzzle, false, pageSize)
            : renderWordSearchPage(puzzle, false, pageSize)
      )}

      {/* 2. Solution Pages */}
      {!isSinglePage &&
        includeSolutions &&
        puzzles.map((puzzle) =>
          puzzle.puzzle_type === "Sudoku"
            ? renderSudokuPage(puzzle, true, pageSize)
            : puzzle.puzzle_type === "Crossword"
              ? renderCrosswordPage(puzzle, true, pageSize)
              : renderWordSearchPage(puzzle, true, pageSize)
        )}
    </Document>
  );
}
