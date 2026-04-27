import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '../types';
import { defaultSettings, fetchSettings, saveSettings } from '../services/settingsService';

type SettingsSyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SettingsStore {
  settings: Settings;
  isLoading: boolean;
  syncStatus: SettingsSyncStatus;
  initialize: () => Promise<void>;
  persistSettings: () => Promise<boolean>;
  updateThreshold: (val: number) => void;
  updateWeights: (weights: Partial<Settings['weights']>) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,
      syncStatus: 'idle',
      initialize: async () => {
        set({ isLoading: true });
        const liveSettings = await fetchSettings();
        if (liveSettings) {
          set({ settings: liveSettings, syncStatus: 'saved' });
        }
        set({ isLoading: false });
      },
      persistSettings: async () => {
        set({ syncStatus: 'saving' });
        const ok = await saveSettings(get().settings);
        set({ syncStatus: ok ? 'saved' : 'error' });
        return ok;
      },
      updateThreshold: (val) => set((s) => ({ settings: { ...s.settings, riskThreshold: val } })),
      updateWeights: (weights) =>
        set((s) => ({ settings: { ...s.settings, weights: { ...s.settings.weights, ...weights } } })),
      updateSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),
      resetToDefaults: () => set({ settings: defaultSettings, syncStatus: 'idle' }),
    }),
    { name: 'resilientroute-settings' }
  )
);
