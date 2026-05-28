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
    addPuzzle: (puzzle: PuzzlePayload<WordSearchData>) => void;
    clearPuzzles: () => void;
}

export const useStore = create<AppState>((set) => ({
    puzzles: [],
    addPuzzle: (puzzle) => set((state) => ({ puzzles: [...state.puzzles, puzzle] })),
    clearPuzzles: () => set({ puzzles: [] }),
}));
