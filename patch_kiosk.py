import re

with open("src/pages/KioskPage.tsx", "r") as f:
    content = f.read()

# 1. Update scanning status type to include warning
content = content.replace(
    "const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'already-done'>('idle');",
    "const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'already-done' | 'warning'>('idle');\n  const [warningMessage, setWarningMessage] = useState('');"
)

# 2. Add local variables for sliders
content = content.replace(
    "const [localPresenceMin, setLocalPresenceMin] = useState(0);",
    """const [localPresenceMin, setLocalPresenceMin] = useState(0);
  const [localCheckinHour, setLocalCheckinHour] = useState(6);
  const [localCheckinMin, setLocalCheckinMin] = useState(0);
  const [localCheckoutHour, setLocalCheckoutHour] = useState(14);
  const [localCheckoutMin, setLocalCheckoutMin] = useState(0);"""
)

# 3. Add destructured vars from store
content = content.replace(
    "    presenceLimitTime,",
    "    presenceLimitTime,\n    checkinStartTime,\n    checkoutStartTime,"
)

# 4. Sync initial data
sync_replace = """    setLocalPresenceMin(m || 0);
  }, [cooldownSeconds, minGapMinutes, presenceLimitTime]);"""

sync_new = """    setLocalPresenceMin(m || 0);

    const [ciH, ciM] = (checkinStartTime || '06:00').split(':').map(Number);
    setLocalCheckinHour(ciH || 0);
    setLocalCheckinMin(ciM || 0);

    const [coH, coM] = (checkoutStartTime || '14:00').split(':').map(Number);
    setLocalCheckoutHour(coH || 0);
    setLocalCheckoutMin(coM || 0);
  }, [cooldownSeconds, minGapMinutes, presenceLimitTime, checkinStartTime, checkoutStartTime]);"""

content = content.replace(sync_replace, sync_new)

# 5. Handle WebSocket Warning Event
ws_event = """      } else if (data.event === 'searching' || data.event === 'on_cooldown') {
        setScanStatus(prev => (prev === 'success' || prev === 'already-done') ? prev : 'scanning');
      }"""

ws_event_new = """      } else if (data.event === 'searching' || data.event === 'on_cooldown') {
        setScanStatus(prev => (prev === 'success' || prev === 'already-done' || prev === 'warning') ? prev : 'scanning');
      } else if (data.event === 'early_warning') {
        setWarningMessage(data.message);
        setScanStatus('warning');
        setTimeout(() => {
          setScanStatus('scanning');
        }, 4000);
      }"""

content = content.replace(ws_event, ws_event_new)

# 6. Add Sliders to UI
slider_anchor = """                   {/* Boundary Time Sliders */}
                   <div className="space-y-2 pt-1 border-t border-slate-700/50">"""

new_sliders = """                   {/* Check-in Start Sliders */}
                   <div className="space-y-2 pt-1 border-t border-slate-700/50">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                         <span className="text-slate-400">Jam Mulai Masuk</span>
                         <span className="text-blue-400 font-bold">{localCheckinHour.toString().padStart(2, '0')}:{localCheckinMin.toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Jam</span>
                            <input
                              type="range" min="0" max="23" value={localCheckinHour}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalCheckinHour(val);
                                 handleUpdateSetting('checkin_start_time', `${val.toString().padStart(2, '0')}:${localCheckinMin.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                         </div>
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Min</span>
                            <input
                              type="range" min="0" max="59" step="5" value={localCheckinMin}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalCheckinMin(val);
                                 handleUpdateSetting('checkin_start_time', `${localCheckinHour.toString().padStart(2, '0')}:${val.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Check-out Start Sliders */}
                   <div className="space-y-2 pt-1 border-t border-slate-700/50">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                         <span className="text-slate-400">Jam Mulai Pulang</span>
                         <span className="text-emerald-400 font-bold">{localCheckoutHour.toString().padStart(2, '0')}:{localCheckoutMin.toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Jam</span>
                            <input
                              type="range" min="0" max="23" value={localCheckoutHour}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalCheckoutHour(val);
                                 handleUpdateSetting('checkout_start_time', `${val.toString().padStart(2, '0')}:${localCheckoutMin.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                         </div>
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Min</span>
                            <input
                              type="range" min="0" max="59" step="5" value={localCheckoutMin}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalCheckoutMin(val);
                                 handleUpdateSetting('checkout_start_time', `${localCheckoutHour.toString().padStart(2, '0')}:${val.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Boundary Time Sliders */}
                   <div className="space-y-2 pt-1 border-t border-slate-700/50">"""

content = content.replace(slider_anchor, new_sliders)

# 7. Modify status UI to display warning elegantly
status_replace = """                   <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
                   <Badge className={scanStatus === 'success' ? 'bg-emerald-500' : 'bg-slate-700'}>{scanStatus}</Badge>"""

status_new = """                   <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
                   <Badge className={
                      scanStatus === 'success' ? 'bg-emerald-500' :
                      scanStatus === 'warning' ? 'bg-amber-500 text-amber-950 font-black' :
                      'bg-slate-700'
                   }>
                      {scanStatus}
                   </Badge>"""

content = content.replace(status_replace, status_new)

# Add Warning Message Block into UI below Camera
success_block = """          {/* SUCCESS OVERLAY */}
          <AnimatePresence>
            {scanStatus === 'success' && ("""

warning_block = """          {/* WARNING OVERLAY */}
          <AnimatePresence>
            {scanStatus === 'warning' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md rounded-[32px] border-4 border-amber-500/50"
              >
                 <motion.div
                  initial={{ y: 20 }} animate={{ y: 0 }}
                  className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20"
                 >
                    <Clock className="w-12 h-12 text-amber-50" />
                 </motion.div>
                 <h2 className="text-4xl font-black text-white tracking-tight mb-2 text-center max-w-[80%]">Tunggu Dulu!</h2>
                 <p className="text-amber-200 text-lg font-medium text-center px-8">{warningMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SUCCESS OVERLAY */}
          <AnimatePresence>
            {scanStatus === 'success' && ("""

content = content.replace(success_block, warning_block)

with open("src/pages/KioskPage.tsx", "w") as f:
    f.write(content)

print("Kiosk UI Patched.")
