const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sovereignAPI', {
  getTelemetry: () => ipcRenderer.invoke('get-system-telemetry')
});
