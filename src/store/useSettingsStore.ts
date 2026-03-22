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
      const state = get();
      
      // Merge partial with current state to satisfy backend requirement
      const fullSettings = {
        cooldown_seconds: settingsPartial.cooldown_seconds ?? state.cooldownSeconds,
        min_gap_minutes: settingsPartial.min_gap_minutes ?? state.minGapMinutes,
        program_start_date: settingsPartial.program_start_date ?? state.programStartDate,
        alpha_limit_time: settingsPartial.alpha_limit_time ?? state.alphaLimitTime,
        presence_limit_time: settingsPartial.presence_limit_time ?? state.presenceLimitTime,
        success_sound_url: settingsPartial.success_sound_url ?? state.successSoundUrl,
        success_sound_enabled: settingsPartial.success_sound_enabled ?? state.successSoundEnabled,
        export_location: settingsPartial.export_location ?? state.exportLocation,
        export_signature_enabled: settingsPartial.export_signature_enabled ?? state.exportSignatureEnabled,
        export_signature_name: settingsPartial.export_signature_name ?? state.exportSignatureName,
        export_signature_role: settingsPartial.export_signature_role ?? state.exportSignatureRole,
        google_api_key: settingsPartial.google_api_key ?? state.googleApiKey,
        test_mode: settingsPartial.test_mode ?? (state.testMode ? 1 : 0)
      };

      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(fullSettings)
        });
        
        if (response.ok) {
          set({
            cooldownSeconds: fullSettings.cooldown_seconds,
            minGapMinutes: fullSettings.min_gap_minutes,
            programStartDate: fullSettings.program_start_date,
            alphaLimitTime: fullSettings.alpha_limit_time,
            presenceLimitTime: fullSettings.presence_limit_time,
            successSoundUrl: fullSettings.success_sound_url,
            successSoundEnabled: !!fullSettings.success_sound_enabled,
            exportLocation: fullSettings.export_location,
            exportSignatureEnabled: !!fullSettings.export_signature_enabled,
            exportSignatureName: fullSettings.export_signature_name,
            exportSignatureRole: fullSettings.export_signature_role,
            googleApiKey: fullSettings.google_api_key,
            testMode: !!fullSettings.test_mode
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
