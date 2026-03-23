import re

with open("src/pages/admin/SettingsPage.tsx", "r") as f:
    content = f.read()

# Let's target the exact line based on previous grep output

old_part = """              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-600" /> Jeda Plg. Min (Menit)
              </label>
              <input
                type="number"
                value={localMinGap}
                onChange={(e) => setLocalMinGap(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />"""

new_part = """              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-blue-600" /> Jam Mulai Masuk
              </label>
              <input
                type="time"
                value={localCheckinStart}
                onChange={(e) => setLocalCheckinStart(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900 mb-4"
              />

              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-emerald-600" /> Jam Mulai Pulang
              </label>
              <input
                type="time"
                value={localCheckoutStart}
                onChange={(e) => setLocalCheckoutStart(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900 mb-4"
              />

              <label className="flex justify-between items-center text-sm font-medium text-slate-700 mb-2">
                 <div className="flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-emerald-600" /> Jeda Plg. Min (Menit)
                 </div>
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocalEnforceGap(!localEnforceGap)}>
                   <span className="text-[10px] uppercase font-bold text-slate-500">Wajibkan?</span>
                   <div className={`w-8 h-4 rounded-full relative transition-colors ${localEnforceGap ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                     <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${localEnforceGap ? 'left-4' : 'left-0.5'}`} />
                   </div>
                 </div>
              </label>
              <input
                type="number"
                value={localMinGap}
                onChange={(e) => setLocalMinGap(parseInt(e.target.value) || 0)}
                disabled={!localEnforceGap}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
              />"""

content = content.replace(old_part, new_part)

with open("src/pages/admin/SettingsPage.tsx", "w") as f:
    f.write(content)

print("Settings applied successfully!")
