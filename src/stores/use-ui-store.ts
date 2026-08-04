import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeBuildingId: string | null;
  activeFloorId: string | null;
  searchQuery: string;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setActiveBuildingId: (id: string | null) => void;
  setActiveFloorId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  activeBuildingId: null,
  activeFloorId: null,
  searchQuery: '',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveBuildingId: (id) => set({ activeBuildingId: id }),
  setActiveFloorId: (id) => set({ activeFloorId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
