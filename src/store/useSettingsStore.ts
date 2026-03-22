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
  presenceLimitTime: string;
  checkinStartTime: string;
  checkoutStartTime: string;
  successSoundUrl: string;
  successSoundEnabled: boolean;
  exportLocation: string;
  exportSignatureEnabled: boolean;
  exportSignatureName: string;
  exportSignatureRole: string;
  googleApiKey: string;
  testMode: boolean;
  fetchBackendSettings: (token: string) => Promise<void>;
  updateBackendSettings: (token: string, settings: Partial<{ 
    cooldown_seconds: number, 
    min_gap_minutes: number, 
    program_start_date: string, 
    alpha_limit_time: string,
    presence_limit_time: string,
    checkin_start_time: string,
    checkout_start_time: string,
    success_sound_url: string, 
    success_sound_enabled: boolean,
    export_location: string,
    export_signature_enabled: boolean,
    export_signature_name: string,
    export_signature_role: string,
    google_api_key?: string,
    test_mode?: number
  }>) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      cameraSource: '0',
      setCameraSource: (source) => set({ cameraSource: source }),
      categories: ['Guru', 'Karyawan'],
      addCategory: (cat) => set((state) => ({ categories: [...state.categories, cat] })),
      removeCategory: (cat) => set((state) => ({ categories: state.categories.filter(c => c !== cat) })),
      
      // Default Backend Settings (will be overwritten by fetch)
      cooldownSeconds: 60,
      minGapMinutes: 60,
      checkoutStartHour: 8,
      programStartDate: '2026-03-01',
      alphaLimitTime: '07:30',
      presenceLimitTime: '14:00',
      checkinStartTime: '06:00',
      checkoutStartTime: '14:00',
      successSoundUrl: '/api/sounds/applepay.mp3',
      successSoundEnabled: true,
      exportLocation: 'Grobogan',
      exportSignatureEnabled: true,
      exportSignatureName: '( ......................................... )',
      exportSignatureRole: 'Mengetahui,',
      googleApiKey: '',
      testMode: false,

      fetchBackendSettings: async (token) => {
        try {
          const response = await fetch('/api/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          set({
            cooldownSeconds: data.cooldown_seconds,
            minGapMinutes: data.min_gap_minutes || 60,
            checkoutStartHour: data.checkout_start_hour,
            programStartDate: data.program_start_date || '2026-03-01',
            alphaLimitTime: data.alpha_limit_time || '07:30',
            presenceLimitTime: data.presence_limit_time || '14:00',
            checkinStartTime: data.checkin_start_time || '06:00',
            checkoutStartTime: data.checkout_start_time || '14:00',
            successSoundUrl: data.success_sound_url || '/api/sounds/applepay.mp3',
            successSoundEnabled: !!data.success_sound_enabled,
            exportLocation: data.export_location || 'Grobogan',
            exportSignatureEnabled: !!data.export_signature_enabled,
            exportSignatureName: data.export_signature_name || '( ......................................... )',
            exportSignatureRole: data.export_signature_role || 'Mengetahui,',
            googleApiKey: data.google_api_key || '',
            testMode: !!data.test_mode
          });
        } catch (error) {
          console.error("Gagal mengambil pengaturan backend:", error);
        }
      },

      updateBackendSettings: async (token, settingsPartial) => {
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(settingsPartial) // Send only the updated fields
        });
        
        if (response.ok) {
          // Update the local state only with the fields that were modified
          set((state) => ({
            ...state,
            cooldownSeconds: settingsPartial.cooldown_seconds !== undefined ? settingsPartial.cooldown_seconds : state.cooldownSeconds,
            minGapMinutes: settingsPartial.min_gap_minutes !== undefined ? settingsPartial.min_gap_minutes : state.minGapMinutes,
            programStartDate: settingsPartial.program_start_date !== undefined ? settingsPartial.program_start_date : state.programStartDate,
            alphaLimitTime: settingsPartial.alpha_limit_time !== undefined ? settingsPartial.alpha_limit_time : state.alphaLimitTime,
            presenceLimitTime: settingsPartial.presence_limit_time !== undefined ? settingsPartial.presence_limit_time : state.presenceLimitTime,
            checkinStartTime: settingsPartial.checkin_start_time !== undefined ? settingsPartial.checkin_start_time : state.checkinStartTime,
            checkoutStartTime: settingsPartial.checkout_start_time !== undefined ? settingsPartial.checkout_start_time : state.checkoutStartTime,
            successSoundUrl: settingsPartial.success_sound_url !== undefined ? settingsPartial.success_sound_url : state.successSoundUrl,
            successSoundEnabled: settingsPartial.success_sound_enabled !== undefined ? !!settingsPartial.success_sound_enabled : state.successSoundEnabled,
            exportLocation: settingsPartial.export_location !== undefined ? settingsPartial.export_location : state.exportLocation,
            exportSignatureEnabled: settingsPartial.export_signature_enabled !== undefined ? !!settingsPartial.export_signature_enabled : state.exportSignatureEnabled,
            exportSignatureName: settingsPartial.export_signature_name !== undefined ? settingsPartial.export_signature_name : state.exportSignatureName,
            exportSignatureRole: settingsPartial.export_signature_role !== undefined ? settingsPartial.export_signature_role : state.exportSignatureRole,
            googleApiKey: settingsPartial.google_api_key !== undefined ? settingsPartial.google_api_key : state.googleApiKey,
            testMode: settingsPartial.test_mode !== undefined ? !!settingsPartial.test_mode : state.testMode
          }));
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
