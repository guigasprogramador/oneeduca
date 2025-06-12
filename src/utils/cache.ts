import { create } from 'zustand';

interface CacheStore {
  data: Record<string, any>;
  set: (key: string, value: any, duration?: number) => void;
  get: (key: string) => any | null;
  clear: () => void;
}

export const useCacheStore = create<CacheStore>(set => ({
  data: {},
  set: (key, value, duration = 10 * 60 * 1000) => {
    const expiration = Date.now() + duration;
    set(state => ({
      data: {
        ...state.data,
        [key]: {
          value,
          expiration
        }
      }
    }));
  },
  get: (key) => {
    const item = useCacheStore.getState().data[key];
    if (!item) return null;
    
    if (item.expiration < Date.now()) {
      return null;
    }
    
    return item.value;
  },
  clear: () => {
    set({ data: {} });
  }
}));
