import { create } from "zustand";

type ToastType = "success" | "error" | "info" | "warning";
type Theme = "light" | "dark";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface UIState {
  sidebarCollapsed: boolean;
  isMobileNavOpen: boolean;
  currentTheme: Theme;
  isSearchOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileNav: () => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  addToast: (toast: { type: ToastType; message: string }) => void;
  removeToast: (toastId: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  isMobileNavOpen: false,
  currentTheme: "light" as Theme,
  isSearchOpen: false,
  activeModal: null,
  toasts: [],

  toggleSidebar: (): void => {
    set(
      (state: UIState): Partial<UIState> => ({
        sidebarCollapsed: !state.sidebarCollapsed,
      }),
    );
  },

  setSidebarCollapsed: (collapsed: boolean): void => {
    set({ sidebarCollapsed: collapsed });
  },

  toggleMobileNav: (): void => {
    set(
      (state: UIState): Partial<UIState> => ({
        isMobileNavOpen: !state.isMobileNavOpen,
      }),
    );
  },

  setMobileNavOpen: (open: boolean): void => {
    set({ isMobileNavOpen: open });
  },

  toggleTheme: (): void => {
    set(
      (state: UIState): Partial<UIState> => ({
        currentTheme: state.currentTheme === "light" ? "dark" : "light",
      }),
    );
  },

  setTheme: (theme: Theme): void => {
    set({ currentTheme: theme });
  },

  toggleSearch: (): void => {
    set(
      (state: UIState): Partial<UIState> => ({
        isSearchOpen: !state.isSearchOpen,
      }),
    );
  },

  setSearchOpen: (open: boolean): void => {
    set({ isSearchOpen: open });
  },

  setActiveModal: (modal: string | null): void => {
    set({ activeModal: modal });
  },

  addToast: (toast: { type: ToastType; message: string }): void => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set(
      (state: UIState): Partial<UIState> => ({
        toasts: [...state.toasts, { id, ...toast }],
      }),
    );
    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (toastId: string): void => {
    set(
      (state: UIState): Partial<UIState> => ({
        toasts: state.toasts.filter((t: Toast) => t.id !== toastId),
      }),
    );
  },
}));
