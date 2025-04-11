const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const slsk = require('slsk-client');
const { shell } = require('electron');
const imageSize = require('image-size');
const mm = require('music-metadata');
const { writeFileSync, existsSync, readFileSync } = require('fs');

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

/**
 * Cancel an active download by downloadId.
 * This will abort the download if possible and clean up state.
 */
ipcMain.handle('cancel-download', async (event, downloadId) => {
  logger.info(`Request to cancel download: ${downloadId}`);
  const download = activeDownloads.get(downloadId);
  if (download && typeof download.abort === 'function') {
    try {
      download.abort();
      logger.info(`Download ${downloadId} aborted successfully`);
      activeDownloads.delete(downloadId);
      return { success: true };
    } catch (err) {
      logger.error(`Error aborting download ${downloadId}: ${err.message}`);
      return { success: false, error: err.message };
    }
  } else {
    logger.warn(`No active download found for id: ${downloadId}`);
    return { success: false, error: 'No active download found' };
  }
});
let customProtocolRegistered = false;

/**
 * Download an image from a URL and save it to a specified path.
 */
const https = require('https');
const http = require('http');
ipcMain.handle('save-album-art', async (event, { url, destPath }) => {
  logger.info(`Saving album art from ${url} to ${destPath}`);
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        logger.error(`Failed to download image: ${res.statusCode}`);
        reject(new Error(`Failed to download image: ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        logger.info(`Album art saved to ${destPath}`);
        resolve({ success: true, path: destPath });
      });
      fileStream.on('error', (err) => {
        logger.error(`Error saving album art: ${err.message}`);
        reject(err);
      });
    }).on('error', (err) => {
      logger.error(`Error downloading album art: ${err.message}`);
      reject(err);
    });
  });
});

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

  // Vite/Electron: Load dev server in development, file in production
  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, 'dist/index.html')}`;
  mainWindow.loadURL(startUrl);
  
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
  
  // Register protocol for audio and image files
  protocol.registerFileProtocol('localfile', (request, callback) => {
    const url = request.url.substr(12); // Remove 'localfile://' prefix
    const decodedUrl = decodeURI(url);
    try {
      // Only allow serving audio and image files from the user's Music/yarnball directory
      const homeDir = app.getPath('home');
      const yarnballDir = path.join(homeDir, 'Music', 'yarnball');
      if (!decodedUrl.startsWith(yarnballDir)) {
        logger.error(`Attempted to access file outside of yarnball directory: ${decodedUrl}`);
        return callback(404);
      }
      // Only allow audio and image files
      const allowedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.png', '.jpg', '.jpeg'];
      const ext = path.extname(decodedUrl).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        logger.error(`Attempted to access disallowed file type: ${decodedUrl}`);
        return callback(404);
      }
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

    // Check for album.png in the album folder
    const albumPngPath = path.join(downloadPath, 'album.png');
    const coverPngPath = path.join(downloadPath, 'cover.png');

    // Check if this song already exists in the directory
    let existingFile = null;
    let imagePath = null;
    try {
      const files = fs.readdirSync(downloadPath);
      const sanitizedTitle = sanitizeFileName(title).toLowerCase();
      existingFile = files.find(file => {
        const fileName = path.basename(file, path.extname(file)).toLowerCase();
        return fileName.includes(sanitizedTitle);
      });

      if (existingFile) {
        const existingPath = path.join(downloadPath, existingFile);

        // 1. Try embedded art
        let embeddedArtFound = false;
        if (!existsSync(coverPngPath) && !existsSync(albumPngPath)) {
          try {
            const metadata = await mm.parseFile(existingPath, { duration: false });
            if (metadata.common.picture && metadata.common.picture.length > 0) {
              const pic = metadata.common.picture[0];
              if (pic.format === 'image/png' || pic.format === 'image/jpeg') {
                writeFileSync(coverPngPath, pic.data);
                logger.info(`Extracted embedded album art to ${coverPngPath}`);
                embeddedArtFound = true;
              }
            }
          } catch (metaErr) {
            logger.warn(`Error extracting embedded art: ${metaErr.message}`);
          }
        }

        // 2. If no embedded art, and no album.png, try fallback image
        if (!embeddedArtFound && !existsSync(albumPngPath) && !existsSync(coverPngPath)) {
          const fallback = findBestCoverImage(downloadPath);
          if (fallback) {
            try {
              // Save as cover.png
              const imgData = readFileSync(fallback);
              writeFileSync(coverPngPath, imgData);
              logger.info(`Saved fallback cover image as ${coverPngPath}`);
            } catch (imgErr) {
              logger.warn(`Error saving fallback cover image: ${imgErr.message}`);
            }
          }
        }

        // 3. Set image path: cover.png > album.png > null
        if (existsSync(coverPngPath)) imagePath = coverPngPath;
        else if (existsSync(albumPngPath)) imagePath = albumPngPath;
        else imagePath = null;

        logger.info(`Song already exists in directory: ${existingPath}`);
        return {
          success: true,
          message: `Song "${title}" by "${artist}" already exists at ${existingPath}`,
          path: existingPath,
          format: path.extname(existingPath).substring(1),
          alreadyExists: true,
          image: imagePath
        };
      }
    } catch (err) {
      logger.warn(`Error checking for existing files: ${err.message}`);
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

    // 1. Try embedded art from the downloaded file
    let embeddedArtFound = false;
    if (!existsSync(coverPngPath) && !existsSync(albumPngPath)) {
      try {
        const metadata = await mm.parseFile(result.path, { duration: false });
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const pic = metadata.common.picture[0];
          if (pic.format === 'image/png' || pic.format === 'image/jpeg') {
            writeFileSync(coverPngPath, pic.data);
            logger.info(`Extracted embedded album art to ${coverPngPath}`);
            embeddedArtFound = true;
          }
        }
      } catch (metaErr) {
        logger.warn(`Error extracting embedded art: ${metaErr.message}`);
      }
    }

    // 2. If no embedded art, and no album.png, try fallback image
    if (!embeddedArtFound && !existsSync(albumPngPath) && !existsSync(coverPngPath)) {
      const fallback = findBestCoverImage(downloadPath);
      if (fallback) {
        try {
          // Save as cover.png
          const imgData = readFileSync(fallback);
          writeFileSync(coverPngPath, imgData);
          logger.info(`Saved fallback cover image as ${coverPngPath}`);
        } catch (imgErr) {
          logger.warn(`Error saving fallback cover image: ${imgErr.message}`);
        }
      }
    }

    // 3. Set image path: cover.png > album.png > null
    if (existsSync(coverPngPath)) imagePath = coverPngPath;
    else if (existsSync(albumPngPath)) imagePath = albumPngPath;
    else imagePath = null;

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
      format: path.extname(result.path).substring(1),
      image: imagePath
    });

    return {
      success: true,
      message: `Downloaded "${title}" by "${artist}" from album "${albumName}" to ${result.path}`,
      path: result.path,
      format: path.extname(result.path).substring(1),
      image: imagePath
    };
  } catch (error) {
    logger.error(`Download song error: ${error.message}`);
    throw error;
  }
});

/**
 * Find the best 1:1 aspect ratio image (png/jpg/jpeg) in a directory.
 * Returns the absolute path to the best candidate, or null if none found.
 */
function findBestCoverImage(dir) {
  try {
    const files = fs.readdirSync(dir);
    const imageFiles = files.filter(f =>
      /\.(jpe?g|png)$/i.test(f)
    );
    let best = null;
    let bestScore = Infinity;
    for (const file of imageFiles) {
      try {
        const filePath = path.join(dir, file);
        const { width, height } = imageSize(filePath);
        if (!width || !height) continue;
        // Only consider images at least 200x200
        if (width < 200 || height < 200) continue;
        const aspect = width / height;
        const score = Math.abs(aspect - 1);
        if (score < bestScore) {
          best = filePath;
          bestScore = score;
        }
      } catch (imgErr) {
        logger.warn(`Error reading image size for ${file}: ${imgErr.message}`);
      }
    }
    return best || null;
  } catch (err) {
    logger.warn(`Error finding cover image in ${dir}: ${err.message}`);
    return null;
  }
}

/**
 * IPC handler: Check for local album art in a folder (cover.png or album.png)
 * Returns the absolute path if found, or null.
 */
ipcMain.handle('get-local-album-art', async (event, albumDir) => {
  try {
    const coverPath = path.join(albumDir, 'cover.png');
    const albumPath = path.join(albumDir, 'album.png');
    if (fs.existsSync(coverPath)) return coverPath;
    if (fs.existsSync(albumPath)) return albumPath;
    // Optionally check for jpgs as well
    const coverJpg = path.join(albumDir, 'cover.jpg');
    const albumJpg = path.join(albumDir, 'album.jpg');
    if (fs.existsSync(coverJpg)) return coverJpg;
    if (fs.existsSync(albumJpg)) return albumJpg;
    return null;
  } catch (err) {
    logger.warn(`Error checking for local album art in ${albumDir}: ${err.message}`);
    return null;
  }
});

// NEW CODE: Handler for downloading an entire album at once
ipcMain.handle('download-album', async (event, { artist, albumName, tracks, downloadId, organize, preferredFormat }) => {
  logger.info(`Album download request for "${albumName}" by "${artist}" (${tracks.length} tracks)`);

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

    // Create artist/album directories
    let downloadPath = yarnballDir;

    // Sanitize artist and album names for directory names
    const sanitizedArtist = sanitizeFileName(artist);
    const sanitizedAlbum = sanitizeFileName(albumName);

    // Create artist directory
    const artistDir = path.join(yarnballDir, sanitizedArtist);
    fs.mkdirSync(artistDir, { recursive: true });

    // Create album directory
    const albumDir = path.join(artistDir, sanitizedAlbum);
    fs.mkdirSync(albumDir, { recursive: true });

    downloadPath = albumDir;

    // Track download progress
    const progressCallback = (progress, status) => {
      if (mainWindow && !mainWindow.isDestroyed() && downloadId) {
        mainWindow.webContents.send('album-download-progress', {
          downloadId,
          progress,
          status
        });
      }
    };

    // Send initial progress update
    progressCallback(0, 'Searching for album...');

    // Find and download the album
    const result = await slskSearch.findAndDownloadAlbum(
      artist,
      albumName,
      tracks,
      downloadPath,
      progressCallback,
      preferredFormat
    );

    // Loop through the downloaded tracks and add them to the library
    const downloadedTracks = [];
    
    for (const track of result.tracks) {
      // Add song to library through the event system
      const songInfo = {
        id: Math.random().toString(36).substring(2, 15),
        name: track.title,
        artist: artist,
        album: albumName,
        path: track.path,
        format: path.extname(track.path).substring(1)
      };
      
      mainWindow.webContents.send('add-song-to-library', songInfo);
      downloadedTracks.push(songInfo);
    }

    return {
      success: true,
      message: `Downloaded album "${albumName}" by "${artist}" with ${result.tracks.length} tracks`,
      tracks: downloadedTracks
    };
  } catch (error) {
    logger.error(`Download album error: ${error.message}`);
    throw error;
  }
});
