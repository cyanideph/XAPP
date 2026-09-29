import { create } from 'zustand';

type AppState = {
  online: boolean;
  setOnline: (online: boolean) => void;
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  online: true,
  setOnline: (online) => set({ online }),
  unreadNotifications: 0,
  setUnreadNotifications: (count) => set({ unreadNotifications: Math.max(0, count) }),
}));
