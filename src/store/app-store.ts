import { create } from 'zustand';

type AppStore = {
  isOnline: boolean;
  setOnline: (isOnline: boolean) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  isOnline: true,
  setOnline: (isOnline) => set({ isOnline }),
}));
