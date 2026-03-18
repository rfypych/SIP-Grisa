import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  cameraSource: string;
  setCameraSource: (source: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      cameraSource: '0', // Default to first webcam (index 0)
      setCameraSource: (source) => set({ cameraSource: source }),
    }),
    {
      name: 'sip-grisa-settings',
    }
  )
);
