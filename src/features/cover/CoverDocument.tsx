import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { CoverState } from '../../store/coverSlice';
import { calculateCoverDimensions } from '../../utils/layoutHelper';

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
    coverTitle,
    coverSubtitle,
    coverAuthor,
    coverSpineText,
    coverTitleFont,
    coverTitleColor,
    coverTitleSize,
    frontCoverArt,
    coverBgImage,
  } = coverState;

  const dims = calculateCoverDimensions(trimWidth, trimHeight, pageCount, paperType);

  const styles = StyleSheet.create({
    page: {
      width: dims.totalWidthPt,
      height: dims.totalHeightPt,
      backgroundColor: coverBgColor,
      flexDirection: 'row',
      position: 'relative',
    },
    backCover: {
      width: dims.bleedPt + dims.trimWidthPt,
      height: '100%',
      position: 'relative',
    },
    spine: {
      width: dims.spineWidthPt,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    frontCover: {
      width: dims.trimWidthPt + dims.bleedPt,
      height: '100%',
      position: 'relative',
      paddingTop: dims.bleedPt + 72, // 1 inch padding from top trim
      paddingLeft: 36,
      paddingRight: dims.bleedPt + 36,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    barcodeArea: {
      position: 'absolute',
      bottom: dims.bleedPt + 18, // 0.25 inch from bottom trim
      right: 18, // 0.25 inch from spine fold
      width: 2 * 72, // 2 inches
      height: 1.2 * 72, // 1.2 inches
      backgroundColor: '#ffffff', // Must be white per KDP guidelines
    },
    spineTextContainer: {
      width: dims.totalHeightPt,
      height: dims.spineWidthPt,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transform: 'rotate(270deg)', // Rotated 270 degrees per standard KDP
      transformOrigin: '50% 50%',
    },
    spineText: {
      fontSize: Math.min(12, Math.max(6, dims.spineWidthPt - 9)), // Ensure text fits in spine with 0.0625" (4.5pt) clearance on each side
      color: coverTitleColor,
      fontFamily: coverTitleFont === 'Modern Sans' ? 'Helvetica' : 'Helvetica', // Fallback font, update if registering fonts
      textAlign: 'center',
    },
    title: {
      fontSize: coverTitleSize,
      color: coverTitleColor,
      fontFamily: coverTitleFont === 'Modern Sans' ? 'Helvetica' : 'Helvetica', // Fallback font
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: coverTitleSize * 0.5,
      color: coverTitleColor,
      fontFamily: coverTitleFont === 'Modern Sans' ? 'Helvetica' : 'Helvetica', // Fallback font
      textAlign: 'center',
      marginBottom: 20,
    },
    author: {
      fontSize: coverTitleSize * 0.4,
      color: coverTitleColor,
      fontFamily: coverTitleFont === 'Modern Sans' ? 'Helvetica' : 'Helvetica', // Fallback font
      textAlign: 'center',
      marginTop: 'auto', // push to bottom
      marginBottom: dims.bleedPt + 72,
    },
    bgImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: dims.totalWidthPt,
      height: dims.totalHeightPt,
      zIndex: -1,
    },
  });

  return (
    <Document>
      <Page size={[dims.totalWidthPt, dims.totalHeightPt]} style={styles.page}>
        {/* Global Background Image */}
        {coverBgImage && (
          <Image src={coverBgImage} style={styles.bgImage} />
        )}

        {/* Back Cover Zone */}
        <View style={styles.backCover}>
          {/* 2" x 1.2" KDP Barcode Safe Area */}
          <View style={styles.barcodeArea} />
        </View>

        {/* Spine Zone */}
        <View style={styles.spine}>
          {/* Ensure spine is wide enough for text (typically >100 pages, but we clamp size) */}
          <View style={styles.spineTextContainer}>
            <Text style={styles.spineText}>{coverSpineText}</Text>
          </View>
        </View>

        {/* Front Cover Zone */}
        <View style={styles.frontCover}>
          <Text style={styles.title}>{coverTitle}</Text>
          {coverSubtitle && <Text style={styles.subtitle}>{coverSubtitle}</Text>}
          
          {/* Front Cover Art Layers */}
          {frontCoverArt.map((art) => (
             <Image
               key={art.id}
               src={art.url}
               style={{
                 position: 'absolute',
                 left: art.x + dims.bleedPt, // Relative to front cover trim edge
                 top: art.y + dims.bleedPt,
                 width: art.width,
                 height: art.height,
                 opacity: art.opacity ?? 1,
               }}
             />
          ))}

          <Text style={styles.author}>{coverAuthor}</Text>
        </View>
      </Page>
    </Document>
  );
};
