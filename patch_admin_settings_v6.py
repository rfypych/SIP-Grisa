import re

with open("src/pages/admin/SettingsPage.tsx", "r") as f:
    content = f.read()

# Make absolutely sure it's placed. My previous replacement might have silently failed because of indentation.
# Let's use a simpler replace strategy for "Batas Presensi / Jam Pulang"
import re

pattern = re.compile(r"""              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-rose-600" /> Batas Presensi / Jam Pulang
              </label>
              <input
                type="time"
                value=\{localPresenceLimitTime\}
                onChange=\{\(e\) => setLocalPresenceLimitTime\(e.target.value\)\}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-rose-500 text-slate-900"
              />""")

replacement = """              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-blue-600" /> Jam Mulai Masuk
              </label>
              <input
                type="time"
                value={localCheckinStart}
                onChange={(e) => setLocalCheckinStart(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900"
              />

              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2 mt-4">
                 <Clock className="w-4 h-4 text-emerald-600" /> Jam Mulai Pulang
              </label>
              <input
                type="time"
                value={localCheckoutStart}
                onChange={(e) => setLocalCheckoutStart(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />

              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2 mt-4">
                 <Clock className="w-4 h-4 text-rose-600" /> Batas Presensi / Jam Pulang
              </label>
              <input
                type="time"
                value={localPresenceLimitTime}
                onChange={(e) => setLocalPresenceLimitTime(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-rose-500 text-slate-900"
              />"""

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content)
    print("Injected Jam Mulai Masuk/Pulang!")
else:
    print("Could not find pattern for Batas Presensi")

pattern2 = re.compile(r"""              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-600" /> Jeda Plg\. Min \(Menit\)
              </label>
              <input
                type="number"
                value=\{localMinGap\}
                onChange=\{\(e\) => setLocalMinGap\(parseInt\(e.target.value\) \|\| 0\)\}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />""")

replacement2 = """              <div className="flex justify-between items-center mb-2">
                 <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-emerald-600" /> Jeda Plg. Min (Menit)
                 </label>
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocalEnforceGap(!localEnforceGap)}>
                   <span className="text-[10px] uppercase font-bold text-slate-500">Wajibkan?</span>
                   <div className={`w-8 h-4 rounded-full relative transition-colors ${localEnforceGap ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                     <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${localEnforceGap ? 'left-4' : 'left-0.5'}`} />
                   </div>
                 </div>
              </div>
              <input
                type="number"
                value={localMinGap}
                onChange={(e) => setLocalMinGap(parseInt(e.target.value) || 0)}
                disabled={!localEnforceGap}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
              />"""

if re.search(pattern2, content):
    content = re.sub(pattern2, replacement2, content)
    print("Injected Jeda Wajib Toggle!")
else:
    print("Could not find pattern for Jeda Plg. Min")

with open("src/pages/admin/SettingsPage.tsx", "w") as f:
    f.write(content)
