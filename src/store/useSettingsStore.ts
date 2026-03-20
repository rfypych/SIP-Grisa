import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  cameraSource: string;
  setCameraSource: (source: string) => void;
  categories: string[];
  addCategory: (cat: string) => void;
  removeCategory: (cat: string) => void;
  // Backend Settings
  cooldownSeconds: number;
  minGapMinutes: number;
  checkoutStartHour: number;
  programStartDate: string;
  alphaLimitTime: string;
  successSoundUrl: string;
  successSoundEnabled: boolean;
  exportLocation: string;
  exportSignatureEnabled: boolean;
  exportSignatureName: string;
  exportSignatureRole: string;
  fetchBackendSettings: (token: string) => Promise<void>;
  updateBackendSettings: (token: string, settings: { 
    cooldown_seconds: number, 
    min_gap_minutes: number, 
    checkout_start_hour: number, 
    program_start_date: string,
    alpha_limit_time: string,
    success_sound_url: string, 
    success_sound_enabled: boolean,
    export_location: string,
    export_signature_enabled: boolean,
    export_signature_name: string,
    export_signature_role: string
  }) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      cameraSource: '0',
      setCameraSource: (source) => set({ cameraSource: source }),
      categories: ['Guru', 'Karyawan'],
      addCategory: (cat) => set((state) => ({ categories: [...state.categories, cat] })),
      removeCategory: (cat) => set((state) => ({ categories: state.categories.filter(c => c !== cat) })),
      
      // Default Backend Settings (will be overwritten by fetch)
      cooldownSeconds: 60,
      minGapMinutes: 60,
      checkoutStartHour: 11,
      programStartDate: '2026-03-01',
      alphaLimitTime: '07:30',
      successSoundUrl: '/api/sounds/applepay.mp3',
      successSoundEnabled: true,
      exportLocation: 'Grobogan',
      exportSignatureEnabled: true,
      exportSignatureName: '( ......................................... )',
      exportSignatureRole: 'Mengetahui,',

      fetchBackendSettings: async (token) => {
        try {
          const response = await fetch('/api/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          set({
            cooldownSeconds: data.cooldown_seconds,
            minGapMinutes: data.min_gap_minutes,
            checkoutStartHour: data.checkout_start_hour,
            programStartDate: data.program_start_date,
            alphaLimitTime: data.alpha_limit_time || '07:30',
            successSoundUrl: data.success_sound_url || '/api/sounds/applepay.mp3',
            successSoundEnabled: !!data.success_sound_enabled,
            exportLocation: data.export_location || 'Grobogan',
            exportSignatureEnabled: !!data.export_signature_enabled,
            exportSignatureName: data.export_signature_name || '( ......................................... )',
            exportSignatureRole: data.export_signature_role || 'Mengetahui,'
          });
        } catch (error) {
          console.error("Gagal mengambil pengaturan backend:", error);
        }
      },

      updateBackendSettings: async (token, settings) => {
        try {
          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify(settings)
          });
          if (response.ok) {
            set({
              cooldownSeconds: settings.cooldown_seconds,
              minGapMinutes: settings.min_gap_minutes,
              checkoutStartHour: settings.checkout_start_hour,
              programStartDate: settings.program_start_date,
              alphaLimitTime: settings.alpha_limit_time,
              successSoundUrl: settings.success_sound_url,
              successSoundEnabled: settings.success_sound_enabled,
              exportLocation: settings.export_location,
              exportSignatureEnabled: settings.export_signature_enabled,
              exportSignatureName: settings.export_signature_name,
              exportSignatureRole: settings.export_signature_role
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Gagal update pengaturan backend:", error);
          return false;
        }
      }
    }),
    {
      name: 'sip-grisa-settings',
    }
  )
);
