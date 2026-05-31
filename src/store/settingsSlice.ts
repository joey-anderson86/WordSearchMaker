import { StateCreator } from 'zustand';

export interface SettingsSlice {
    pageSize: string;
    bookTitle: string;
    includeSolutions: boolean;
    setBookTitle: (bookTitle: string) => void;
    setPageSize: (pageSize: string) => void;
    setIncludeSolutions: (includeSolutions: boolean) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (set) => ({
    pageSize: "A4",
    bookTitle: "My Word Search Book",
    includeSolutions: true,
    setBookTitle: (bookTitle) => set({ bookTitle }),
    setPageSize: (pageSize) => set({ pageSize }),
    setIncludeSolutions: (includeSolutions) => set({ includeSolutions }),
});
