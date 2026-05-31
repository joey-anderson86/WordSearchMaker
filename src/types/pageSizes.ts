export interface PageDimension {
  width: number;
  height: number;
}

export const PAGE_SIZES: Record<string, PageDimension> = {
  "A4": { width: 595, height: 841 },
  "LETTER": { width: 612, height: 792 },
};

export function getPageDimensions(size: string): PageDimension {
  const norm = size.toUpperCase();
  return PAGE_SIZES[norm] || PAGE_SIZES["A4"];
}
