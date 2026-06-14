import { Document, Page, View, Text, StyleSheet, Svg, Rect, Image } from "@react-pdf/renderer";
import type { PageState } from "../../../types/generated/PageState";
import { chunkArray, enforceLargePrint } from "../../../utils/layoutHelper";
import { registerFonts, fontStyleMap } from "../../../utils/fonts";

registerFonts();

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
  solutionsPerPage?: number;
  globalTheme?: any;
  pageBorderUrl?: string | null;
  isLargePrint?: boolean;
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
  pageDims: { width: number; height: number },
  totalPages: number,
  globalTheme?: any,
  pageBorderUrl?: string | null,
  isLargePrint?: boolean
) => {
  const activePuzzle = page.metadata;
  const isSudoku = activePuzzle.specificData.type === "Sudoku";
  const isCrossword = activePuzzle.specificData.type === "Crossword";
  const cols = activePuzzle.grid[0]?.length || 0;
  const rows = activePuzzle.grid.length || 0;

  // Calculate dynamic KDP minimums based on total page count
  let minInsideGutter = 27; // <= 150
  if (totalPages > 150 && totalPages <= 300) minInsideGutter = 36;
  else if (totalPages > 300 && totalPages <= 500) minInsideGutter = 45;
  else if (totalPages > 500) minInsideGutter = 54;
  
  const minOutside = 18; // 0.25"
  
  const userInside = page.margin?.inside ?? (page.margin as any)?.left ?? 50;
  const userOutside = page.margin?.outside ?? (page.margin as any)?.right ?? 40;
  
  const insideMargin = Math.max(userInside, minInsideGutter + minOutside);
  const outsideMargin = Math.max(userOutside, minOutside);
  
  const isEvenPage = (pageIndex + 1) % 2 === 0;
  const shiftX = isEvenPage ? (outsideMargin - insideMargin) : 0;

  return (
    <Page
      key={`${page.id}-${drawSolutions ? "sol" : "puz"}`}
      size={pageSize.toUpperCase() as any}
      style={[styles.page, { backgroundColor: page.backgroundColor || '#ffffff' }]}
    >
      {/* Page Border Overlay */}
      {pageBorderUrl && (
        <Image
          src={pageBorderUrl}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: pageDims.width,
            height: pageDims.height,
            zIndex: -1,
          }}
        />
      )}

      {/* 1. Render Art Layers */}
      {(page.artLayers || []).map((layer) => (
        <Image
          key={layer.id}
          src={layer.url}
          style={{
            position: 'absolute',
            left: layer.x + shiftX,
            top: layer.y,
            width: layer.width,
            height: layer.height,
            zIndex: layer.zIndex ?? 1,
            opacity: layer.opacity ?? 1,
            transform: (layer as any).rotation ? `rotate(${(layer as any).rotation}deg)` : undefined,
          }}
        />
      ))}

      {/* 2. Render Grid Elements */}
      {(page.gridLayout || []).map((el) => {
        if (el.type === "title") {
          const fontFamily = globalTheme?.fontProperties?.titleFont || el.content.fontFamily;
          const textFontFamily = fontStyleMap[fontFamily] || 'Helvetica-Bold';
          let { fontSize: size } = enforceLargePrint(isLargePrint ?? false, el.content.fontSize || 28);
          const align = el.content.align || 'left';
          const color = globalTheme?.primaryColor || el.content.color || '#0f172a';

          let titleText = drawSolutions 
            ? `Solution: ${formatTitle(el.content.text, el.content.themeAccents)}` 
            : formatTitle(el.content.text, el.content.themeAccents);
            
          if (globalTheme?.textCasing === 'uppercase') titleText = titleText.toUpperCase();
          if (globalTheme?.textCasing === 'lowercase') titleText = titleText.toLowerCase();

          return (
            <View
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x + shiftX,
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex ?? 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transform: (el as any).rotation ? `rotate(${(el as any).rotation}deg)` : undefined,
              }}
            >
              <Text style={{ fontFamily: textFontFamily, color: color, fontSize: size, textAlign: align as any, letterSpacing: el.content.letterSpacing ?? 0 }}>
                {titleText}
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
          const gridFont = globalTheme?.fontProperties?.gridFont || el.content.gridFont || activePuzzle.gridFont || "Modern Sans";
          const cellBordersSetting = el.content.cellBorders ?? false;
          const ideThemeSetting = el.content.ideTheme ?? false;
          const letterTrackingSetting = el.content.letterTracking ?? 0;
          const solutionStyleSetting = el.content.solutionStyle || "Greyscale Mute";
          const solutionOverlayBehind = el.content.solutionOverlayBehind ?? true;
          const hideSolutionGridBorders = el.content.hideSolutionGridBorders ?? false;
          const gridFontFamily = fontStyleMap[gridFont] || 'Helvetica-Bold';

          const marginBottom = page.margin?.bottom ?? 50;
          const rightMargin = isEvenPage ? insideMargin : outsideMargin;
          const leftMargin = isEvenPage ? outsideMargin : insideMargin;

          // Add alternating offset to X based on difference from inside/outside to visual editor layout
          // Visual layout assumes left = leftMargin of this exact page (because we fixed Preview.tsx to alternate).
          // So no shift is needed, but we MUST ensure the grid is bounded by the safe area!
          
          const maxSafeWidth = pageDims.width - rightMargin - Math.max(el.x + shiftX, leftMargin);
          const maxSafeHeight = pageDims.height - marginBottom - el.y;

          const paddingOffset = ideThemeSetting ? 32 : 0;
          const gapOffset = isSudoku || isCrossword ? 0 : (cols > 20 || rows > 20 ? 2 : 4);
          
          const availableW = Math.min(el.width - paddingOffset, maxSafeWidth - paddingOffset);
          const availableH = Math.min(el.height - (ideThemeSetting ? 56 : 0), maxSafeHeight - (ideThemeSetting ? 56 : 0));
          
          const maxCellSizeW = (availableW - (cols - 1) * gapOffset) / cols;
          const maxCellSizeH = (availableH - (rows - 1) * gapOffset) / rows;
          
          let rawCellSize = Math.max(10, Math.min(maxCellSizeW, maxCellSizeH));
          const { cellSize } = enforceLargePrint(isLargePrint ?? false, undefined, rawCellSize);
          const step = cellSize + gapOffset;
          
          const gridWidth = cols * step - gapOffset;
          const gridHeight = rows * step - gapOffset;

          const borderVal = globalTheme ? globalTheme.lineThickness : (cellBordersSetting ? 0.5 : 0);
          const borderCol = globalTheme?.primaryColor || (ideThemeSetting ? '#334155' : '#e2e8f0');

          return (
            <View
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x + shiftX,
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex ?? 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: (el as any).rotation ? `rotate(${(el as any).rotation}deg)` : undefined,
              }}
            >
              <View style={[
                styles.gridOuter, 
                { 
                  width: ideThemeSetting ? gridWidth + 24 : gridWidth + 3, 
                  height: ideThemeSetting ? gridHeight + 36 : gridHeight + 3,
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

                {!isSudoku && !isCrossword && drawSolutions && solutionStyleSetting === "Pill Outlines" && solutionOverlayBehind && (
                  <Svg width={gridWidth} height={gridHeight} style={[styles.svgOverlay, { left: ideThemeSetting ? 12 : 0, top: ideThemeSetting ? 24 : 0 }]}>
                    {((activePuzzle.specificData.data as any).solutions || []).map((sol: any, index: number) => {
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
                <View style={[styles.grid, { gap: gapOffset }]}>
                  {activePuzzle.grid.map((row, rIdx) => (
                    <View key={rIdx} style={[styles.row, { gap: gapOffset }]}>
                      {row.map((cell, cIdx) => {
                        let displayVal = cell;
                        let isSolutionValue = false;
                        let isBlack = isCrossword && cell === "#";
                        let isMaskNull = !isSudoku && !isCrossword && cell === null;

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

                        let cellBorders: any = {};
                        if (isMaskNull) {
                          cellBorders = { borderWidth: 0, borderColor: 'transparent' };
                        } else if (!isSudoku && !isCrossword && drawSolutions && hideSolutionGridBorders) {
                          cellBorders = { borderWidth: 0, borderColor: 'transparent' };
                        } else if (isSudoku) {
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
                                backgroundColor: isMaskNull 
                                  ? 'transparent'
                                  : (!isSudoku && !isCrossword && drawSolutions && hideSolutionGridBorders)
                                    ? 'transparent'
                                    : isBlack 
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
                            {!isBlack && !isMaskNull && (
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

                {!isSudoku && !isCrossword && drawSolutions && solutionStyleSetting === "Pill Outlines" && !solutionOverlayBehind && (
                  <Svg width={gridWidth} height={gridHeight} style={[styles.svgOverlay, { left: ideThemeSetting ? 12 : 0, top: ideThemeSetting ? 24 : 0 }]}>
                    {((activePuzzle.specificData.data as any).solutions || []).map((sol: any, index: number) => {
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
          const font = globalTheme?.fontProperties?.gridFont || el.content.fontFamily || "Modern Sans";
          const { fontSize } = enforceLargePrint(isLargePrint ?? false, el.content.fontSize || 10);
          const color = globalTheme?.secondaryColor || el.content.color || "#475569";
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
                    left: el.x + shiftX,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    zIndex: el.zIndex ?? 10,
                    transform: (el as any).rotation ? `rotate(${(el as any).rotation}deg)` : undefined,
                  }
                ]}
              >
                <Text style={[styles.wordBankTitle, { fontFamily: textFontFamily, color, fontSize: fontSize + 1 }]}>Word Bank</Text>
                <View style={styles.wordBankGrid}>
                  {wordRows.map((row, rIdx) => (
                    <View key={rIdx} style={styles.wordBankRow}>
                      {row.map((word, cIdx) => {
                        let finalWord = word;
                        if (globalTheme?.textCasing === 'uppercase') finalWord = finalWord.toUpperCase();
                        if (globalTheme?.textCasing === 'lowercase') finalWord = finalWord.toLowerCase();
                        return (
                          <View key={cIdx} style={styles.wordBankCell}>
                            <Text style={{ fontFamily: textFontFamily, color, fontSize }}>{prefix}{finalWord}</Text>
                          </View>
                        );
                      })}
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
                          {row.map((word, cIdx) => {
                            let finalWord = word;
                            if (globalTheme?.textCasing === 'uppercase') finalWord = finalWord.toUpperCase();
                            if (globalTheme?.textCasing === 'lowercase') finalWord = finalWord.toLowerCase();
                            return (
                              <View key={cIdx} style={styles.wordBankCell}>
                                <Text style={[styles.unplacedText, { fontFamily: textFontFamily, fontSize: fontSize - 0.5 }]}>{prefix}{finalWord}</Text>
                              </View>
                            );
                          })}
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
                    left: el.x + shiftX,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    zIndex: el.zIndex ?? 10,
                    transform: (el as any).rotation ? `rotate(${(el as any).rotation}deg)` : undefined,
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
                    left: el.x + shiftX,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    zIndex: el.zIndex ?? 10,
                    padding: 8,
                    transform: (el as any).rotation ? `rotate(${(el as any).rotation}deg)` : undefined,
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

const renderTextBlockPage = (
  page: PageState,
  pageSize: string,
  pageIndex: number,
  _pageDims: { width: number; height: number },
  totalPages: number
) => {
  let minInsideGutter = 27;
  if (totalPages > 150 && totalPages <= 300) minInsideGutter = 36;
  else if (totalPages > 300 && totalPages <= 500) minInsideGutter = 45;
  else if (totalPages > 500) minInsideGutter = 54;
  
  const minOutside = 18;
  const userInside = page.margin?.inside ?? 50;
  const userOutside = page.margin?.outside ?? 40;
  
  const insideMargin = Math.max(userInside, minInsideGutter + minOutside);
  const outsideMargin = Math.max(userOutside, minOutside);
  
  const isEvenPage = (pageIndex + 1) % 2 === 0;
  const rightMargin = isEvenPage ? insideMargin : outsideMargin;
  const leftMargin = isEvenPage ? outsideMargin : insideMargin;

  const align = page.title.toLowerCase().includes("copyright") ? 'left' : 'center';

  return (
    <Page
      key={`${page.id}-text`}
      size={pageSize.toUpperCase() as any}
      style={[styles.page, { backgroundColor: page.backgroundColor || '#ffffff', paddingLeft: leftMargin, paddingRight: rightMargin, paddingTop: page.margin?.top ?? 50, paddingBottom: page.margin?.bottom ?? 50 }]}
    >
      <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: align === 'left' ? 'flex-start' : 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 24, marginBottom: 20, textAlign: align as any, color: '#0f172a' }}>
          {page.title}
        </Text>
        <Text style={{ fontFamily: 'Helvetica', fontSize: 12, textAlign: align as any, color: '#334155', lineHeight: 1.5 }}>
          {page.textContent || ""}
        </Text>
      </View>
      <Text style={styles.footer} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
    </Page>
  );
};

const renderMiniSolutionGrid = (page: PageState, width: number, height: number) => {
  const activePuzzle = page.metadata;
  const isSudoku = activePuzzle.specificData.type === "Sudoku";
  const isCrossword = activePuzzle.specificData.type === "Crossword";
  const cols = activePuzzle.grid[0]?.length || 0;
  const rows = activePuzzle.grid.length || 0;

  const titleEl = page.gridLayout.find(e => e.type === "title");
  const gridEl = page.gridLayout.find(e => e.type === "grid");

  if (!gridEl) return null;

  const gridFont = gridEl.content.gridFont || activePuzzle.gridFont || "Modern Sans";
  const solutionStyleSetting = gridEl.content.solutionStyle || "Greyscale Mute";
  const solutionOverlayBehind = gridEl.content.solutionOverlayBehind ?? true;
  const hideSolutionGridBorders = gridEl.content.hideSolutionGridBorders ?? false;
  const gridFontFamily = fontStyleMap[gridFont] || 'Helvetica-Bold';

  const gapOffset = isSudoku || isCrossword ? 0 : (cols > 20 || rows > 20 ? 1 : 2);
  const titleHeight = 20;
  
  const maxCellSizeW = (width - (cols - 1) * gapOffset) / cols;
  const maxCellSizeH = (height - titleHeight - (rows - 1) * gapOffset) / rows;
  const cellSize = Math.max(2, Math.min(maxCellSizeW, maxCellSizeH));
  const step = cellSize + gapOffset;
  const gridWidth = cols * step - gapOffset;
  const gridHeight = rows * step - gapOffset;

  return (
    <View style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {titleEl && (
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#0f172a', marginBottom: 5 }}>
          {formatTitle(titleEl.content.text, titleEl.content.themeAccents)}
        </Text>
      )}
      <View style={[styles.gridOuter, { width: gridWidth + 3, height: gridHeight + 3, borderColor: '#475569', borderWidth: 1 }]}>
        {!isSudoku && !isCrossword && solutionStyleSetting === "Pill Outlines" && solutionOverlayBehind && (
          <Svg width={gridWidth} height={gridHeight} style={styles.svgOverlay}>
            {((activePuzzle.specificData.data as any).solutions || []).map((sol: any, index: number) => {
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
                  strokeWidth={1}
                  fill="none"
                />
              );
            })}
          </Svg>
        )}
        
        <View style={[styles.grid, { gap: gapOffset }]}>
          {activePuzzle.grid.map((row, rIdx) => (
            <View key={rIdx} style={[styles.row, { gap: gapOffset }]}>
              {row.map((cell, cIdx) => {
                let displayVal = cell;
                let isSolutionValue = false;
                let isBlack = isCrossword && cell === "#";
                let isMaskNull = !isSudoku && !isCrossword && cell === null;

                if (isSudoku) {
                  const isStarting = cell !== null;
                  if (!isStarting) {
                    displayVal = (activePuzzle.specificData.data as any).solution?.[rIdx]?.[cIdx] ?? null;
                    isSolutionValue = true;
                  }
                } else if (isCrossword) {
                  if (!isBlack) {
                    displayVal = (activePuzzle.specificData.data as any).solution?.[rIdx]?.[cIdx] ?? "";
                    isSolutionValue = true;
                  } else {
                    displayVal = "";
                  }
                }

                let cellBorders: any = {};
                if (isMaskNull) {
                  cellBorders = { borderWidth: 0, borderColor: 'transparent' };
                } else if (!isSudoku && !isCrossword && hideSolutionGridBorders) {
                  cellBorders = { borderWidth: 0, borderColor: 'transparent' };
                } else if (isSudoku) {
                  const borderTop = rIdx % 3 === 0 && rIdx !== 0 ? 1.5 : 0.5;
                  const borderLeft = cIdx % 3 === 0 && cIdx !== 0 ? 1.5 : 0.5;
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
                    borderWidth: 0.5,
                    borderColor: '#e2e8f0',
                  };
                }

                let cellTextOpacity = 1.0;
                let cellTextCol = '#1e293b';

                if (!isSudoku && !isCrossword) {
                  const inSol = isCellInSolution(cIdx, rIdx, (activePuzzle.specificData.data as any).solutions);
                  if (solutionStyleSetting === "Greyscale Mute") {
                    if (inSol) {
                      cellTextCol = '#4f46e5';
                    } else {
                      cellTextOpacity = 0.3;
                      cellTextCol = '#cbd5e1';
                    }
                  }
                } else {
                  if (isSolutionValue) {
                    cellTextCol = '#4f46e5';
                  }
                }

                return (
                  <View
                    key={cIdx}
                    style={[
                      styles.cell, 
                      cellBorders,
                      { 
                        width: cellSize, 
                        height: cellSize,
                        backgroundColor: isMaskNull 
                          ? 'transparent'
                          : (!isSudoku && !isCrossword && hideSolutionGridBorders)
                            ? 'transparent'
                            : isBlack 
                              ? '#1e293b' 
                              : isSudoku && isSolutionValue
                                ? '#f5f3ff'
                                : '#ffffff'
                      }
                    ]}
                  >
                    {!isBlack && !isMaskNull && (
                      <Text style={[
                        styles.cellText, 
                        { 
                          fontSize: cellSize * 0.6, 
                          fontFamily: isSudoku && cell !== null ? 'Helvetica-Bold' : gridFontFamily, 
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

        {!isSudoku && !isCrossword && solutionStyleSetting === "Pill Outlines" && !solutionOverlayBehind && (
          <Svg width={gridWidth} height={gridHeight} style={styles.svgOverlay}>
            {((activePuzzle.specificData.data as any).solutions || []).map((sol: any, index: number) => {
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
                  strokeWidth={1}
                  fill="none"
                />
              );
            })}
          </Svg>
        )}
      </View>
    </View>
  );
};

const renderPdfSolutionsGridPage = (
  chunk: PageState[],
  pageSize: string,
  pageIndex: number,
  pageDims: { width: number; height: number },
  totalPages: number,
  solutionsPerPage: number
) => {
  let minInsideGutter = 27; // <= 150
  if (totalPages > 150 && totalPages <= 300) minInsideGutter = 36;
  else if (totalPages > 300 && totalPages <= 500) minInsideGutter = 45;
  else if (totalPages > 500) minInsideGutter = 54;
  
  const minOutside = 18; // 0.25"
  
  const page = chunk[0];
  const userInside = page.margin?.inside ?? 50;
  const userOutside = page.margin?.outside ?? 40;
  
  const insideMargin = Math.max(userInside, minInsideGutter + minOutside);
  const outsideMargin = Math.max(userOutside, minOutside);
  
  const isEvenPage = (pageIndex + 1) % 2 === 0;
  const rightMargin = isEvenPage ? insideMargin : outsideMargin;
  const leftMargin = isEvenPage ? outsideMargin : insideMargin;
  
  const paddingTop = page.margin?.top ?? 50;
  const paddingBottom = page.margin?.bottom ?? 50;

  let cols = 1;
  let rows = 1;
  if (solutionsPerPage === 2) { cols = 1; rows = 2; }
  else if (solutionsPerPage === 4) { cols = 2; rows = 2; }
  else if (solutionsPerPage === 6) { cols = 2; rows = 3; }
  else if (solutionsPerPage === 9) { cols = 3; rows = 3; }

  const contentW = pageDims.width - leftMargin - rightMargin;
  const contentH = pageDims.height - paddingTop - paddingBottom - 20;

  return (
    <Page
      key={`sol-page-${pageIndex}`}
      size={pageSize.toUpperCase() as any}
      style={[styles.page, { backgroundColor: '#ffffff', paddingLeft: leftMargin, paddingRight: rightMargin, paddingTop, paddingBottom }]}
    >
      <View style={{ flex: 1, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start' }}>
        {chunk.map((solPage) => (
           <View key={solPage.id} style={{ width: `${100 / cols}%`, height: `${100 / rows}%`, padding: 5 }}>
             {renderMiniSolutionGrid(solPage, contentW / cols - 10, contentH / rows - 10)}
           </View>
        ))}
      </View>
      <Text style={styles.footer} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
    </Page>
  );
};

export function PdfDocument({
  pages,
  pageSize,
  includeSolutions,
  isSinglePage = false,
  solutionsPerPage = 1,
}: PdfDocumentProps) {
  const PAGE_SIZES: Record<string, { width: number, height: number }> = {
    "A4": { width: 595.28, height: 841.89 },
    "LETTER": { width: 612, height: 792 },
    "6X9_NO_BLEED": { width: 432, height: 648 },
    "6X9_BLEED": { width: 441, height: 666 },
    "8.5X11_NO_BLEED": { width: 612, height: 792 },
    "8.5X11_BLEED": { width: 621, height: 810 },
  };
  const norm = pageSize.toUpperCase();
  const pageDims = PAGE_SIZES[norm] || PAGE_SIZES["A4"];
  const puzPages = pages.filter(p => p.pageType !== "TEXT_BLOCK");
  const solutionCount = (!isSinglePage && includeSolutions) ? Math.ceil(puzPages.length / (solutionsPerPage || 1)) : 0;
  const totalPagesCount = pages.length + solutionCount;

  return (
    <Document>
      {/* 1. Normal Pages (Puzzle or Text Block) */}
      {pages.map((page, idx) => {
        if (page.pageType === "TEXT_BLOCK") {
          return renderTextBlockPage(page, pageSize, idx, pageDims, totalPagesCount);
        }
        return renderPdfPage(page, false, pageSize, idx, pageDims, totalPagesCount);
      })}

      {/* 2. Solution Pages */}
      {!isSinglePage && includeSolutions && (
        (solutionsPerPage && solutionsPerPage > 1) 
          ? chunkArray(puzPages, solutionsPerPage).map((chunk, _idx) => 
              renderPdfSolutionsGridPage(chunk, pageSize, _idx + pages.length, pageDims, totalPagesCount, solutionsPerPage)
            )
          : puzPages.map((page, idx) => 
              renderPdfPage(page, true, pageSize, idx + pages.length, pageDims, totalPagesCount)
            )
      )}
    </Document>
  );
}
