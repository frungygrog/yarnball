const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const slsk = require('slsk-client');
const { shell } = require('electron');

// Import custom utilities
const LastFmAPI = require('./src/api/lastfm');
const SlskSearch = require('./src/api/soulseek');
const logger = require('./src/lib/logger');

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9\s.-]/g, '').replace(/\s+/g, ' ').trim();
}

let mainWindow;
let slskClient;
let lastFmApi;
let slskSearch;
let defaultLastFmKey = '0ef47b7d4d7a5bd325bb2646837b4908';
let activeDownloads = new Map();
let customProtocolRegistered = false;

function createWindow() {
  logger.info('Creating main application window');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools during development
  // mainWindow.webContents.openDevTools();
  
  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  
  logger.info('Application window created');
}

app.whenReady().then(() => {
  logger.info('Application ready, initializing');
  
  // Register protocol for audio files
  protocol.registerFileProtocol('localfile', (request, callback) => {
    const url = request.url.substr(12); // Remove 'localfile://' prefix
    const decodedUrl = decodeURI(url);
    try {
      return callback(decodedUrl);
    } catch (error) {
      logger.error(`Protocol handler error: ${error}`);
      return callback(404);
    }
  });
  
  customProtocolRegistered = true;
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  logger.info('All windows closed');
  if (process.platform !== 'darwin') {
    if (slskClient) {
      logger.info('Disconnecting from Soulseek');
      slskClient.disconnect();
    }
    app.quit();
  }
});

// Connect to Soulseek
ipcMain.handle('connect-soulseek', async (event, credentials) => {
  logger.info(`Connecting to Soulseek as user: ${credentials.username}`);
  return new Promise((resolve, reject) => {
    slsk.connect({
      user: credentials.username,
      pass: credentials.password
    }, (err, client) => {
      if (err) {
        logger.error(`Soulseek connection error: ${err.message}`);
        reject(err.message);
      } else {
        slskClient = client;
        slskSearch = new SlskSearch(slskClient);
        logger.info('Successfully connected to Soulseek');
        resolve('Connected successfully!');
      }
    });
  });
});

// Initialize Last.fm API
ipcMain.handle('init-lastfm', async (event, apiKey) => {
  const key = apiKey || defaultLastFmKey;
  logger.info(`Initializing Last.fm API with key: ${key.substring(0, 5)}...`);
  
  try {
    lastFmApi = new LastFmAPI(key);
    return 'Last.fm API initialized successfully';
  } catch (error) {
    logger.error(`Last.fm API initialization error: ${error.message}`);
    throw error;
  }
});

// Search for tracks on Last.fm
ipcMain.handle('search-lastfm', async (event, searchQuery) => {
  logger.info(`Searching Last.fm for tracks: "${searchQuery}"`);
  try {
    if (!lastFmApi) {
      lastFmApi = new LastFmAPI(defaultLastFmKey);
      logger.info('Created Last.fm API with default key');
    }
    
    const tracks = await lastFmApi.searchTrack(searchQuery);
    return tracks;
  } catch (error) {
    logger.error(`Last.fm track search error: ${error.message}`);
    throw error;
  }
});

// Search for albums on Last.fm
ipcMain.handle('search-lastfm-albums', async (event, searchQuery) => {
  logger.info(`Searching Last.fm for albums: "${searchQuery}"`);
  try {
    if (!lastFmApi) {
      lastFmApi = new LastFmAPI(defaultLastFmKey);
      logger.info('Created Last.fm API with default key');
    }
    
    const albums = await lastFmApi.searchAlbum(searchQuery);
    return albums;
  } catch (error) {
    logger.error(`Last.fm album search error: ${error.message}`);
    throw error;
  }
});

// Search for artists on Last.fm
ipcMain.handle('search-lastfm-artists', async (event, searchQuery) => {
  logger.info(`Searching Last.fm for artists: "${searchQuery}"`);
  try {
    if (!lastFmApi) {
      lastFmApi = new LastFmAPI(defaultLastFmKey);
      logger.info('Created Last.fm API with default key');
    }
    
    const artists = await lastFmApi.searchArtist(searchQuery);
    return artists;
  } catch (error) {
    logger.error(`Last.fm artist search error: ${error.message}`);
    throw error;
  }
});

// Get track details from Last.fm
ipcMain.handle('get-track-info', async (event, { artist, track }) => {
  logger.info(`Getting track info for: "${artist}" - "${track}"`);
  try {
    if (!lastFmApi) {
      lastFmApi = new LastFmAPI(defaultLastFmKey);
    }
    
    const trackInfo = await lastFmApi.getTrackInfo(artist, track);
    return trackInfo;
  } catch (error) {
    logger.error(`Error getting track info: ${error.message}`);
    throw error;
  }
});

// Get album details from Last.fm
ipcMain.handle('get-album-info', async (event, { artist, album }) => {
  logger.info(`Getting album info for: "${artist}" - "${album}"`);
  try {
    if (!lastFmApi) {
      lastFmApi = new LastFmAPI(defaultLastFmKey);
    }
    
    const albumInfo = await lastFmApi.getAlbumInfo(artist, album);
    return albumInfo;
  } catch (error) {
    logger.error(`Error getting album info: ${error.message}`);
    throw error;
  }
});

// Get album tracks from Last.fm
ipcMain.handle('get-album-tracks', async (event, { artist, album }) => {
  logger.info(`Getting album tracks for: "${artist}" - "${album}"`);
  try {
    if (!lastFmApi) {
      lastFmApi = new LastFmAPI(defaultLastFmKey);
    }
    
    const albumInfo = await lastFmApi.getAlbumInfo(artist, album);
    return albumInfo.tracks?.track || [];
  } catch (error) {
    logger.error(`Error getting album tracks: ${error.message}`);
    throw error;
  }
});

// Get artist info from Last.fm
ipcMain.handle('get-artist-info', async (event, artist) => {
  logger.info(`Getting artist info for: "${artist}"`);
  try {
    if (!lastFmApi) {
      lastFmApi = new LastFmAPI(defaultLastFmKey);
    }
    
    const artistInfo = await lastFmApi.getArtistInfo(artist);
    return artistInfo;
  } catch (error) {
    logger.error(`Error getting artist info: ${error.message}`);
    throw error;
  }
});

// Get artist top tracks from Last.fm
ipcMain.handle('get-artist-top-tracks', async (event, artist) => {
  logger.info(`Getting top tracks for artist: "${artist}"`);
  try {
    if (!lastFmApi) {
      lastFmApi = new LastFmAPI(defaultLastFmKey);
    }
    
    const topTracks = await lastFmApi.getArtistTopTracks(artist);
    return topTracks;
  } catch (error) {
    logger.error(`Error getting artist top tracks: ${error.message}`);
    throw error;
  }
});

// Get artist albums from Last.fm
ipcMain.handle('get-artist-albums', async (event, artist) => {
  logger.info(`Getting albums for artist: "${artist}"`);
  try {
    if (!lastFmApi) {
      lastFmApi = new LastFmAPI(defaultLastFmKey);
    }
    
    const albums = await lastFmApi.getArtistAlbums(artist);
    return albums;
  } catch (error) {
    logger.error(`Error getting artist albums: ${error.message}`);
    throw error;
  }
});

// Handle local audio file playback
ipcMain.handle('play-local-file', async (event, filePath) => {
  logger.info(`Request to play local file: ${filePath}`);
  
  // Verify the file exists
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    throw new Error('File not found');
  }
  
  try {
    // Check if the file is a valid audio file
    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'];
    
    if (!validExtensions.includes(ext)) {
      logger.error(`Invalid audio format: ${ext}`);
      throw new Error('Invalid audio format');
    }
    
    // Return the file URL with the custom protocol
    const fileUrl = `localfile://${filePath}`;
    return fileUrl;
  } catch (error) {
    logger.error(`Error preparing file for playback: ${error.message}`);
    throw error;
  }
});

// Get download path
ipcMain.handle('get-download-path', async () => {
  const homeDir = app.getPath('home');
  const yarnballDir = path.join(homeDir, 'Music', 'yarnball');
  
  // Create directory if it doesn't exist
  try {
    fs.mkdirSync(yarnballDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      logger.error(`Failed to create download directory: ${error.message}`);
      throw error;
    }
  }
  
  return yarnballDir;
});

// Select download path
ipcMain.handle('select-download-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  
  return null;
});

// Get logs
ipcMain.handle('get-logs', async () => {
  const logsPath = path.join(process.cwd(), 'logs', 'app.log');
  
  try {
    if (fs.existsSync(logsPath)) {
      const logs = fs.readFileSync(logsPath, 'utf8');
      return logs;
    } else {
      return 'No logs found';
    }
  } catch (error) {
    logger.error(`Error reading logs: ${error.message}`);
    throw error;
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  logger.info(`Request to delete file: ${filePath}`);
  
  // Verify the file exists
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    throw new Error('File not found');
  }
  
  try {
    // Make sure the file is in the allowed directory (for security)
    const homeDir = app.getPath('home');
    const yarnballDir = path.join(homeDir, 'Music', 'yarnball');
    const normalizedPath = path.normalize(filePath);
    
    // Only allow deleting files within the yarnball directory
    if (!normalizedPath.startsWith(yarnballDir)) {
      logger.error(`Security error: Attempted to delete file outside of yarnball directory: ${filePath}`);
      throw new Error('Security error: Cannot delete files outside of the music directory');
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    logger.info(`File deleted successfully: ${filePath}`);
    
    // Check if we need to clean up empty directories
    const dirPath = path.dirname(filePath);
    if (dirPath !== yarnballDir) {
      // Check if directory is empty
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        // Directory is empty, delete it
        fs.rmdirSync(dirPath);
        logger.info(`Empty directory removed: ${dirPath}`);
        
        // Check if parent directory (artist) is now empty
        const parentDirPath = path.dirname(dirPath);
        if (parentDirPath !== yarnballDir) {
          const parentFiles = fs.readdirSync(parentDirPath);
          if (parentFiles.length === 0) {
            // Parent directory is empty, delete it
            fs.rmdirSync(parentDirPath);
            logger.info(`Empty artist directory removed: ${parentDirPath}`);
          }
        }
      }
    }
    
    return { success: true, message: `File deleted: ${path.basename(filePath)}` };
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    throw error;
  }
});

ipcMain.handle('download-song', async (event, { artist, title, album, downloadId, organize, preferredFormat }) => {
  logger.info(`Download request for "${title}" by "${artist}" from album "${album}"`);

  try {
    if (!slskClient || !slskSearch) {
      logger.error('Not connected to Soulseek');
      throw new Error('Not connected to Soulseek');
    }

    // Create the yarnball directory in Music if it doesn't exist
    const homeDir = app.getPath('home');
    const yarnballDir = path.join(homeDir, 'Music', 'yarnball');
    try {
      fs.mkdirSync(yarnballDir, { recursive: true });
      logger.debug(`Created or verified download directory: ${yarnballDir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        logger.error(`Failed to create directory: ${err.message}`);
        throw err;
      }
    }

    // Create artist/album directories if organize option is enabled
    let downloadPath = yarnballDir;

    if (organize) {
      // Sanitize artist and album names for directory names
      const sanitizedArtist = sanitizeFileName(artist);
      const sanitizedAlbum = sanitizeFileName(album);

      // Create artist directory
      const artistDir = path.join(yarnballDir, sanitizedArtist);
      fs.mkdirSync(artistDir, { recursive: true });

      // Create album directory
      const albumDir = path.join(artistDir, sanitizedAlbum);
      fs.mkdirSync(albumDir, { recursive: true });

      downloadPath = albumDir;
    }

    // NEW CODE: Check if this song already exists in the directory
    // This prevents file system duplicates
    let existingFile = null;
    
    // Check if the song already exists in the download directory
    try {
      const files = fs.readdirSync(downloadPath);
      const sanitizedTitle = sanitizeFileName(title).toLowerCase();
      
      // Look for files that match the title (case insensitive)
      existingFile = files.find(file => {
        const fileName = path.basename(file, path.extname(file)).toLowerCase();
        return fileName.includes(sanitizedTitle);
      });
      
      if (existingFile) {
        const existingPath = path.join(downloadPath, existingFile);
        logger.info(`Song already exists in directory: ${existingPath}`);
        
        // Return the existing file instead of downloading again
        return {
          success: true,
          message: `Song "${title}" by "${artist}" already exists at ${existingPath}`,
          path: existingPath,
          format: path.extname(existingPath).substring(1),
          alreadyExists: true
        };
      }
    } catch (err) {
      logger.warn(`Error checking for existing files: ${err.message}`);
      // Continue with download if there's an error checking for existing files
    }

    // Track download progress
    const progressCallback = (progress, status) => {
      if (mainWindow && !mainWindow.isDestroyed() && downloadId) {
        mainWindow.webContents.send('download-progress', {
          downloadId,
          progress,
          status
        });
      }
    };

    // Find and download the song with progress reporting
    const result = await slskSearch.findAndDownloadSong(
      artist,
      title,
      album,
      downloadPath,
      progressCallback,
      preferredFormat
    );

    // Fetch album info if album is unknown
    let albumName = album;
    if (album === 'Unknown Album') {
      try {
        const trackInfo = await lastFmApi.getTrackInfo(artist, title);
        albumName = trackInfo?.album?.title || 'Unknown Album';
        logger.info(`Found album "${albumName}" for track "${title}" by "${artist}"`);
      } catch (albumError) {
        logger.error(`Error getting album info: ${albumError.message}`);
      }
    }

    // Send the new song info to the renderer process
    mainWindow.webContents.send('add-song-to-library', {
      id: Math.random().toString(36).substring(2, 15), // Generate a unique ID
      name: title,
      artist: artist,
      album: albumName,
      path: result.path,
      format: path.extname(result.path).substring(1)
    });

    return {
      success: true,
      message: `Downloaded "${title}" by "${artist}" from album "${albumName}" to ${result.path}`,
      path: result.path,
      format: path.extname(result.path).substring(1)
    };
  } catch (error) {
    logger.error(`Download song error: ${error.message}`);
    throw error;
  }
});