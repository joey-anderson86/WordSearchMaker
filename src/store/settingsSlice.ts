import { StateCreator } from 'zustand';
import { scalePageLayout } from '../utils/layoutHelper';

export interface SettingsSlice {
    pageSize: string;
    bookTitle: string;
    includeSolutions: boolean;
    defaultMargins: { top: number; bottom: number; left: number; right: number };
    defaultGridSnapSize: number;
    setBookTitle: (bookTitle: string) => void;
    setPageSize: (pageSize: string) => void;
    setIncludeSolutions: (includeSolutions: boolean) => void;
    setDefaultMargins: (margins: { top: number; bottom: number; left: number; right: number }) => void;
    setDefaultGridSnapSize: (size: number) => void;
}

export const createSettingsSlice: StateCreator<any, [], [], SettingsSlice> = (set) => ({
    pageSize: "A4",
    bookTitle: "My Word Search Book",
    includeSolutions: true,
    defaultMargins: { top: 40, bottom: 50, left: 40, right: 40 },
    defaultGridSnapSize: 10,
    setBookTitle: (bookTitle) => set({ bookTitle }),
    setPageSize: (pageSize) => set((state: any) => {
        const oldSize = state.pageSize;
        if (oldSize === pageSize) return {};
        
        const scaledPages = state.pages 
            ? state.pages.map((p: any) => scalePageLayout(p, oldSize, pageSize)) 
            : [];
            
        return {
            pageSize,
            pages: scaledPages,
            puzzles: scaledPages.map((p: any) => p.metadata)
        };
    }),
    setIncludeSolutions: (includeSolutions) => set({ includeSolutions }),
    setDefaultMargins: (defaultMargins) => set({ defaultMargins }),
    setDefaultGridSnapSize: (defaultGridSnapSize) => set({ defaultGridSnapSize }),
});
