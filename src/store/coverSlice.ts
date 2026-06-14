import { StateCreator } from 'zustand';
import { ArtLayer } from '../types/generated/ArtLayer';

export interface CoverState {
    paperType: "white" | "cream";
    frontCoverArt: ArtLayer[];
    coverBgImage: string | null;
    coverBgColor: string;
    coverTitle: string;
    coverSubtitle: string;
    coverAuthor: string;
    coverSpineText: string;
    coverTitleFont: string;
    coverTitleColor: string;
    coverTitleSize: number;
    
    setPaperType: (type: "white" | "cream") => void;
    setFrontCoverArt: (art: ArtLayer[]) => void;
    setCoverBgImage: (base64: string | null) => void;
    setCoverBgColor: (color: string) => void;
    setCoverTitle: (title: string) => void;
    setCoverSubtitle: (subtitle: string) => void;
    setCoverAuthor: (author: string) => void;
    setCoverSpineText: (text: string) => void;
    setCoverTitleFont: (font: string) => void;
    setCoverTitleColor: (color: string) => void;
    setCoverTitleSize: (size: number) => void;
}

export const createCoverSlice: StateCreator<any, [], [], CoverState> = (set) => ({
    paperType: "white",
    frontCoverArt: [],
    coverBgImage: null,
    coverBgColor: "#1e293b",
    coverTitle: "My Word Search Book",
    coverSubtitle: "100 Themed Puzzles",
    coverAuthor: "Author Name",
    coverSpineText: "My Word Search Book",
    coverTitleFont: "Modern Sans",
    coverTitleColor: "#ffffff",
    coverTitleSize: 42,
    
    setPaperType: (paperType) => set({ paperType }),
    setFrontCoverArt: (frontCoverArt) => set({ frontCoverArt }),
    setCoverBgImage: (coverBgImage) => set({ coverBgImage }),
    setCoverBgColor: (coverBgColor) => set({ coverBgColor }),
    setCoverTitle: (coverTitle) => set({ coverTitle }),
    setCoverSubtitle: (coverSubtitle) => set({ coverSubtitle }),
    setCoverAuthor: (coverAuthor) => set({ coverAuthor }),
    setCoverSpineText: (coverSpineText) => set({ coverSpineText }),
    setCoverTitleFont: (coverTitleFont) => set({ coverTitleFont }),
    setCoverTitleColor: (coverTitleColor) => set({ coverTitleColor }),
    setCoverTitleSize: (coverTitleSize) => set({ coverTitleSize }),
});
