import { Document, Page, View, Text, StyleSheet, Svg, Rect, Image } from "@react-pdf/renderer";
import type { PageState } from "../../../types/generated/PageState";
import { registerFonts } from "../../../utils/fonts";

registerFonts();

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
  pages: PageState[];
  pageSize: string;
  includeSolutions: boolean;
  isSinglePage?: boolean;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  titleText: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  subtitleText: {
    fontSize: '9pt',
    color: '#64748b',
    marginTop: '2pt',
  },
  gridOuter: {
    position: 'relative',
    borderWidth: '1.5pt',
    borderColor: '#475569',
    borderRadius: '4pt',
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
    backgroundColor: '#f8fafc',
    borderWidth: '1pt',
    borderColor: '#e2e8f0',
    borderRadius: '6pt',
    padding: '10pt',
    display: 'flex',
    flexDirection: 'column',
  },
  wordBankTitle: {
    fontSize: '10pt',
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    marginBottom: '4pt',
    borderBottomWidth: '0.5pt',
    borderBottomColor: '#e2e8f0',
    paddingBottom: '2pt',
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
    paddingHorizontal: '2pt',
  },
  wordBankText: {
    fontSize: '8.5pt',
    color: '#475569',
    fontFamily: 'Helvetica',
  },
  unplacedContainer: {
    marginTop: '6pt',
    padding: '6pt',
    backgroundColor: '#fff1f2',
    borderWidth: '0.5pt',
    borderColor: '#fecdd3',
    borderRadius: '4pt',
  },
  unplacedTitle: {
    fontSize: '8pt',
    fontFamily: 'Helvetica-Bold',
    color: '#991b1b',
    marginBottom: '2pt',
  },
  unplacedText: {
    fontSize: '7.5pt',
    color: '#991b1b',
    fontFamily: 'Helvetica',
  },
  footer: {
    position: 'absolute',
    bottom: '25pt',
    left: '40pt',
    right: '40pt',
    textAlign: 'center',
    fontSize: '8pt',
    color: '#94a3b8',
    borderTopWidth: '0.5pt',
    borderTopColor: '#f1f5f9',
    paddingTop: '5pt',
  },
});

const renderPdfPage = (
  page: PageState,
  drawSolutions: boolean,
  pageSize: string,
  pageIndex: number,
  pageDims: { width: number; height: number }
) => {
  const activePuzzle = page.metadata;
  const isSudoku = activePuzzle.specificData.type === "Sudoku";
  const isCrossword = activePuzzle.specificData.type === "Crossword";
  const cols = activePuzzle.grid[0]?.length || 0;
  const rows = activePuzzle.grid.length || 0;

  return (
    <Page
      key={`${page.id}-${drawSolutions ? "sol" : "puz"}`}
      size={pageSize.toUpperCase() as any}
      style={[styles.page, { backgroundColor: page.backgroundColor || '#ffffff' }]}
    >
      {/* 1. Render Art Layers */}
      {page.artLayers.map((layer) => (
        <Image
          key={layer.id}
          src={layer.url}
          style={{
            position: 'absolute',
            left: layer.x,
            top: layer.y,
            width: layer.width,
            height: layer.height,
            zIndex: layer.zIndex ?? 1,
            opacity: layer.opacity ?? 1,
          }}
        />
      ))}

      {/* 2. Render Grid Elements */}
      {page.gridLayout.map((el) => {
        if (el.type === "title") {
          const textFontFamily = fontStyleMap[el.content.fontFamily] || 'Helvetica-Bold';
          const size = el.content.fontSize || 28;
          const align = el.content.align || 'left';
          const color = el.content.color || '#0f172a';

          return (
            <View
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex ?? 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: textFontFamily, color: color, fontSize: size, textAlign: align as any, letterSpacing: el.content.letterSpacing ?? 0 }}>
                {drawSolutions 
                  ? `Solution: ${formatTitle(el.content.text, el.content.themeAccents)}` 
                  : formatTitle(el.content.text, el.content.themeAccents)
                }
              </Text>
              {(isSudoku || isCrossword) && (
                <Text style={[styles.subtitleText, { textAlign: align as any }]}>
                  {isSudoku ? "Sudoku • " + (activePuzzle.specificData.data as any).difficulty?.toUpperCase() : `Crossword • ${(activePuzzle.specificData.data as any).difficulty?.toUpperCase()}`}
                </Text>
              )}
            </View>
          );
        }

        if (el.type === "grid") {
          const gridFont = el.content.gridFont || activePuzzle.gridFont || "Modern Sans";
          const cellBordersSetting = el.content.cellBorders ?? false;
          const ideThemeSetting = el.content.ideTheme ?? false;
          const letterTrackingSetting = el.content.letterTracking ?? 0;
          const solutionStyleSetting = el.content.solutionStyle || "Greyscale Mute";
          const gridFontFamily = fontStyleMap[gridFont] || 'Helvetica-Bold';

          const margin = page.margin ?? { top: 40, bottom: 50, inside: 50, outside: 40 };
          const isEvenPage = (pageIndex + 1) % 2 === 0;
          
          // Backwards compatibility for old saved states
          const insideMargin = margin.inside ?? (margin as any).left ?? 50;
          const outsideMargin = margin.outside ?? (margin as any).right ?? 40;
          
          const rightMargin = isEvenPage ? insideMargin : outsideMargin;

          // Add alternating offset to X based on difference from inside/outside to visual editor layout
          // Visual layout assumes left = leftMargin of this exact page (because we fixed Preview.tsx to alternate).
          // So no shift is needed, but we MUST ensure the grid is bounded by the safe area!
          
          const maxSafeWidth = pageDims.width - rightMargin - el.x;
          const maxSafeHeight = pageDims.height - margin.bottom - el.y;

          const paddingOffset = ideThemeSetting ? 32 : 0;
          const gapOffset = isSudoku || isCrossword ? 0 : (cols > 20 || rows > 20 ? 2 : 4);
          
          const availableW = Math.min(el.width - paddingOffset, maxSafeWidth - paddingOffset);
          const availableH = Math.min(el.height - (ideThemeSetting ? 56 : 0), maxSafeHeight - (ideThemeSetting ? 56 : 0));
          
          const maxCellSizeW = (availableW - (cols - 1) * gapOffset) / cols;
          const maxCellSizeH = (availableH - (rows - 1) * gapOffset) / rows;
          
          const cellSize = Math.max(10, Math.min(maxCellSizeW, maxCellSizeH));
          const step = cellSize + gapOffset;
          
          const gridWidth = cols * step - gapOffset;
          const gridHeight = rows * step - gapOffset;

          const borderVal = cellBordersSetting ? 0.5 : 0;
          const borderCol = ideThemeSetting ? '#334155' : '#e2e8f0';

          return (
            <View
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex ?? 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
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

                {/* WS Pill Outlines Overlay */}
                {!isSudoku && !isCrossword && drawSolutions && solutionStyleSetting === "Pill Outlines" && (
                  <Svg width={gridWidth} height={gridHeight} style={[styles.svgOverlay, { left: ideThemeSetting ? 12 : 0, top: ideThemeSetting ? 24 : 0 }]}>
                    {(activePuzzle.specificData.data as any).solutions.map((sol: any, index: number) => {
                      const x1 = sol.start_x * step + cellSize / 2;
                      const y1 = sol.start_y * step + cellSize / 2;
                      const x2 = sol.end_x * step + cellSize / 2;
                      const y2 = sol.end_y * step + cellSize / 2;
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

                {/* Grid Cells */}
                <View style={styles.grid}>
                  {activePuzzle.grid.map((row, rIdx) => (
                    <View key={rIdx} style={styles.row}>
                      {row.map((cell, cIdx) => {
                        let displayVal = cell;
                        let isSolutionValue = false;
                        let isBlack = isCrossword && cell === "#";

                        if (isSudoku) {
                          const isStarting = cell !== null;
                          if (!isStarting && drawSolutions) {
                            displayVal = (activePuzzle.specificData.data as any).solution?.[rIdx]?.[cIdx] ?? null;
                            isSolutionValue = true;
                          }
                        } else if (isCrossword) {
                          if (!isBlack && drawSolutions) {
                            displayVal = (activePuzzle.specificData.data as any).solution?.[rIdx]?.[cIdx] ?? "";
                            isSolutionValue = true;
                          } else {
                            displayVal = "";
                          }
                        }

                        let cellBorders = {};
                        if (isSudoku) {
                          const borderTop = rIdx % 3 === 0 && rIdx !== 0 ? 2.5 : 0.5;
                          const borderLeft = cIdx % 3 === 0 && cIdx !== 0 ? 2.5 : 0.5;
                          cellBorders = {
                            borderTopWidth: borderTop,
                            borderLeftWidth: borderLeft,
                            borderColor: '#334155',
                          };
                        } else if (isCrossword) {
                          cellBorders = {
                            borderWidth: 0.5,
                            borderColor: '#94a3b8',
                          };
                        } else {
                          cellBorders = {
                            borderWidth: borderVal,
                            borderColor: borderCol,
                          };
                        }

                        let cellTextOpacity = 1.0;
                        let cellTextCol = ideThemeSetting ? '#f8fafc' : '#1e293b';

                        if (!isSudoku && !isCrossword) {
                          if (drawSolutions) {
                            const inSol = isCellInSolution(cIdx, rIdx, (activePuzzle.specificData.data as any).solutions);
                            if (solutionStyleSetting === "Greyscale Mute") {
                              if (inSol) {
                                cellTextCol = ideThemeSetting ? '#34d399' : '#4f46e5';
                              } else {
                                cellTextOpacity = 0.3;
                                cellTextCol = ideThemeSetting ? '#475569' : '#cbd5e1';
                              }
                            }
                          }
                        } else {
                          if (isSolutionValue) {
                            cellTextCol = '#4f46e5';
                          }
                        }

                        const crosswordClue = isCrossword
                          ? (activePuzzle.specificData.data as any).clues?.find((c: any) => c.row === rIdx && c.col === cIdx)
                          : null;

                        return (
                          <View
                            key={cIdx}
                            style={[
                              styles.cell, 
                              cellBorders,
                              { 
                                width: cellSize, 
                                height: cellSize,
                                backgroundColor: isBlack 
                                  ? '#1e293b' 
                                  : isSudoku 
                                    ? cell !== null ? '#ffffff' : (drawSolutions ? '#f5f3ff' : '#ffffff')
                                    : isCrossword
                                      ? '#ffffff'
                                      : ideThemeSetting ? 'transparent' : '#ffffff',
                                position: 'relative'
                              }
                            ]}
                          >
                            {isCrossword && crosswordClue && (
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
                                {crosswordClue.number}
                              </Text>
                            )}
                            {!isBlack && (
                              <Text style={[
                                styles.cellText, 
                                { 
                                  fontSize: cellSize * 0.6, 
                                  fontFamily: isSudoku && cell !== null ? 'Helvetica-Bold' : gridFontFamily, 
                                  letterSpacing: letterTrackingSetting,
                                  opacity: cellTextOpacity,
                                  color: cellTextCol
                                }
                              ]}>
                                {displayVal === null ? "" : displayVal}
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
          );
        }

        if (el.type === "wordbank") {
          const isWordSearch = activePuzzle.specificData.type === "WordSearch";
          const isSudoku = activePuzzle.specificData.type === "Sudoku";
          const isCrossword = activePuzzle.specificData.type === "Crossword";

          const columns = el.content.columns || 3;
          const selectorStyle = el.content.selectorStyle || "Clean Text (No Bullets)";
          const font = el.content.fontFamily || "Modern Sans";
          const fontSize = el.content.fontSize || 10;
          const color = el.content.color || "#475569";
          const textFontFamily = fontStyleMap[font] || 'Helvetica';

          if (isWordSearch) {
            const placedWords = (activePuzzle.specificData.data as any).word_bank.filter(
              (w: string) => !(activePuzzle.specificData.data as any).unplaced_words.includes(w)
            );
            const wordRows: string[][] = [];
            for (let i = 0; i < placedWords.length; i += columns) {
              wordRows.push(placedWords.slice(i, i + columns));
            }

            const unplacedWords = (activePuzzle.specificData.data as any).unplaced_words;
            const unplacedRows: string[][] = [];
            for (let i = 0; i < unplacedWords.length; i += columns) {
              unplacedRows.push(unplacedWords.slice(i, i + columns));
            }

            let prefix = "";
            if (selectorStyle === "Classic Bullet Points") {
              prefix = "• ";
            } else if (selectorStyle === "Checkbox [ ] Style") {
              prefix = "[ ] ";
            }

            return (
              <View
                key={el.id}
                style={[
                  styles.wordBankContainer,
                  {
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    zIndex: el.zIndex ?? 10,
                  }
                ]}
              >
                <Text style={[styles.wordBankTitle, { fontFamily: textFontFamily, color, fontSize: fontSize + 1 }]}>Word Bank</Text>
                <View style={styles.wordBankGrid}>
                  {wordRows.map((row, rIdx) => (
                    <View key={rIdx} style={styles.wordBankRow}>
                      {row.map((word, cIdx) => (
                        <View key={cIdx} style={styles.wordBankCell}>
                          <Text style={{ fontFamily: textFontFamily, color, fontSize }}>{prefix}{word}</Text>
                        </View>
                      ))}
                      {row.length < columns &&
                        Array.from({ length: columns - row.length }).map((_, padIdx) => (
                          <View key={`pad-${padIdx}`} style={styles.wordBankCell} />
                        ))}
                    </View>
                  ))}
                </View>

                {unplacedWords.length > 0 && (
                  <View style={styles.unplacedContainer}>
                    <Text style={[styles.unplacedTitle, { fontFamily: textFontFamily }]}>Unplaced Words (Could not fit):</Text>
                    <View style={styles.wordBankGrid}>
                      {unplacedRows.map((row, rIdx) => (
                        <View key={rIdx} style={styles.wordBankRow}>
                          {row.map((word, cIdx) => (
                            <View key={cIdx} style={styles.wordBankCell}>
                              <Text style={[styles.unplacedText, { fontFamily: textFontFamily, fontSize: fontSize - 0.5 }]}>{prefix}{word}</Text>
                            </View>
                          ))}
                          {row.length < columns &&
                            Array.from({ length: columns - row.length }).map((_, padIdx) => (
                              <View key={`pad-${padIdx}`} style={styles.wordBankCell} />
                            ))}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          }

          if (isSudoku) {
            return (
              <View
                key={el.id}
                style={[
                  styles.wordBankContainer,
                  {
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    zIndex: el.zIndex ?? 10,
                  }
                ]}
              >
                <Text style={[styles.wordBankTitle, { fontFamily: textFontFamily, color, fontSize: fontSize + 1 }]}>Sudoku Instructions</Text>
                <Text style={{ fontFamily: textFontFamily, color, fontSize, lineHeight: 1.4 }}>
                  Complete the grid so that every row, column, and 3x3 block contains every digit from 1 to 9.
                  Predefined numbers are shown in bold black; filled cells are shown in blue.
                </Text>
              </View>
            );
          }

          if (isCrossword) {
            const clues = (activePuzzle.specificData.data as any).clues;
            const acrossClues = clues.filter((c: any) => c.direction === "across");
            const downClues = clues.filter((c: any) => c.direction === "down");
            const unplaced_words = (activePuzzle.specificData.data as any).unplaced_words;

            return (
              <View
                key={el.id}
                style={[
                  styles.wordBankContainer,
                  {
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    zIndex: el.zIndex ?? 10,
                    padding: 8,
                  }
                ]}
              >
                <View style={{ display: 'flex', flexDirection: 'row', gap: 10, flex: 1 }}>
                  {/* Across Column */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.wordBankTitle, { fontFamily: textFontFamily, color, fontSize: fontSize }]}>Across Clues</Text>
                    <View style={styles.wordBankGrid}>
                      {acrossClues.map((c: any) => (
                        <View key={c.id} style={{ display: 'flex', flexDirection: 'row', marginBottom: 2 }}>
                          <Text style={{ fontFamily: 'Helvetica-Bold', color, fontSize: fontSize - 0.5, width: 12 }}>
                            {c.number}.
                          </Text>
                          <Text style={{ fontFamily: textFontFamily, color, fontSize: fontSize - 0.5, flex: 1 }}>
                            {c.clue} ({c.answer.length})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Down Column */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.wordBankTitle, { fontFamily: textFontFamily, color, fontSize: fontSize }]}>Down Clues</Text>
                    <View style={styles.wordBankGrid}>
                      {downClues.map((c: any) => (
                        <View key={c.id} style={{ display: 'flex', flexDirection: 'row', marginBottom: 2 }}>
                          <Text style={{ fontFamily: 'Helvetica-Bold', color, fontSize: fontSize - 0.5, width: 12 }}>
                            {c.number}.
                          </Text>
                          <Text style={{ fontFamily: textFontFamily, color, fontSize: fontSize - 0.5, flex: 1 }}>
                            {c.clue} ({c.answer.length})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {unplaced_words?.length > 0 && (
                  <View style={[styles.unplacedContainer, { marginTop: 4, padding: 4 }]}>
                    <Text style={[styles.unplacedTitle, { fontSize: fontSize - 1, fontFamily: textFontFamily }]}>Unplaced Clues:</Text>
                    <Text style={[styles.unplacedText, { fontSize: fontSize - 1.5, fontFamily: textFontFamily, lineHeight: 1.3 }]}>
                      {unplaced_words.map((c: any) => `${c.word}: ${c.clue}`).join("   |   ")}
                    </Text>
                  </View>
                )}
              </View>
            );
          }
        }

        return null;
      })}

      {/* Footer page numbers */}
      <Text
        style={styles.footer}
        render={({ pageNumber }) => `Page ${pageNumber}`}
        fixed
      />
    </Page>
  );
};

export function PdfDocument({
  pages,
  pageSize,
  includeSolutions,
  isSinglePage = false,
}: PdfDocumentProps) {
  const PAGE_SIZES: Record<string, { width: number, height: number }> = {
    "A4": { width: 595, height: 841 },
    "LETTER": { width: 612, height: 792 },
  };
  const norm = pageSize.toUpperCase();
  const pageDims = PAGE_SIZES[norm] || PAGE_SIZES["A4"];

  return (
    <Document>
      {/* 1. Puzzle Pages */}
      {pages.map((page, idx) => renderPdfPage(page, false, pageSize, idx, pageDims))}

      {/* 2. Solution Pages */}
      {!isSinglePage &&
        includeSolutions &&
        pages.map((page, idx) => renderPdfPage(page, true, pageSize, idx + pages.length, pageDims))}
    </Document>
  );
}
