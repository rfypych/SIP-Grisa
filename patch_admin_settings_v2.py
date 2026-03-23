import re

with open("src/pages/admin/SettingsPage.tsx", "r") as f:
    content = f.read()

# 1. Add states for new fields
old_states = """  const [localTestMode, setLocalTestMode] = useState(testMode);


  const [isSaved, setIsSaved] = useState(false);"""

new_states = """  const [localTestMode, setLocalTestMode] = useState(testMode);
  const [localCheckinStart, setLocalCheckinStart] = useState(checkinStartTime);
  const [localCheckoutStart, setLocalCheckoutStart] = useState(checkoutStartTime);
  const [localEnforceGap, setLocalEnforceGap] = useState(enforceMinGap);

  const [isSaved, setIsSaved] = useState(false);"""

content = content.replace(old_states, new_states)

# 2. Add local sync inside useEffect
old_sync = """    setLocalExportSignatureRole(exportSignatureRole);
    setLocalGoogleApiKey(googleApiKey);
    setLocalTestMode(testMode);
  }, [cameraSource,"""

new_sync = """    setLocalExportSignatureRole(exportSignatureRole);
    setLocalGoogleApiKey(googleApiKey);
    setLocalTestMode(testMode);
    setLocalCheckinStart(checkinStartTime);
    setLocalCheckoutStart(checkoutStartTime);
    setLocalEnforceGap(enforceMinGap);
  }, [cameraSource,"""

content = content.replace(old_sync, new_sync)

# 3. Add to handleSaveBackend payload
old_payload = """      google_api_key: localGoogleApiKey,
      test_mode: localTestMode ? 1 : 0
    });"""

new_payload = """      google_api_key: localGoogleApiKey,
      test_mode: localTestMode ? 1 : 0,
      checkin_start_time: localCheckinStart,
      checkout_start_time: localCheckoutStart,
      enforce_min_gap: localEnforceGap ? 1 : 0
    });"""

content = content.replace(old_payload, new_payload)

# 4. Inject UI blocks into the Backend Settings Card (Global Logic)
old_ui_min_gap = """                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                       <Clock className="w-4 h-4 text-emerald-500" />
                       Jeda Waktu Pulang (Menit)
                    </label>
                    <input
                      type="number"
                      value={localMinGap}
                      onChange={(e) => setLocalMinGap(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                      min="0"
                    />
                    <p className="text-xs text-slate-500 mt-2">Pegawai baru bisa check-out setelah selang waktu ini dari saat check-in.</p>
                  </div>"""

new_ui_time_rules = """                  <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-blue-500" /> Aturan Batas Waktu Utama
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Jam Mulai Masuk</label>
                      <input
                        type="time"
                        value={localCheckinStart}
                        onChange={(e) => setLocalCheckinStart(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-2">Sistem akan menolak Check-in jika absen sebelum jam ini (Mencegah absen malam/subuh).</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Jam Mulai Pulang</label>
                      <input
                        type="time"
                        value={localCheckoutStart}
                        onChange={(e) => setLocalCheckoutStart(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-2">Pegawai tidak bisa Check-out sebelum jam ini, meskipun durasi kerja (Min Gap) sudah terpenuhi.</p>
                    </div>

                    <div className="md:col-span-2 mt-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                          <label className="block text-sm font-medium text-emerald-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            Jeda Waktu Pulang (Min Gap)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-700 uppercase">Wajib Penuhi Durasi?</span>
                            <button
                              onClick={() => setLocalEnforceGap(!localEnforceGap)}
                              className={`w-12 h-6 rounded-full relative transition-colors ${localEnforceGap ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${localEnforceGap ? 'left-6' : 'left-0.5'}`} />
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-4 items-center">
                          <input
                            type="number"
                            value={localMinGap}
                            onChange={(e) => setLocalMinGap(parseInt(e.target.value))}
                            disabled={!localEnforceGap}
                            className="w-32 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono disabled:opacity-50"
                            min="0"
                          />
                          <span className="text-sm font-bold text-slate-500">Menit</span>
                        </div>
                        <p className="text-xs text-emerald-700/70 mt-3">
                          Jika opsi wajib diaktifkan: Pegawai tidak bisa check-out sebelum bekerja selama durasi di atas.<br/>
                          Jika dimatikan: Pegawai yang membolos pagi tapi datang di sore hari akan otomatis langsung dicatat sebagai Check-Out (Alfa).
                        </p>
                      </div>
                    </div>
                  </div>"""

# Replace the specific block
# First, find the block in actual file
content = content.replace(old_ui_min_gap, new_ui_time_rules)


with open("src/pages/admin/SettingsPage.tsx", "w") as f:
    f.write(content)

print("Settings Page fixed with new rules block.")
