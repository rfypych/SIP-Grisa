import re

with open("src/store/useSettingsStore.ts", "r") as f:
    content = f.read()

# Add enforceMinGap to store
content = content.replace("  checkoutStartTime: string;", "  checkoutStartTime: string;\n  enforceMinGap: boolean;")
content = content.replace("    checkout_start_time: string,", "    checkout_start_time: string,\n    enforce_min_gap?: number,")
content = content.replace("      checkoutStartTime: '14:00',", "      checkoutStartTime: '14:00',\n      enforceMinGap: false,")
content = content.replace("            checkoutStartTime: data.checkout_start_time || '14:00',", "            checkoutStartTime: data.checkout_start_time || '14:00',\n            enforceMinGap: !!data.enforce_min_gap,")
content = content.replace("            checkoutStartTime: settingsPartial.checkout_start_time !== undefined ? settingsPartial.checkout_start_time : state.checkoutStartTime,", "            checkoutStartTime: settingsPartial.checkout_start_time !== undefined ? settingsPartial.checkout_start_time : state.checkoutStartTime,\n            enforceMinGap: settingsPartial.enforce_min_gap !== undefined ? !!settingsPartial.enforce_min_gap : state.enforceMinGap,")

with open("src/store/useSettingsStore.ts", "w") as f:
    f.write(content)

with open("src/pages/KioskPage.tsx", "r") as f:
    content = f.read()

# Update Kiosk to support enforceMinGap toggle locally
content = content.replace(
    "    checkoutStartTime,",
    "    checkoutStartTime,\n    enforceMinGap,"
)
content = content.replace(
    "  const [localCheckoutMin, setLocalCheckoutMin] = useState(0);",
    "  const [localCheckoutMin, setLocalCheckoutMin] = useState(0);\n  const [localEnforceMinGap, setLocalEnforceMinGap] = useState(false);"
)

content = content.replace(
    "    setLocalCheckoutMin(coM || 0);",
    "    setLocalCheckoutMin(coM || 0);\n    setLocalEnforceMinGap(enforceMinGap);"
)

content = content.replace(
    "  }, [cooldownSeconds, minGapMinutes, presenceLimitTime, checkinStartTime, checkoutStartTime]);",
    "  }, [cooldownSeconds, minGapMinutes, presenceLimitTime, checkinStartTime, checkoutStartTime, enforceMinGap]);"
)

# Add Enforce Min Gap toggle next to min_gap
old_min_gap_ui = """                   {/* Min Gap */}
                   <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                         <span className="text-slate-400">Min Gap Pulang</span>
                         <span className="text-emerald-400">{localMinGap}m</span>
                      </div>
                      <input
                        type="range" min="0" max="240" step="10" value={localMinGap}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setLocalMinGap(val);
                          handleUpdateSetting('min_gap_minutes', val);
                        }}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                   </div>"""

new_min_gap_ui = """                   {/* Min Gap & Wajib Gap Toggle */}
                   <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                         <span className="text-slate-400">Min Gap Pulang</span>
                         <div className="flex items-center gap-2">
                            <span className="text-slate-500 uppercase text-[8px] font-black">Wajib?</span>
                            <button
                              className={`w-8 h-4 rounded-full transition-colors relative ${localEnforceMinGap ? 'bg-emerald-500' : 'bg-slate-700'}`}
                              onClick={() => {
                                const newVal = !localEnforceMinGap;
                                setLocalEnforceMinGap(newVal);
                                handleUpdateSetting('enforce_min_gap', newVal ? 1 : 0);
                              }}
                            >
                               <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${localEnforceMinGap ? 'left-4' : 'left-0.5'}`} />
                            </button>
                            <span className="text-emerald-400 font-bold ml-1">{localMinGap}m</span>
                         </div>
                      </div>
                      <input
                        type="range" min="0" max="240" step="10" value={localMinGap}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setLocalMinGap(val);
                          handleUpdateSetting('min_gap_minutes', val);
                        }}
                        disabled={!localEnforceMinGap}
                        className={`w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${!localEnforceMinGap ? 'opacity-30' : ''}`}
                      />
                   </div>"""

content = content.replace(old_min_gap_ui, new_min_gap_ui)

with open("src/pages/KioskPage.tsx", "w") as f:
    f.write(content)

print("Kiosk Animation/Toggle Patched.")
