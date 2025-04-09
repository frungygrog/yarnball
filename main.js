const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Import utility classes
const LastFmAPI = require('./utils/lastfm');
const SoulseekClient = require('./utils/soulseek');

// Initialize configuration store
const store = new Store();

let mainWindow;
let soulseekClient;
let lastfmAPI;

// Set default download path if not set
if (!store.get('downloadPath')) {
  store.set('downloadPath', path.join(app.getPath('music'), 'electron-music-player'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // For development
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  
  // Initialize APIs
  initializeAPIs();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Initialize APIs
function initializeAPIs() {
  // Initialize Last.fm API
  const lastfmApiKey = store.get('lastfmApiKey') || '6d07f654073f61d5b3ba91365362ad63';
  lastfmAPI = new LastFmAPI(lastfmApiKey);
  
  // Initialize Soulseek client
  soulseekClient = new SoulseekClient();
  connectToSoulseek();
}

// Connect to Soulseek network
async function connectToSoulseek() {
  try {
    // Default credentials - in a real app, you'd want to get these from the user
    const username = store.get('soulseekUsername') || 'yarnball';
    const password = store.get('soulseekPassword') || 'yarnball';
    
    await soulseekClient.connect(username, password);
    
    if (mainWindow) {
      mainWindow.webContents.send('soulseek-status', 'connected');
    }
  } catch (error) {
    console.error('Failed to connect to Soulseek:', error);
    if (mainWindow) {
      mainWindow.webContents.send('soulseek-status', 'error', error.message);
    }
  }
}

// IPC Handlers
ipcMain.handle('search-lastfm', async (event, query) => {
  try {
    // Update API key in case it was changed in settings
    const apiKey = store.get('lastfmApiKey');
    if (apiKey) {
      lastfmAPI.setApiKey(apiKey);
    }
    
    return await lastfmAPI.searchTrack(query);
  } catch (error) {
    console.error('Last.fm search error:', error);
    throw error;
  }
});

ipcMain.handle('search-soulseek', async (event, params) => {
  try {
    if (!soulseekClient.connected) {
      await connectToSoulseek();
    }
    
    return await soulseekClient.search(params);
  } catch (error) {
    console.error('Soulseek search error:', error);
    throw error;
  }
});

ipcMain.handle('download-track', async (event, trackInfo) => {
  try {
    if (!soulseekClient.connected) {
      await connectToSoulseek();
    }
    
    const downloadPath = store.get('downloadPath');
    return await soulseekClient.downloadTrack(trackInfo, downloadPath);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
});

ipcMain.handle('set-download-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const newPath = result.filePaths[0];
    store.set('downloadPath', newPath);
    return newPath;
  }
  
  return store.get('downloadPath');
});

ipcMain.handle('get-settings', () => {
  return {
    downloadPath: store.get('downloadPath'),
    lastfmApiKey: store.get('lastfmApiKey'),
    soulseekUsername: store.get('soulseekUsername'),
    soulseekPassword: store.get('soulseekPassword')
  };
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set(settings);
  
  // Update API key if changed
  if (settings.lastfmApiKey && lastfmAPI) {
    lastfmAPI.setApiKey(settings.lastfmApiKey);
  }
  
  // Reconnect to Soulseek if credentials changed
  if ((settings.soulseekUsername || settings.soulseekPassword) && soulseekClient) {
    connectToSoulseek();
  }
  
  return true;
});

// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  searchLastFm: (query) => ipcRenderer.invoke('search-lastfm', query),
  searchSoulseek: (params) => ipcRenderer.invoke('search-soulseek', params),
  downloadTrack: (params) => ipcRenderer.invoke('download-track', params),
  setDownloadPath: () => ipcRenderer.invoke('set-download-path'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  onSoulseekStatus: (callback) => {
    ipcRenderer.on('soulseek-status', (event, status, error) => {
      callback(status, error);
    });
  }
});
