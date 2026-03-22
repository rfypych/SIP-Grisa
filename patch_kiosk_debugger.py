import re

with open("src/pages/KioskPage.tsx", "r") as f:
    content = f.read()

# 1. Update State to store specific message for already-done
content = content.replace(
    "const [scannedName, setScannedName] = useState('');",
    "const [scannedName, setScannedName] = useState('');\n  const [doneMessage, setDoneMessage] = useState('');"
)

# 2. Extract Message from WS Event for already_done
ws_event = """      } else if (data.event === 'already_done') {
        setScannedName(data.name);
        setScanStatus('already-done');

        setTimeout(() => {
          setScanStatus('scanning');
        }, 3000);"""

ws_event_new = """      } else if (data.event === 'already_done') {
        setScannedName(data.name);
        setDoneMessage(data.message || 'Anda sudah melakukan presensi.');
        setScanStatus('already-done');

        setTimeout(() => {
          setScanStatus('scanning');
        }, 3000);"""

content = content.replace(ws_event, ws_event_new)

# 3. Enhance already-done UI block to show the specific message (e.g., Belum waktunya pulang)
old_already_done = """          {/* ALREADY DONE OVERLAY */}
          <AnimatePresence>
            {scanStatus === 'already-done' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md rounded-[32px] border-4 border-blue-500/50"
              >
                 <motion.div
                  initial={{ y: 20 }} animate={{ y: 0 }}
                  className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20"
                 >
                    <CheckCircle2 className="w-12 h-12 text-blue-50" />
                 </motion.div>
                 <h2 className="text-4xl font-black text-white tracking-tight mb-2 text-center">{scannedName}</h2>
                 <p className="text-blue-200 text-lg font-medium">Sudah melakukan presensi.</p>
              </motion.div>
            )}
          </AnimatePresence>"""

new_already_done = """          {/* ALREADY DONE OVERLAY */}
          <AnimatePresence>
            {scanStatus === 'already-done' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md rounded-[32px] border-4 border-blue-500/50"
              >
                 <motion.div
                  initial={{ y: 20 }} animate={{ y: 0 }}
                  className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20"
                 >
                    <CheckCircle2 className="w-12 h-12 text-blue-50" />
                 </motion.div>
                 <h2 className="text-4xl font-black text-white tracking-tight mb-2 text-center px-4">{scannedName}</h2>
                 <p className="text-blue-200 text-lg font-medium text-center px-8">{doneMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>"""

content = content.replace(old_already_done, new_already_done)


# 4. Enhance Debugger panel to show the new boundaries
old_debugger = """                    <div className="pt-2 border-t border-slate-700/50 space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Boundary (Limit)</span>
                          <span className="font-mono text-xs text-rose-400 font-bold">{presenceLimitTime}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Logic Time</span>
                          <span className="font-mono text-xs text-slate-300">{debugData.current_logic_time}</span>
                       </div>"""

new_debugger = """                    <div className="pt-2 border-t border-slate-700/50 space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Mulai Masuk</span>
                          <span className="font-mono text-xs text-blue-400 font-bold">{checkinStartTime}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Mulai Pulang</span>
                          <span className="font-mono text-xs text-emerald-400 font-bold">{checkoutStartTime}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Boundary (Limit)</span>
                          <span className="font-mono text-xs text-rose-400 font-bold">{presenceLimitTime}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Logic Time</span>
                          <span className="font-mono text-xs text-slate-300">{debugData.current_logic_time}</span>
                       </div>"""

content = content.replace(old_debugger, new_debugger)


with open("src/pages/KioskPage.tsx", "w") as f:
    f.write(content)

print("Kiosk Debugger Patched.")
