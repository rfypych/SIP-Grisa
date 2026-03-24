import re

with open("src/pages/admin/SettingsPage.tsx", "r") as f:
    content = f.read()

# Let's remove the orphaned block I previously added blindly: "Aturan Batas Waktu Utama"
orphaned_block = """                  <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
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

if orphaned_block in content:
    content = content.replace(orphaned_block, "")
    print("Orphaned block removed successfully.")
else:
    print("Orphaned block not found (might have already been removed).")

with open("src/pages/admin/SettingsPage.tsx", "w") as f:
    f.write(content)
