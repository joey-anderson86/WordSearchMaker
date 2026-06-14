import { StateCreator } from 'zustand';
import { ArtLayer } from '../types/generated/ArtLayer';
import { GridElement } from '../types/generated/GridElement';

export interface CoverState {
    paperType: "white" | "cream";
    coverBgImage: string | null;
    coverBgColor: string;
    
    coverElements: GridElement[];
    coverArtLayers: ArtLayer[];
    selectedCoverElementId: string | null;

    setPaperType: (type: "white" | "cream") => void;
    setCoverBgImage: (base64: string | null) => void;
    setCoverBgColor: (color: string) => void;
    
    setCoverElements: (elements: GridElement[]) => void;
    addCoverElement: (element: GridElement) => void;
    updateCoverElement: (elementId: string, updates: Partial<GridElement>) => void;
    deleteCoverElement: (elementId: string) => void;
    
    setCoverArtLayers: (layers: ArtLayer[]) => void;
    addCoverArtLayer: (layer: ArtLayer) => void;
    updateCoverArtLayer: (layerId: string, updates: Partial<ArtLayer>) => void;
    deleteCoverArtLayer: (layerId: string) => void;

    setSelectedCoverElementId: (id: string | null) => void;
}

const defaultCoverElements: GridElement[] = [
    {
        id: 'title',
        type: 'title',
        x: 600, // Approximate starting X on the front cover spread
        y: 150,
        width: 300,
        height: 60,
        zIndex: 10,
        content: {
            text: "My Word Search Book",
            fontFamily: "Modern Sans",
            fontSize: 42,
            color: "#ffffff",
            align: "center",
        }
    },
    {
        id: 'subtitle',
        type: 'title',
        x: 600,
        y: 230,
        width: 300,
        height: 40,
        zIndex: 10,
        content: {
            text: "100 Themed Puzzles",
            fontFamily: "Modern Sans",
            fontSize: 24,
            color: "#ffffff",
            align: "center",
        }
    },
    {
        id: 'author',
        type: 'title',
        x: 600,
        y: 600,
        width: 300,
        height: 40,
        zIndex: 10,
        content: {
            text: "Author Name",
            fontFamily: "Modern Sans",
            fontSize: 18,
            color: "#ffffff",
            align: "center",
        }
    },
    {
        id: 'spine',
        type: 'spine', // custom type just to note it's spine text, but it's treated similarly to title
        x: 405, // Approximate center of the spine
        y: 350,
        width: 500, // width is the text length along the spine
        height: 30, // height is the width of the spine text
        zIndex: 10,
        content: {
            text: "My Word Search Book",
            fontFamily: "Modern Sans",
            fontSize: 12,
            color: "#ffffff",
            align: "center",
        }
    }
];

export const createCoverSlice: StateCreator<any, [], [], CoverState> = (set) => ({
    paperType: "white",
    coverBgImage: null,
    coverBgColor: "#1e293b",
    
    coverElements: defaultCoverElements,
    coverArtLayers: [],
    selectedCoverElementId: null,
    
    setPaperType: (paperType) => set({ paperType }),
    setCoverBgImage: (coverBgImage) => set({ coverBgImage }),
    setCoverBgColor: (coverBgColor) => set({ coverBgColor }),
    
    setCoverElements: (coverElements) => set({ coverElements }),
    addCoverElement: (element) => set((state: CoverState) => ({
        coverElements: [...state.coverElements, element]
    })),
    updateCoverElement: (elementId, updates) => set((state: CoverState) => ({
        coverElements: state.coverElements.map(el =>
            el.id === elementId ? { ...el, ...updates, content: { ...el.content, ...updates.content } } : el
        )
    })),
    deleteCoverElement: (elementId) => set((state: CoverState) => ({
        coverElements: state.coverElements.filter(el => el.id !== elementId),
        selectedCoverElementId: state.selectedCoverElementId === elementId ? null : state.selectedCoverElementId
    })),

    setCoverArtLayers: (coverArtLayers) => set({ coverArtLayers }),
    addCoverArtLayer: (layer) => set((state: CoverState) => ({
        coverArtLayers: [...state.coverArtLayers, layer]
    })),
    updateCoverArtLayer: (layerId, updates) => set((state: CoverState) => ({
        coverArtLayers: state.coverArtLayers.map(l =>
            l.id === layerId ? { ...l, ...updates } : l
        )
    })),
    deleteCoverArtLayer: (layerId) => set((state: CoverState) => ({
        coverArtLayers: state.coverArtLayers.filter(l => l.id !== layerId),
        selectedCoverElementId: state.selectedCoverElementId === layerId ? null : state.selectedCoverElementId
    })),

    setSelectedCoverElementId: (id) => set({ selectedCoverElementId: id })
});
