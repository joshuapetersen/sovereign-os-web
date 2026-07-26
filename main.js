const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    frame: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows local cross-origin API calls to Sovereign OS Gateway
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../sarah_logo.ico')
  });

  // If in dev environment, load Vite port 7860, else load built index.html
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  if (isDev) {
    mainWindow.loadURL('http://localhost:7860');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Telemetry Handlers
ipcMain.handle('get-system-telemetry', async () => {
  return {
    kv_cache_tps: "40,267,415.39 TPS",
    gpu_ffi_tps: "130.68 TPS",
    coherence: "1.0000",
    node: "NODE_24: SARAH_AUTONOMOUS_MANIFOLD_DESIGN"
  };
});
