import { create } from 'zustand';

export type PuzzlePayloadType = "WordSearch" | "Sudoku" | "Crossword";

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

export interface SudokuData {
    difficulty: "easy" | "medium" | "hard" | "expert";
    solution: number[][];
}

export interface CrosswordClue {
    id: string;
    number: number;
    direction: "across" | "down";
    row: number;
    col: number;
    clue: string;
    answer: string;
}

export interface CrosswordClueInput {
    word: string;
    clue: string;
}

export interface CrosswordData {
    difficulty: "easy" | "medium" | "hard";
    solution: string[][];
    clues: CrosswordClue[];
    word_bank: CrosswordClueInput[];
    unplaced_words: CrosswordClueInput[];
}

export interface PuzzlePayload<T = any> {
    id: string;
    puzzle_type: PuzzlePayloadType;
    title: string;
    grid: (string | number | null)[][];
    specific_data: T;
}

interface AppState {
    puzzles: PuzzlePayload<any>[];
    selectedPuzzleId: string | null;
    pageSize: string;
    bookTitle: string;
    includeSolutions: boolean;
    setBookTitle: (bookTitle: string) => void;
    setPageSize: (pageSize: string) => void;
    setIncludeSolutions: (includeSolutions: boolean) => void;
    setSelectedPuzzleId: (id: string | null) => void;
    addPuzzle: (puzzle: PuzzlePayload<any>) => void;
    updatePuzzle: (id: string, updated: PuzzlePayload<any>) => void;
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
