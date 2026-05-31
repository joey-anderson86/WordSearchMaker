import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPageDimensions } from '../../types/pageSizes';
import { fontStyleMap } from '../../utils/fonts';

interface CoverDocumentProps {
    pageSize: string;
    pageCount: number; // exact number of pages
    bgImage: string | null;
    bgColor: string;
    title: string;
    subtitle: string;
    author: string;
    spineText: string;
    titleFont: string;
    titleColor: string;
    titleSize: number;
}

export function CoverDocument({
    pageSize,
    pageCount,
    bgImage,
    bgColor,
    title,
    subtitle,
    author,
    spineText,
    titleFont,
    titleColor,
    titleSize
}: CoverDocumentProps) {
    // 1 inch = 72 pt
    const bleedPt = 0.125 * 72; // 9pt
    const spineWidthPt = Math.max((pageCount * 0.002252) * 72, 10); // Minimum 10pt for visibility if low page count
    
    const dims = getPageDimensions(pageSize);
    const trimWidth = dims.width;
    const trimHeight = dims.height;
    
    // Total physical size
    const totalWidth = (trimWidth * 2) + spineWidthPt + (bleedPt * 2);
    const totalHeight = trimHeight + (bleedPt * 2);
    
    const styles = StyleSheet.create({
        page: {
            flexDirection: 'row',
            width: totalWidth,
            height: totalHeight,
            backgroundColor: bgColor,
        },
        bgImage: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: totalWidth,
            height: totalHeight,
        },
        backCover: {
            width: trimWidth + bleedPt,
            height: totalHeight,
            position: 'relative',
        },
        spine: {
            width: spineWidthPt,
            height: totalHeight,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
        },
        frontCover: {
            width: trimWidth + bleedPt,
            height: totalHeight,
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
        },
        barcodeArea: {
            position: 'absolute',
            bottom: bleedPt + 18, // 0.25" = 18pt from trim edge
            right: 18,
            // Actually, if we want it bottom-right of the BACK cover, it means near the spine. 
            // So `right: 18` works because we're inside the `backCover` flex container.
            width: 144, // 2" = 144pt
            height: 86.4, // 1.2" = 86.4pt
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
        },
        barcodeText: {
            fontSize: 8,
            color: '#666',
            fontFamily: 'Helvetica',
        },
        spineText: {
            transform: 'rotate(-90deg)',
            transformOrigin: 'center center',
            fontSize: 10,
            color: titleColor,
            fontFamily: fontStyleMap[titleFont] || 'Helvetica-Bold',
        },
        frontTitle: {
            fontSize: titleSize,
            color: titleColor,
            fontFamily: fontStyleMap[titleFont] || 'Helvetica-Bold',
            textAlign: 'center',
            marginBottom: 10,
            paddingHorizontal: 20,
        },
        frontSubtitle: {
            fontSize: titleSize * 0.4,
            color: titleColor,
            fontFamily: fontStyleMap[titleFont] || 'Helvetica',
            textAlign: 'center',
            marginBottom: 40,
        },
        frontAuthor: {
            fontSize: titleSize * 0.3,
            color: titleColor,
            fontFamily: fontStyleMap[titleFont] || 'Helvetica',
            position: 'absolute',
            bottom: bleedPt + 36,
            textAlign: 'center',
            width: '100%',
        }
    });

    return (
        <Document>
            <Page size={[totalWidth, totalHeight]} style={styles.page}>
                {bgImage && (
                    <Image src={bgImage} style={styles.bgImage} />
                )}
                
                {/* Back Cover Zone */}
                <View style={styles.backCover}>
                    {/* Barcode Reservation Area */}
                    <View style={styles.barcodeArea}>
                        <Text style={styles.barcodeText}>Barcode / ISBN</Text>
                    </View>
                </View>
                
                {/* Spine Zone */}
                <View style={styles.spine}>
                    <Text style={styles.spineText}>{spineText}</Text>
                </View>
                
                {/* Front Cover Zone */}
                <View style={styles.frontCover}>
                    <Text style={styles.frontTitle}>{title}</Text>
                    {subtitle && <Text style={styles.frontSubtitle}>{subtitle}</Text>}
                    {author && <Text style={styles.frontAuthor}>{author}</Text>}
                </View>
            </Page>
        </Document>
    );
}
