import re

with open("src/pages/admin/SettingsPage.tsx", "r") as f:
    content = f.read()

# Make sure Admin panel has sliders for checkin/checkout start
content = content.replace(
    "presenceLimitTime,",
    "presenceLimitTime,\n    checkinStartTime,\n    checkoutStartTime,\n    enforceMinGap,"
)

old_settings_box = """          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
               <Clock className="w-4 h-4 text-rose-500" /> Aturan Waktu Global
            </h2>"""

new_settings_box = """          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
               <Clock className="w-4 h-4 text-rose-500" /> Aturan Waktu Global
            </h2>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Jam Mulai Masuk</label>
              <input
                type="time"
                value={checkinStartTime}
                onChange={(e) => updateBackendSettings(token!, { checkin_start_time: e.target.value })}
                className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Sistem akan menolak check-in sebelum jam ini.</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Jam Mulai Pulang</label>
              <input
                type="time"
                value={checkoutStartTime}
                onChange={(e) => updateBackendSettings(token!, { checkout_start_time: e.target.value })}
                className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Sistem akan menolak check-out sebelum jam ini.</p>
            </div>"""

content = content.replace(old_settings_box, new_settings_box)

old_min_gap = """            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Jeda Plg. Min (Menit)</label>
              <input
                type="number"
                value={minGapMinutes}
                onChange={(e) => updateBackendSettings(token!, { min_gap_minutes: parseInt(e.target.value) })}
                className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Menit min sebelum bisa Pulang.</p>
            </div>"""

new_min_gap = """            <div>
              <label className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                 <span>Jeda Plg. Min (Menit)</span>
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => updateBackendSettings(token!, { enforce_min_gap: enforceMinGap ? 0 : 1 })}>
                   <span className="text-[9px]">Wajibkan?</span>
                   <div className={`w-8 h-4 rounded-full relative transition-colors ${enforceMinGap ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                     <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${enforceMinGap ? 'left-4' : 'left-0.5'}`} />
                   </div>
                 </div>
              </label>
              <input
                type="number"
                value={minGapMinutes}
                onChange={(e) => updateBackendSettings(token!, { min_gap_minutes: parseInt(e.target.value) })}
                disabled={!enforceMinGap}
                className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">Jika wajib, guru tidak bisa pulang sebelum total durasi kerja terpenuhi.</p>
            </div>"""

content = content.replace(old_min_gap, new_min_gap)


with open("src/pages/admin/SettingsPage.tsx", "w") as f:
    f.write(content)

print("Settings Admin Patched.")
