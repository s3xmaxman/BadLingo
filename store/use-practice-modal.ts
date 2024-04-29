import { create } from "zustand";

type usePracticeModal = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
};

export const usePracticeModal = create<usePracticeModal>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
}));