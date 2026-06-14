import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { CoverState } from '../../store/coverSlice';
import { calculateCoverDimensions } from '../../utils/layoutHelper';
import { registerFonts, fontStyleMap } from '../../utils/fonts';

registerFonts();

export interface CoverDocumentProps {
  coverState: CoverState;
  pageCount: number;
  trimWidth: number; // in inches, e.g., 8.5
  trimHeight: number; // in inches, e.g., 11
}

export const CoverDocument: React.FC<CoverDocumentProps> = ({
  coverState,
  pageCount,
  trimWidth,
  trimHeight,
}) => {
  const {
    paperType,
    coverBgColor,
    coverBgImage,
    coverElements,
    coverArtLayers,
  } = coverState;

  const dims = calculateCoverDimensions(trimWidth, trimHeight, pageCount, paperType);

  const styles = StyleSheet.create({
    page: {
      width: dims.totalWidthPt,
      height: dims.totalHeightPt,
      backgroundColor: coverBgColor,
      position: 'relative',
    },
    bgImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: dims.totalWidthPt,
      height: dims.totalHeightPt,
      zIndex: -1,
    },
    barcodeArea: {
      position: 'absolute',
      bottom: dims.bleedPt + 18, // 0.25 inch from bottom trim
      right: dims.trimWidthPt + dims.spineWidthPt + dims.bleedPt + 18, // 0.25 inch from spine fold on the back cover
      width: 2 * 72, // 2 inches
      height: 1.2 * 72, // 1.2 inches
      backgroundColor: '#ffffff', // Must be white per KDP guidelines
    },
  });

  return (
    <Document>
      <Page size={[dims.totalWidthPt, dims.totalHeightPt]} style={styles.page}>
        {/* Global Background Image */}
        {coverBgImage && (
          <Image src={coverBgImage} style={styles.bgImage} />
        )}

        {/* KDP Barcode Safe Area */}
        <View style={styles.barcodeArea} />

        {/* Art Layers */}
        {coverArtLayers.map((art) => (
          <Image
            key={art.id}
            src={art.url}
            style={{
              position: 'absolute',
              left: art.x, // Absolute coordinate relative to the spread
              top: art.y,
              width: art.width,
              height: art.height,
              opacity: art.opacity ?? 1,
            }}
          />
        ))}

        {/* Text Elements */}
        {coverElements.map((el) => {
          const isSpine = el.type === 'spine';
          return (
            <View
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: isSpine ? 'rotate(-90deg)' : (el as any).rotation ? `rotate(${(el as any).rotation}deg)` : 'none',
                transformOrigin: '50% 50%',
                display: 'flex',
                justifyContent: el.content.align === 'center' ? 'center' : (el.content.align === 'right' ? 'flex-end' : 'flex-start'),
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: el.content.color || '#000000',
                  fontSize: el.content.fontSize ?? 12,
                  fontFamily: fontStyleMap[el.content.fontFamily] || 'Helvetica',
                  textAlign: el.content.align as any,
                }}
              >
                {el.content.text}
              </Text>
            </View>
          );
        })}
      </Page>
    </Document>
  );
};
