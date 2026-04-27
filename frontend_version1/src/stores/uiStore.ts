import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface UIStore {
  toast: Toast;
  isLoading: boolean;
  activeModals: string[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
  setLoading: (val: boolean) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  toast: { visible: false, message: '', type: 'info' },
  isLoading: false,
  activeModals: [],
  showToast: (message, type = 'info', duration = 4000) => {
    set({ toast: { visible: true, message, type } });
    setTimeout(() => get().hideToast(), duration);
  },
  hideToast: () => set({ toast: { visible: false, message: '', type: 'info' } }),
  setLoading: (val) => set({ isLoading: val }),
  openModal: (id) => set((s) => ({ activeModals: [...s.activeModals.filter(m => m !== id), id] })),
  closeModal: (id) => set((s) => ({ activeModals: s.activeModals.filter(m => m !== id) })),
  closeAllModals: () => set({ activeModals: [] }),
}));
