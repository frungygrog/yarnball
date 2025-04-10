const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC functions to the renderer process
contextBridge.exposeInMainWorld('api', {
  // Soulseek functions
  connect: (credentials) => ipcRenderer.invoke('connect-soulseek', credentials),
  search: (query) => ipcRenderer.invoke('search-files', query),
  download: (fileInfo) => ipcRenderer.invoke('download-file', fileInfo),
  
  // Last.fm functions
  initLastFm: (apiKey) => ipcRenderer.invoke('init-lastfm', apiKey),
  searchLastFm: (query) => ipcRenderer.invoke('search-lastfm', query),
  searchLastFmAlbums: (query) => ipcRenderer.invoke('search-lastfm-albums', query),
  searchLastFmArtists: (query) => ipcRenderer.invoke('search-lastfm-artists', query),
  getTrackInfo: (params) => ipcRenderer.invoke('get-track-info', params),
  getAlbumInfo: (params) => ipcRenderer.invoke('get-album-info', params),
  getAlbumTracks: (artist, album) => ipcRenderer.invoke('get-album-tracks', { artist, album }),
  getArtistInfo: (artist) => ipcRenderer.invoke('get-artist-info', artist),
  getArtistTopTracks: (artist) => ipcRenderer.invoke('get-artist-top-tracks', artist),
  getArtistAlbums: (artist) => ipcRenderer.invoke('get-artist-albums', artist),
  downloadSong: (songInfo) => ipcRenderer.invoke('download-song', songInfo),
  
  // NEW: Album download function
  downloadAlbum: (albumInfo) => ipcRenderer.invoke('download-album', albumInfo),
  
  // File system functions
  getDownloadPath: () => ipcRenderer.invoke('get-download-path'),
  selectDownloadPath: () => ipcRenderer.invoke('select-download-path'),
  playLocalFile: (filePath) => ipcRenderer.invoke('play-local-file', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),

  // Download control
  cancelDownload: (downloadId) => ipcRenderer.invoke('cancel-download', downloadId),
  saveAlbumArt: ({ url, destPath }) => ipcRenderer.invoke('save-album-art', { url, destPath }),

  // Logs
  getLogs: () => ipcRenderer.invoke('get-logs'),
  
  // Events
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('download-progress');
    };
  },
  
  // NEW: Album download progress event
  onAlbumDownloadProgress: (callback) => {
    ipcRenderer.on('album-download-progress', (_event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('album-download-progress');
    };
  },
  
  // Add song to library event
  addSongToLibrary: (callback) => {
    ipcRenderer.on('add-song-to-library', (_event, song) => callback(song));
    return () => {
      ipcRenderer.removeAllListeners('add-song-to-library');
    };
  },

  // Check for local album art in a folder (returns absolute path or null)
  getLocalAlbumArt: (albumDir) => ipcRenderer.invoke('get-local-album-art', albumDir)
});
