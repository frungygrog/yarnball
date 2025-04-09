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