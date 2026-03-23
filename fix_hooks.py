import re

with open("src/pages/KioskPage.tsx", "r") as f:
    content = f.read()

# Replace invalid hooks inside useEffect
old_hooks = """    ws.current = new WebSocket(wsUrl);
    const isProcessingRef = useRef(false);
    const lastRequestTimeRef = useRef(Date.now());"""

new_hooks = """    ws.current = new WebSocket(wsUrl);
    let isProcessing = false;
    let lastRequestTime = Date.now();"""

content = content.replace(old_hooks, new_hooks)

# Fix the interval references back to standard local variables
old_refs1 = """      if (isProcessingRef.current && Date.now() - lastRequestTimeRef.current > 5000) {
        isProcessingRef.current = false;
      }

      if (!isProcessingRef.current) {
        isProcessingRef.current = true;
        lastRequestTimeRef.current = Date.now();
        captureAndSend();
      }"""

new_refs1 = """      if (isProcessing && Date.now() - lastRequestTime > 5000) {
        isProcessing = false;
      }

      if (!isProcessing) {
        isProcessing = true;
        lastRequestTime = Date.now();
        captureAndSend();
      }"""

content = content.replace(old_refs1, new_refs1)

# Fix onmessage resetting the flag
old_onmessage = """    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      isProcessingRef.current = false;"""

new_onmessage = """    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      isProcessing = false;"""

content = content.replace(old_onmessage, new_onmessage)


with open("src/pages/KioskPage.tsx", "w") as f:
    f.write(content)

print("Hooks fixed.")
