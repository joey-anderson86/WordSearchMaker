import { StateCreator } from 'zustand';
import { PageState } from '../types/generated/PageState';
import { PuzzlePayload } from '../types/generated/PuzzlePayload';
import { ArtLayer } from '../types/generated/ArtLayer';
import { createDefaultPageState } from '../utils/layoutHelper';

export interface PuzzleSlice {
    pages: PageState[];
    puzzles: PuzzlePayload[];
    selectedPageId: string | null;
    selectedPuzzleId: string | null; // For backwards compatibility
    selectedElementId: string | null;
    
    setSelectedPageId: (id: string | null) => void;
    setSelectedPuzzleId: (id: string | null) => void; // For backwards compatibility
    setSelectedElementId: (id: string | null) => void;
    
    addPage: (page: PageState) => void;
    insertPage: (index: number, page: PageState) => void;
    addPuzzle: (puzzle: PuzzlePayload) => void;
    
    updatePage: (id: string, updated: PageState) => void;
    updatePuzzle: (id: string, updated: PuzzlePayload) => void;
    
    deletePage: (id: string) => void;
    deletePuzzle: (id: string) => void;
    
    reorderPages: (startIndex: number, endIndex: number) => void;
    reorderPuzzles: (startIndex: number, endIndex: number) => void;
    
    clearPages: () => void;
    clearPuzzles: () => void;
    
    updatePageElementLayout: (pageId: string, elementId: string, layout: { x?: number, y?: number, width?: number, height?: number }) => void;
    updatePageElementContent: (pageId: string, elementId: string, contentUpdates: any) => void;
    addArtLayer: (pageId: string, layer: ArtLayer) => void;
    deleteArtLayer: (pageId: string, layerId: string) => void;
    updateArtLayer: (pageId: string, layerId: string, updates: Partial<ArtLayer>) => void;
    resetPageLayout: (pageId: string, pageSize: string) => void;
    
    updatePageMargin: (pageId: string, margin: { top?: number; bottom?: number; inside?: number; outside?: number }) => void;
    updatePageSnapSize: (pageId: string, snapSize: number) => void;
    updatePageShowMargins: (pageId: string, show: boolean) => void;
}

export const createPuzzleSlice: StateCreator<any, [], [], PuzzleSlice> = (set, get) => ({
    pages: [],
    puzzles: [],
    selectedPageId: null,
    selectedPuzzleId: null,
    selectedElementId: null,
    
    setSelectedPageId: (selectedPageId) => set({ 
        selectedPageId, 
        selectedPuzzleId: selectedPageId,
        selectedElementId: null // Clear selected element on page swap
    }),
    setSelectedPuzzleId: (id) => get().setSelectedPageId(id),
    setSelectedElementId: (selectedElementId) => set({ selectedElementId }),
    
    addPage: (page) => set((state: any) => {
        const nextPages = [...state.pages, page];
        const nextPuzzles = nextPages.map(p => p.metadata);
        return {
            pages: nextPages,
            puzzles: nextPuzzles,
            selectedPageId: state.selectedPageId || page.id,
            selectedPuzzleId: state.selectedPuzzleId || page.id,
        };
    }),
    insertPage: (index, page) => set((state: any) => {
        const nextPages = [...state.pages];
        nextPages.splice(index, 0, page);
        const nextPuzzles = nextPages.map(p => p.metadata);
        return {
            pages: nextPages,
            puzzles: nextPuzzles,
            selectedPageId: page.id,
            selectedPuzzleId: page.id,
        };
    }),
    addPuzzle: (puzzle) => {
        // Automatically wrap PuzzlePayload in a PageState layout
        const pageSize = get().pageSize || "A4";
        const defaultMargins = get().defaultMargins || { top: 40, bottom: 50, inside: 50, outside: 40 };
        const defaultGridSnapSize = get().defaultGridSnapSize ?? 10;
        const page = createDefaultPageState(puzzle, pageSize, defaultMargins, defaultGridSnapSize);
        get().addPage(page);
    },
    
    updatePage: (id, updated) => set((state: any) => {
        const nextPages = state.pages.map((p: PageState) => p.id === id ? updated : p);
        const nextPuzzles = nextPages.map((p: PageState) => p.metadata);
        return {
            pages: nextPages,
            puzzles: nextPuzzles,
        };
    }),
    updatePuzzle: (id, updated) => {
        const page = get().pages.find((p: PageState) => p.id === id);
        if (page) {
            get().updatePage(id, {
                ...page,
                title: updated.title,
                metadata: updated,
            });
        }
    },
    
    deletePage: (id) => set((state: any) => {
        const nextPages = state.pages.filter((p: PageState) => p.id !== id);
        const nextPuzzles = nextPages.map((p: PageState) => p.metadata);
        
        let nextSelectedId = state.selectedPageId;
        if (state.selectedPageId === id) {
            nextSelectedId = nextPages.length > 0 ? nextPages[0].id : null;
        }
        
        return {
            pages: nextPages,
            puzzles: nextPuzzles,
            selectedPageId: nextSelectedId,
            selectedPuzzleId: nextSelectedId,
            selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        };
    }),
    deletePuzzle: (id) => get().deletePage(id),
    
    reorderPages: (startIndex, endIndex) => set((state: any) => {
        const result = Array.from(state.pages);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        const puzzles = result.map((p: any) => p.metadata);
        return { pages: result, puzzles };
    }),
    reorderPuzzles: (startIndex, endIndex) => get().reorderPages(startIndex, endIndex),
    
    clearPages: () => set({ pages: [], puzzles: [], selectedPageId: null, selectedPuzzleId: null, selectedElementId: null }),
    clearPuzzles: () => get().clearPages(),
    
    updatePageElementLayout: (pageId, elementId, layout) => set((state: any) => {
        const page = state.pages.find((p: PageState) => p.id === pageId);
        if (!page) return {};
        
        const newLayout = page.gridLayout.map((el: any) => {
          if (el.id === elementId) {
            return {
              ...el,
              x: layout.x !== undefined ? layout.x : el.x,
              y: layout.y !== undefined ? layout.y : el.y,
              width: layout.width !== undefined ? layout.width : el.width,
              height: layout.height !== undefined ? layout.height : el.height,
            };
          }
          return el;
        });
        
        const updatedPage = { ...page, gridLayout: newLayout };
        return {
            pages: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p)
        };
    }),
    
    updatePageElementContent: (pageId, elementId, contentUpdates) => set((state: any) => {
        const page = state.pages.find((p: PageState) => p.id === pageId);
        if (!page) return {};
        
        const newLayout = page.gridLayout.map((el: any) => {
          if (el.id === elementId) {
            return {
              ...el,
              content: {
                ...el.content,
                ...contentUpdates
              }
            };
          }
          return el;
        });
        
        const updatedPage = { ...page, gridLayout: newLayout };
        
        // Also sync puzzle title if it's the title element
        if (elementId === "title" && contentUpdates.text !== undefined) {
            updatedPage.title = contentUpdates.text;
            updatedPage.metadata = {
                ...updatedPage.metadata,
                title: contentUpdates.text
            };
        }
        
        return {
            pages: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p),
            puzzles: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p).map((p: any) => p.metadata)
        };
    }),
    
    addArtLayer: (pageId, layer) => set((state: any) => {
        const page = state.pages.find((p: PageState) => p.id === pageId);
        if (!page) return {};
        
        const updatedPage = {
            ...page,
            artLayers: [...page.artLayers, layer]
        };
        
        return {
            pages: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p)
        };
    }),
    
    deleteArtLayer: (pageId, layerId) => set((state: any) => {
        const page = state.pages.find((p: PageState) => p.id === pageId);
        if (!page) return {};
        
        const updatedPage = {
            ...page,
            artLayers: page.artLayers.filter((l: any) => l.id !== layerId)
        };
        
        return {
            pages: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p),
            selectedElementId: state.selectedElementId === layerId ? null : state.selectedElementId
        };
    }),
    
    updateArtLayer: (pageId, layerId, updates) => set((state: any) => {
        const page = state.pages.find((p: PageState) => p.id === pageId);
        if (!page) return {};
        
        const updatedPage = {
            ...page,
            artLayers: page.artLayers.map((l: any) => l.id === layerId ? { ...l, ...updates } : l)
        };
        
        return {
            pages: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p)
        };
    }),
    
    resetPageLayout: (pageId, pageSize) => set((state: any) => {
        const page = state.pages.find((p: PageState) => p.id === pageId);
        if (!page) return {};
        
        const defaultMargins = get().defaultMargins || { top: 40, bottom: 50, inside: 50, outside: 40 };
        const defaultGridSnapSize = get().defaultGridSnapSize ?? 10;
        const defaults = createDefaultPageState(page.metadata, pageSize, defaultMargins, defaultGridSnapSize);
        const updatedPage = {
            ...page,
            gridLayout: defaults.gridLayout,
            artLayers: [],
            backgroundColor: "#ffffff",
            themeColor: "#4f46e5",
            margin: defaults.margin,
            gridSnapSize: defaults.gridSnapSize,
            showMargins: defaults.showMargins
        };
        
        return {
            pages: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p)
        };
    }),
    
    updatePageMargin: (pageId, marginUpdates) => set((state: any) => {
        const page = state.pages.find((p: PageState) => p.id === pageId);
        if (!page) return {};
        
        const updatedPage = {
            ...page,
            margin: {
                top: page.margin?.top ?? 40,
                bottom: page.margin?.bottom ?? 50,
                inside: page.margin?.inside ?? 50,
                outside: page.margin?.outside ?? 40,
                ...marginUpdates
            }
        };
        return {
            pages: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p)
        };
    }),
    
    updatePageSnapSize: (pageId, snapSize) => set((state: any) => {
        const page = state.pages.find((p: PageState) => p.id === pageId);
        if (!page) return {};
        
        const updatedPage = {
            ...page,
            gridSnapSize: snapSize
        };
        return {
            pages: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p)
        };
    }),
    
    updatePageShowMargins: (pageId, show) => set((state: any) => {
        const page = state.pages.find((p: PageState) => p.id === pageId);
        if (!page) return {};
        
        const updatedPage = {
            ...page,
            showMargins: show
        };
        return {
            pages: state.pages.map((p: PageState) => p.id === pageId ? updatedPage : p)
        };
    })
});
