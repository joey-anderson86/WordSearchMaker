export interface PageDimension {
  width: number;
  height: number;
}

export const PAGE_SIZES: Record<string, PageDimension> = {
  "A4": { width: 595.28, height: 841.89 },
  "LETTER": { width: 612, height: 792 },
  "6X9_NO_BLEED": { width: 432, height: 648 },
  "6X9_BLEED": { width: 441, height: 666 },
  "8.5X11_NO_BLEED": { width: 612, height: 792 },
  "8.5X11_BLEED": { width: 621, height: 810 },
};

export function getPageDimensions(size: string): PageDimension {
  const norm = size.toUpperCase();
  return PAGE_SIZES[norm] || PAGE_SIZES["A4"];
}

export const KDP_PAPER_THICKNESS = {
  white: 0.002252,
  cream: 0.0025,
};

export const KDP_COVER_BLEED = 0.125;
