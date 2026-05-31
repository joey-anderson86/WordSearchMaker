import { create } from 'zustand';
import { createSettingsSlice, SettingsSlice } from './settingsSlice';
import { createPuzzleSlice, PuzzleSlice } from './puzzleSlice';

export type AppState = SettingsSlice & PuzzleSlice;

export const useStore = create<AppState>()((...a) => ({
    ...createSettingsSlice(...a),
    ...createPuzzleSlice(...a),
}));
