import { create } from 'zustand';

export type ElementType = 'TEXT' | 'IMAGE' | 'PUZZLE_GRID' | 'SHAPE';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;          // X coordinate in points/pixels
  y: number;          // Y coordinate in points/pixels
  width: number;
  height: number;
  rotation: number;   // In degrees
  isLocked: boolean;  // Prevents movement/editing
  isVisible: boolean; // Toggles rendering
  contentData: any;   // Payload specific to the ElementType (e.g., text string, image path, puzzle grid array)
  style: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    // ...other CSS properties
    [key: string]: any;
  };
}

export interface CanvasState {
  elements: CanvasElement[];
  activeElementId: string | null;
  // Actions
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  setActiveElement: (id: string | null) => void;
  reorderElements: (startIndex: number, endIndex: number) => void; // For Z-index/Layer management
}

export const useCanvasStore = create<CanvasState>((set) => ({
  elements: [],
  activeElementId: null,

  addElement: (element) => set((state) => ({
    elements: [...state.elements, element]
  })),

  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map((el) => 
      el.id === id ? { ...el, ...updates } : el
    )
  })),

  deleteElement: (id) => set((state) => ({
    elements: state.elements.filter((el) => el.id !== id),
    activeElementId: state.activeElementId === id ? null : state.activeElementId
  })),

  setActiveElement: (id) => set({ activeElementId: id }),

  reorderElements: (startIndex, endIndex) => set((state) => {
    const newElements = Array.from(state.elements);
    const [reorderedElement] = newElements.splice(startIndex, 1);
    newElements.splice(endIndex, 0, reorderedElement);
    return { elements: newElements };
  }),
}));
