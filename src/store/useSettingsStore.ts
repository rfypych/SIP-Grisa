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
  checkInOpenTime: string;
  presenceLimitTime: string;
  successSoundUrl: string;
  successSoundEnabled: boolean;
  exportLocation: string;
  exportSignatureEnabled: boolean;
  exportSignatureName: string;
  exportSignatureRole: string;
  googleApiKey: string;
  testMode: boolean;
  testCooldownSeconds: number;
  testMinGapMinutes: number;
  testPresenceLimitTime: string;
  testCheckInOpenTime: string;
  presenceLimitEnabled: boolean;
  testPresenceLimitEnabled: boolean;
  enforceMinGap: boolean;
  testEnforceMinGap: boolean;
  fetchBackendSettings: (token: string) => Promise<void>;
  updateBackendSettings: (token: string, settings: Partial<{ 
    cooldown_seconds: number, 
    min_gap_minutes: number, 
    program_start_date: string, 
    alpha_limit_time: string,
    presence_limit_time: string,
    check_in_open_time: string,
    success_sound_url: string, 
    success_sound_enabled: boolean,
    export_location: string,
    export_signature_enabled: boolean,
    export_signature_name: string,
    export_signature_role: string,
    google_api_key?: string,
    test_mode?: number,
    test_cooldown_seconds?: number,
    test_min_gap_minutes?: number,
    test_presence_limit_time?: string,
    test_check_in_open_time?: string,
    presence_limit_enabled?: number,
    test_presence_limit_enabled?: number,
    enforce_min_gap?: number,
    test_enforce_min_gap?: number
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
      checkInOpenTime: '07:00',
      presenceLimitTime: '14:00',
      successSoundUrl: '/api/sounds/applepay.mp3',
      successSoundEnabled: true,
      exportLocation: 'Grobogan',
      exportSignatureEnabled: true,
      exportSignatureName: '( ......................................... )',
      exportSignatureRole: 'Mengetahui,',
      googleApiKey: '',
      testMode: false,
      testCooldownSeconds: 0,
      testMinGapMinutes: 0,
      testPresenceLimitTime: '14:00',
      testCheckInOpenTime: '07:00',
      presenceLimitEnabled: true,
      testPresenceLimitEnabled: true,
      enforceMinGap: false,
      testEnforceMinGap: false,

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
            checkInOpenTime: data.check_in_open_time || '07:00',
            presenceLimitTime: data.presence_limit_time || '14:00',
            successSoundUrl: data.success_sound_url || '/api/sounds/applepay.mp3',
            successSoundEnabled: !!data.success_sound_enabled,
            exportLocation: data.export_location || 'Grobogan',
            exportSignatureEnabled: !!data.export_signature_enabled,
            exportSignatureName: data.export_signature_name || '( ......................................... )',
            exportSignatureRole: data.export_signature_role || 'Mengetahui,',
            googleApiKey: data.google_api_key || '',
            testMode: !!data.test_mode,
            testCooldownSeconds: data.test_cooldown_seconds || 0,
            testMinGapMinutes: data.test_min_gap_minutes || 0,
            testPresenceLimitTime: data.test_presence_limit_time || '14:00',
            testCheckInOpenTime: data.test_check_in_open_time || '07:00',
            presenceLimitEnabled: !!data.presence_limit_enabled,
            testPresenceLimitEnabled: !!data.test_presence_limit_enabled,
            enforceMinGap: !!data.enforce_min_gap,
            testEnforceMinGap: !!data.test_enforce_min_gap
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
        checkout_start_hour: state.checkoutStartHour ?? 8,
        program_start_date: settingsPartial.program_start_date ?? state.programStartDate,
        alpha_limit_time: settingsPartial.alpha_limit_time ?? state.alphaLimitTime,
        presence_limit_time: settingsPartial.presence_limit_time ?? state.presenceLimitTime,
        check_in_open_time: settingsPartial.check_in_open_time ?? state.checkInOpenTime,
        success_sound_url: settingsPartial.success_sound_url ?? state.successSoundUrl,
        success_sound_enabled: settingsPartial.success_sound_enabled ?? state.successSoundEnabled,
        export_location: settingsPartial.export_location ?? state.exportLocation,
        export_signature_enabled: settingsPartial.export_signature_enabled ?? state.exportSignatureEnabled,
        export_signature_name: settingsPartial.export_signature_name ?? state.exportSignatureName,
        export_signature_role: settingsPartial.export_signature_role ?? state.exportSignatureRole,
        google_api_key: settingsPartial.google_api_key ?? state.googleApiKey,
        test_mode: settingsPartial.test_mode ?? (state.testMode ? 1 : 0),
        test_cooldown_seconds: settingsPartial.test_cooldown_seconds ?? state.testCooldownSeconds,
        test_min_gap_minutes: settingsPartial.test_min_gap_minutes ?? state.testMinGapMinutes,
        test_presence_limit_time: settingsPartial.test_presence_limit_time ?? state.testPresenceLimitTime,
        test_check_in_open_time: settingsPartial.test_check_in_open_time ?? state.testCheckInOpenTime,
        presence_limit_enabled: settingsPartial.presence_limit_enabled ?? (state.presenceLimitEnabled ? 1 : 0),
        test_presence_limit_enabled: settingsPartial.test_presence_limit_enabled ?? (state.testPresenceLimitEnabled ? 1 : 0),
        enforce_min_gap: settingsPartial.enforce_min_gap ?? (state.enforceMinGap ? 1 : 0),
        test_enforce_min_gap: settingsPartial.test_enforce_min_gap ?? (state.testEnforceMinGap ? 1 : 0)
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
            checkoutStartHour: fullSettings.checkout_start_hour,
            programStartDate: fullSettings.program_start_date,
            alphaLimitTime: fullSettings.alpha_limit_time,
            checkInOpenTime: fullSettings.check_in_open_time,
            presenceLimitTime: fullSettings.presence_limit_time,
            successSoundUrl: fullSettings.success_sound_url,
            successSoundEnabled: !!fullSettings.success_sound_enabled,
            exportLocation: fullSettings.export_location,
            exportSignatureEnabled: !!fullSettings.export_signature_enabled,
            exportSignatureName: fullSettings.export_signature_name,
            exportSignatureRole: fullSettings.export_signature_role,
            googleApiKey: fullSettings.google_api_key,
            testMode: !!fullSettings.test_mode,
            testCooldownSeconds: fullSettings.test_cooldown_seconds,
            testMinGapMinutes: fullSettings.test_min_gap_minutes,
            testPresenceLimitTime: fullSettings.test_presence_limit_time,
            testCheckInOpenTime: fullSettings.test_check_in_open_time,
            presenceLimitEnabled: !!fullSettings.presence_limit_enabled,
            testPresenceLimitEnabled: !!fullSettings.test_presence_limit_enabled,
            enforceMinGap: !!fullSettings.enforce_min_gap,
            testEnforceMinGap: !!fullSettings.test_enforce_min_gap
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
