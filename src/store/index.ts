import { create } from 'zustand';
import { createSettingsSlice, SettingsSlice } from './settingsSlice';
import { createPuzzleSlice, PuzzleSlice } from './puzzleSlice';
import { createCoverSlice, CoverState } from './coverSlice';

export type AppState = SettingsSlice & PuzzleSlice & CoverState;

export const useStore = create<AppState>()((...a) => ({
    ...createSettingsSlice(...a),
    ...createPuzzleSlice(...a),
    ...createCoverSlice(...a),
}));
