import { create } from 'zustand';

export interface WordPlacement {
    word: string;
    start_x: number;
    start_y: number;
    end_x: number;
    end_y: number;
}

export interface WordSearchData {
    word_bank: string[];
    unplaced_words: string[];
    solutions: WordPlacement[];
}

export interface PuzzlePayload<T> {
    id: string;
    puzzle_type: "WordSearch";
    title: string;
    grid: string[][];
    specific_data: T;
}

interface AppState {
    puzzles: PuzzlePayload<WordSearchData>[];
    selectedPuzzleId: string | null;
    pageSize: string;
    bookTitle: string;
    includeSolutions: boolean;
    setBookTitle: (bookTitle: string) => void;
    setPageSize: (pageSize: string) => void;
    setIncludeSolutions: (includeSolutions: boolean) => void;
    setSelectedPuzzleId: (id: string | null) => void;
    addPuzzle: (puzzle: PuzzlePayload<WordSearchData>) => void;
    updatePuzzle: (id: string, updated: PuzzlePayload<WordSearchData>) => void;
    deletePuzzle: (id: string) => void;
    reorderPuzzles: (startIndex: number, endIndex: number) => void;
    clearPuzzles: () => void;
}

export const useStore = create<AppState>((set) => ({
    puzzles: [],
    selectedPuzzleId: null,
    pageSize: "A4",
    bookTitle: "My Word Search Book",
    includeSolutions: true,
    setBookTitle: (bookTitle) => set({ bookTitle }),
    setPageSize: (pageSize) => set({ pageSize }),
    setIncludeSolutions: (includeSolutions) => set({ includeSolutions }),
    setSelectedPuzzleId: (selectedPuzzleId) => set({ selectedPuzzleId }),
    addPuzzle: (puzzle) => set((state) => {
        const nextPuzzles = [...state.puzzles, puzzle];
        return {
            puzzles: nextPuzzles,
            selectedPuzzleId: state.selectedPuzzleId || puzzle.id, // select it if none selected
        };
    }),
    updatePuzzle: (id, updated) => set((state) => ({
        puzzles: state.puzzles.map((p) => p.id === id ? updated : p),
    })),
    deletePuzzle: (id) => set((state) => {
        const nextPuzzles = state.puzzles.filter((p) => p.id !== id);
        let nextSelectedId = state.selectedPuzzleId;
        if (state.selectedPuzzleId === id) {
            nextSelectedId = nextPuzzles.length > 0 ? nextPuzzles[0].id : null;
        }
        return {
            puzzles: nextPuzzles,
            selectedPuzzleId: nextSelectedId,
        };
    }),
    reorderPuzzles: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.puzzles);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { puzzles: result };
    }),
    clearPuzzles: () => set({ puzzles: [], selectedPuzzleId: null }),
}));
