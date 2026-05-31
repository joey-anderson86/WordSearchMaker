import { StateCreator } from 'zustand';
import { scalePageLayout } from '../utils/layoutHelper';

export interface SettingsSlice {
    viewMode: "interior" | "cover";
    pageSize: string;
    bookTitle: string;
    includeSolutions: boolean;
    defaultMargins: { top: number; bottom: number; inside: number; outside: number };
    defaultGridSnapSize: number;
    setViewMode: (mode: "interior" | "cover") => void;
    setBookTitle: (bookTitle: string) => void;
    setPageSize: (pageSize: string) => void;
    setIncludeSolutions: (includeSolutions: boolean) => void;
    setDefaultMargins: (margins: { top: number; bottom: number; inside: number; outside: number }) => void;
    setDefaultGridSnapSize: (size: number) => void;
}

export const createSettingsSlice: StateCreator<any, [], [], SettingsSlice> = (set) => ({
    viewMode: "interior",
    pageSize: "A4",
    bookTitle: "My Word Search Book",
    includeSolutions: true,
    defaultMargins: { top: 40, bottom: 50, inside: 50, outside: 40 },
    defaultGridSnapSize: 10,
    setViewMode: (viewMode) => set({ viewMode }),
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
