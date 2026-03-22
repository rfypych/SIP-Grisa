import re

with open("src/store/useSettingsStore.ts", "r") as f:
    content = f.read()

content = content.replace(
    "  presenceLimitTime: string;",
    "  presenceLimitTime: string;\n  checkinStartTime: string;\n  checkoutStartTime: string;"
)

content = content.replace(
    "    presence_limit_time: string,",
    "    presence_limit_time: string,\n    checkin_start_time: string,\n    checkout_start_time: string,"
)

content = content.replace(
    "      presenceLimitTime: '14:00',",
    "      presenceLimitTime: '14:00',\n      checkinStartTime: '06:00',\n      checkoutStartTime: '14:00',"
)

content = content.replace(
    "            presenceLimitTime: data.presence_limit_time || '14:00',",
    "            presenceLimitTime: data.presence_limit_time || '14:00',\n            checkinStartTime: data.checkin_start_time || '06:00',\n            checkoutStartTime: data.checkout_start_time || '14:00',"
)

content = content.replace(
    "            presenceLimitTime: settingsPartial.presence_limit_time !== undefined ? settingsPartial.presence_limit_time : state.presenceLimitTime,",
    "            presenceLimitTime: settingsPartial.presence_limit_time !== undefined ? settingsPartial.presence_limit_time : state.presenceLimitTime,\n            checkinStartTime: settingsPartial.checkin_start_time !== undefined ? settingsPartial.checkin_start_time : state.checkinStartTime,\n            checkoutStartTime: settingsPartial.checkout_start_time !== undefined ? settingsPartial.checkout_start_time : state.checkoutStartTime,"
)

with open("src/store/useSettingsStore.ts", "w") as f:
    f.write(content)

print("Store updated.")
