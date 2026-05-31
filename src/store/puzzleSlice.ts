import { StateCreator } from 'zustand';
import { PuzzlePayload } from '../types/generated/PuzzlePayload';

export interface PuzzleSlice {
    puzzles: PuzzlePayload[];
    selectedPuzzleId: string | null;
    setSelectedPuzzleId: (id: string | null) => void;
    addPuzzle: (puzzle: PuzzlePayload) => void;
    updatePuzzle: (id: string, updated: PuzzlePayload) => void;
    deletePuzzle: (id: string) => void;
    reorderPuzzles: (startIndex: number, endIndex: number) => void;
    clearPuzzles: () => void;
}

export const createPuzzleSlice: StateCreator<PuzzleSlice, [], [], PuzzleSlice> = (set) => ({
    puzzles: [],
    selectedPuzzleId: null,
    setSelectedPuzzleId: (selectedPuzzleId) => set({ selectedPuzzleId }),
    addPuzzle: (puzzle) => set((state) => {
        const nextPuzzles = [...state.puzzles, puzzle];
        return {
            puzzles: nextPuzzles,
            selectedPuzzleId: state.selectedPuzzleId || puzzle.id,
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
});
