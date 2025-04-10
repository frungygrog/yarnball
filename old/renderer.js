// DOM Elements - Navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const libraryTabs = document.querySelectorAll('.library-tab');
const libraryContents = document.querySelectorAll('.library-content');

// DOM Elements - Search
const globalSearchInput = document.getElementById('global-search');
const globalSearchBtn = document.getElementById('global-search-btn');
const searchFilters = document.querySelectorAll('.search-filter');
const searchResults = document.getElementById('search-results');
const searchStatus = document.getElementById('search-status');

// DOM Elements - Settings
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const connectBtn = document.getElementById('connect-btn');
const connectionStatus = document.getElementById('connection-status');
const lastfmKeyInput = document.getElementById('lastfm-key');
const initLastfmBtn = document.getElementById('init-lastfm-btn');
const lastfmStatus = document.getElementById('lastfm-status');
const downloadPathInput = document.getElementById('download-path');
const changePathBtn = document.getElementById('change-path-btn');
const organizeFilesCheckbox = document.getElementById('organize-files');
const preferredFormatSelect = document.getElementById('preferred-format');

// DOM Elements - Logs
const openLogsBtn = document.getElementById('open-logs-btn');
const logsModal = document.getElementById('logs-modal');
const closeModal = document.querySelector('.close-modal');
const refreshLogsBtn = document.getElementById('refresh-logs');
const logsContent = document.getElementById('logs-content');

// DOM Elements - Player
const currentTrackImage = document.getElementById('current-track-image');
const currentTrackName = document.getElementById('current-track-name');
const currentTrackArtist = document.getElementById('current-track-artist');
const favoriteTrackBtn = document.getElementById('favorite-track');
const prevTrackBtn = document.getElementById('prev-track');
const playPauseBtn = document.getElementById('play-pause');
const nextTrackBtn = document.getElementById('next-track');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const trackProgress = document.getElementById('track-progress');
const volumeBtn = document.getElementById('volume-btn');
const volumeProgress = document.getElementById('volume-progress');

// DOM Elements - Downloads
const downloadsContainer = document.getElementById('downloads-container');
const minimizeDownloadsBtn = document.getElementById('minimize-downloads');
const downloadsPanel = document.querySelector('.downloads-panel');

// DOM Elements - Artist View
const artistViewSection = document.getElementById('artist-view-section');
const backToSearchBtn = document.getElementById('back-to-search');
const artistName = document.getElementById('artist-name');
const favoriteArtistBtn = document.getElementById('favorite-artist');
const artistSongsList = document.getElementById('artist-songs-list');
const artistAlbumsGrid = document.getElementById('artist-albums-grid');

// DOM Elements - Album View
const albumViewSection = document.getElementById('album-view-section');
const backFromAlbumBtn = document.getElementById('back-from-album');
const albumCoverImg = document.getElementById('album-cover-img');
const albumTitle = document.getElementById('album-title');
const albumArtist = document.getElementById('album-artist');
const downloadAlbumBtn = document.getElementById('download-album');
const albumTracksList = document.getElementById('album-tracks-list');

// DOM Elements - Library
const savedSongsList = document.getElementById('saved-songs-list');
const albumsGrid = document.getElementById('albums-grid');
const artistsGrid = document.getElementById('artists-grid');

// DOM Elements - Favorites
const favoriteArtistsGrid = document.getElementById('favorite-artists-grid');

// Global storage for data
let currentActiveSection = 'search';
let previousSection = '';
let currentArtist = null;
let currentContext = null;
let currentAlbum = null;
let currentFilter = 'all';
let searchResultsData = { songs: [], albums: [], artists: [] };
let libraryData = { songs: [], albums: [], artists: [] };
let favoritesData = { artists: [], songs: [] };
let queue = [];
let currentTrackIndex = -1;
let isPlaying = false;
let audio = null;
let downloads = [];
let slskConnected = false;
let lastfmInitialized = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Listen for new songs being added to the library
  window.api.onDownloadProgress((data) => {
    console.log('Download progress:', data);
  });

  window.api.addSongToLibrary((song) => {
    libraryData.songs.push(song);
    updateLibraryUI();
    saveLibraryData();
  });
});

// App initialization
async function initApp() {
  // Load library data from localStorage
  loadLibraryData();
  loadFavoritesData();
  
  // Update UI based on loaded data
  updateLibraryUI();
  updateFavoritesUI();
  
  // Initialize downloads panel
  updateDownloadsPanel();
  
  // Get download path
  try {
    const path = await window.api.getDownloadPath();
    downloadPathInput.value = path;
  } catch (error) {
    console.error('Error getting download path:', error);
  }
  
  // Check for saved Soulseek credentials
  const savedUsername = localStorage.getItem('slsk_username');
  const savedPassword = localStorage.getItem('slsk_password');
  
  if (savedUsername && savedPassword) {
    usernameInput.value = savedUsername;
    passwordInput.value = savedPassword;
    
    // Auto-connect if credentials exist
    connectToSoulseek();
  }
  
  // Check for saved Last.fm API key
  const savedApiKey = localStorage.getItem('lastfm_api_key');
  
  if (savedApiKey) {
    lastfmKeyInput.value = savedApiKey;
    
    // Auto-initialize Last.fm API if key exists
    initializeLastFm();
  }
}

// Navigation
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const sectionName = item.dataset.section;
    
    // Only switch if not already active
    if (sectionName !== currentActiveSection) {
      previousSection = currentActiveSection;
      switchSection(sectionName);
    }
  });
});

// Library tabs
libraryTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // Remove active class from all tabs and contents
    libraryTabs.forEach(t => t.classList.remove('active'));
    libraryContents.forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    tab.classList.add('active');
    document.getElementById(`${tabName}-container`).classList.add('active');
  });
});

// Search filters
searchFilters.forEach(filter => {
  filter.addEventListener('click', () => {
    currentFilter = filter.dataset.filter;
    
    // Toggle active class
    searchFilters.forEach(f => f.classList.remove('active'));
    filter.classList.add('active');
    
    // Filter search results if any
    if (searchResultsData.songs.length > 0 || searchResultsData.albums.length > 0 || searchResultsData.artists.length > 0) {
      displaySearchResults();
    }
  });
});

// Switch section function
function switchSection(sectionName) {
  // Update active class on nav items
  navItems.forEach(item => {
    if (item.dataset.section === sectionName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Hide all sections and show the selected one
  contentSections.forEach(section => {
    section.classList.remove('active');
  });
  
  document.getElementById(`${sectionName}-section`).classList.add('active');
  currentActiveSection = sectionName;
}

// Back buttons
backToSearchBtn.addEventListener('click', () => {
  switchSection(previousSection || 'search');
});

backFromAlbumBtn.addEventListener('click', () => {
  if (currentAlbum?.fromArtist) {
    // If we came from artist view, go back there
    switchSection('artist-view');
  } else {
    // Otherwise go back to previous section
    switchSection(previousSection || 'search');
  }
});

// Connect to Soulseek
connectBtn.addEventListener('click', connectToSoulseek);

async function connectToSoulseek() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!username || !password) {
    showStatus(connectionStatus, 'Please enter both username and password', 'error');
    return;
  }
  
  showStatus(connectionStatus, 'Connecting...', '');
  
  try {
    const result = await window.api.connect({ username, password });
    showStatus(connectionStatus, result, 'success');
    
    // Save credentials to localStorage
    localStorage.setItem('slsk_username', username);
    localStorage.setItem('slsk_password', password);
    
    slskConnected = true;
  } catch (error) {
    showStatus(connectionStatus, `Error: ${error}`, 'error');
    slskConnected = false;
  }
}

// Initialize Last.fm API
initLastfmBtn.addEventListener('click', initializeLastFm);

async function initializeLastFm() {
  const apiKey = lastfmKeyInput.value.trim();
  
  if (!apiKey) {
    showStatus(lastfmStatus, 'Please enter a Last.fm API key', 'error');
    return;
  }
  
  showStatus(lastfmStatus, 'Initializing Last.fm API...', '');
  
  try {
    const result = await window.api.initLastFm(apiKey);
    showStatus(lastfmStatus, result, 'success');
    
    // Save API key to localStorage
    localStorage.setItem('lastfm_api_key', apiKey);
    
    lastfmInitialized = true;
  } catch (error) {
    showStatus(lastfmStatus, `Error: ${error}`, 'error');
    lastfmInitialized = false;
  }
}

// Global search
globalSearchBtn.addEventListener('click', performSearch);
globalSearchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

async function performSearch() {
  const query = globalSearchInput.value.trim();
  
  if (!query) {
    showStatus(searchStatus, 'Please enter a search query', 'error');
    return;
  }
  
  if (!lastfmInitialized) {
    showStatus(searchStatus, 'Please initialize Last.fm API first', 'error');
    switchSection('settings');
    return;
  }
  
  showStatus(searchStatus, 'Searching...', '');
  searchResults.innerHTML = '<div class="loading">Searching Last.fm...</div>';
  
  try {
    // Reset search results
    searchResultsData = { songs: [], albums: [], artists: [] };
    
    // Get tracks
    const tracks = await window.api.searchLastFm(query);
    searchResultsData.songs = tracks.map(track => ({
      id: track.mbid || generateId(),
      name: track.name,
      artist: track.artist,
      listeners: track.listeners,
      album: null,
      duration: null,
      image: track.image && track.image.length > 0 ? track.image[2]['#text'] : null
    }));
    
    // Get albums if query is not too specific
    if (query.split(' ').length < 3) {
      const albums = await window.api.searchLastFmAlbums(query);
      searchResultsData.albums = albums.map(album => ({
        id: album.mbid || generateId(),
        name: album.name,
        artist: album.artist,
        image: album.image && album.image.length > 0 ? album.image[2]['#text'] : null
      }));
    }
    
    // Get artists if query is not too specific
    if (query.split(' ').length < 3) {
      const artists = await window.api.searchLastFmArtists(query);
      searchResultsData.artists = artists.map(artist => ({
        id: artist.mbid || generateId(),
        name: artist.name,
        listeners: artist.listeners,
        image: artist.image && artist.image.length > 0 ? artist.image[2]['#text'] : null
      }));
    }
    
    // Display results based on current filter
    displaySearchResults();
    
    // Update status
    const totalResults = searchResultsData.songs.length + searchResultsData.albums.length + searchResultsData.artists.length;
    showStatus(searchStatus, `Found ${totalResults} results`, 'success');
  } catch (error) {
    searchResults.innerHTML = '';
    showStatus(searchStatus, `Error: ${error}`, 'error');
  }
}

// Display search results based on current filter
function displaySearchResults() {
  searchResults.innerHTML = '';
  
  const { songs, albums, artists } = searchResultsData;
  
  // Create sections for each type of result
  const songsSection = document.createElement('div');
  songsSection.className = 'results-section songs-section';
  
  const albumsSection = document.createElement('div');
  albumsSection.className = 'results-section albums-section';
  
  const artistsSection = document.createElement('div');
  artistsSection.className = 'results-section artists-section';
  
  // Add headers
  if (songs.length > 0 && (currentFilter === 'all' || currentFilter === 'songs')) {
    songsSection.innerHTML = `<h3>Songs</h3>`;
    const songsList = document.createElement('div');
    songsList.className = 'song-list';
    
    // Add songs
    songs.forEach(song => {
      songsList.appendChild(createSongItem(song, false, 'search'));
    });
    
    songsSection.appendChild(songsList);
    searchResults.appendChild(songsSection);
  }
  
  if (albums.length > 0 && (currentFilter === 'all' || currentFilter === 'albums')) {
    albumsSection.innerHTML = `<h3>Albums</h3>`;
    const albumsGrid = document.createElement('div');
    albumsGrid.className = 'albums-grid';
    
    // Add albums
    albums.forEach(album => {
      albumsGrid.appendChild(createAlbumCard(album));
    });
    
    albumsSection.appendChild(albumsGrid);
    searchResults.appendChild(albumsSection);
  }
  
  if (artists.length > 0 && (currentFilter === 'all' || currentFilter === 'artists')) {
    artistsSection.innerHTML = `<h3>Artists</h3>`;
    const artistsGrid = document.createElement('div');
    artistsGrid.className = 'artists-grid';
    
    // Add artists
    artists.forEach(artist => {
      artistsGrid.appendChild(createArtistCard(artist));
    });
    
    artistsSection.appendChild(artistsGrid);
    searchResults.appendChild(artistsSection);
  }
  
  // Show empty message if no results
  if (searchResults.innerHTML === '') {
    searchResults.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No results found</p>
      </div>
    `;
  }
}

// Create song item
function createSongItem(song, includeAlbum = false, context = 'search') {
  const songItem = document.createElement('div');
  songItem.className = 'song-item';
  songItem.dataset.id = song.id;
  songItem.dataset.context = context;
  
  const duration = song.duration ? formatTime(song.duration) : '--:--';
  
  let html = `
    <div class="song-number">${song.number || '-'}</div>
    <div class="song-info">
      <div class="song-title">${song.name}</div>
      <div class="song-artist">${song.artist}</div>
    </div>
  `;
  
  if (includeAlbum && song.album) {
    html += `<div class="song-album">${song.album}</div>`;
  } else if (includeAlbum) {
    html += `<div class="song-album">-</div>`;
  }
  
  html += `
    <div class="song-duration">${duration}</div>
    <div class="song-actions">
      <button class="song-play-btn" data-id="${song.id}"><i class="fas fa-play"></i></button>
      <button class="song-download-btn" data-id="${song.id}"><i class="fas fa-download"></i></button>
    </div>
  `;
  
  songItem.innerHTML = html;
  
  // Add event listeners
  songItem.querySelector('.song-play-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    playSong(song, context);
  });
  
  songItem.querySelector('.song-download-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    downloadSong(song);
  });
  
  return songItem;
}

// Create album card
function createAlbumCard(album) {
  const albumCard = document.createElement('div');
  albumCard.className = 'album-card';
  albumCard.dataset.id = album.id;
  
  albumCard.innerHTML = `
    <img src="${album.image || '/api/placeholder/180/180'}" alt="${album.name}" class="album-image">
    <div class="album-info">
      <div class="album-title">${album.name}</div>
      <div class="album-artist">${album.artist}</div>
    </div>
  `;
  
  // Add event listener
  albumCard.addEventListener('click', () => {
    loadAlbumView(album);
  });
  
  return albumCard;
}

// Create artist card
function createArtistCard(artist, isFavorite = false) {
  const artistCard = document.createElement('div');
  artistCard.className = 'artist-card';
  artistCard.dataset.id = artist.id;
  
  artistCard.innerHTML = `
    <img src="${artist.image || '/api/placeholder/180/180'}" alt="${artist.name}" class="artist-image">
    <div class="artist-info">
      <div class="artist-name">${artist.name}</div>
      ${isFavorite ? `<button class="heart-btn active" data-id="${artist.id}"><i class="fas fa-heart"></i></button>` : ''}
    </div>
  `;
  
  // Add event listener
  artistCard.addEventListener('click', () => {
    loadArtistView(artist);
  });
  
  // Add heart button event listener if favorite
  if (isFavorite) {
    artistCard.querySelector('.heart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavoriteArtist(artist);
    });
  }
  
  return artistCard;
}

// Load artist view
async function loadArtistView(artist) {
  // Store current artist
  currentArtist = artist;
  
  // Update UI elements
  artistName.textContent = artist.name;
  
  // Check if artist is in favorites
  const isFavorite = favoritesData.artists.some(a => a.id === artist.id);
  favoriteArtistBtn.innerHTML = isFavorite ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
  favoriteArtistBtn.classList.toggle('active', isFavorite);
  
  // Clear previous content
  artistSongsList.innerHTML = '<div class="loading">Loading songs...</div>';
  artistAlbumsGrid.innerHTML = '<div class="loading">Loading albums...</div>';
  
  try {
    // Get top tracks for artist
    const topTracks = await window.api.getArtistTopTracks(artist.name);
    
    // Get albums for artist
    const albums = await window.api.getArtistAlbums(artist.name);
    
    // Update songs list
    artistSongsList.innerHTML = '';
    topTracks.forEach((track, index) => {
      const song = {
        id: track.mbid || generateId(),
        name: track.name,
        artist: artist.name,
        number: index + 1,
        listeners: track.listeners,
        duration: track.duration,
        image: track.image && track.image.length > 0 ? track.image[2]['#text'] : null
      };
      
      artistSongsList.appendChild(createSongItem(song, false, 'artist'));
    });
    
    // Update albums grid
    artistAlbumsGrid.innerHTML = '';
    albums.forEach(album => {
      const albumData = {
        id: album.mbid || generateId(),
        name: album.name,
        artist: artist.name,
        image: album.image && album.image.length > 0 ? album.image[2]['#text'] : null,
        fromArtist: true
      };
      
      artistAlbumsGrid.appendChild(createAlbumCard(albumData));
    });
    
    // If no top tracks or albums
    if (topTracks.length === 0) {
      artistSongsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-music"></i>
          <p>No songs found for this artist</p>
        </div>
      `;
    }
    
    if (albums.length === 0) {
      artistAlbumsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-compact-disc"></i>
          <p>No albums found for this artist</p>
        </div>
      `;
    }
    
    // Switch to artist view section
    previousSection = currentActiveSection;
    switchSection('artist-view');
  } catch (error) {
    console.error('Error loading artist data:', error);
    artistSongsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error loading songs: ${error.message}</p>
      </div>
    `;
    
    artistAlbumsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error loading albums: ${error.message}</p>
      </div>
    `;
  }
}

// Load album view
async function loadAlbumView(album) {
  // Store current album
  currentAlbum = album;
  
  // Update UI elements
  albumTitle.textContent = album.name;
  albumArtist.textContent = album.artist;
  albumCoverImg.src = album.image || '/api/placeholder/200/200';
  
  // Clear previous content
  albumTracksList.innerHTML = '<div class="loading">Loading tracks...</div>';
  
  try {
    // Get album tracks
    const tracks = await window.api.getAlbumTracks(album.artist, album.name);
    
    // Update tracks list
    albumTracksList.innerHTML = '';
    tracks.forEach((track, index) => {
      const song = {
        id: track.mbid || generateId(),
        name: track.name,
        artist: album.artist,
        album: album.name,
        number: index + 1,
        duration: track.duration,
        image: album.image
      };
      
      albumTracksList.appendChild(createSongItem(song, false, 'album'));
    });
    
    // If no tracks
    if (tracks.length === 0) {
      albumTracksList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-music"></i>
          <p>No tracks found for this album</p>
        </div>
      `;
    }
    
    // Switch to album view section
    previousSection = currentActiveSection;
    switchSection('album-view');
  } catch (error) {
    console.error('Error loading album data:', error);
    albumTracksList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error loading tracks: ${error.message}</p>
      </div>
    `;
  }
}

// Download song
async function downloadSong(song) {
  if (!slskConnected) {
    alert('Please connect to Soulseek first');
    switchSection('settings');
    return;
  }
  
  try {
    // Add to downloads
    const downloadId = generateId();
    const download = {
      id: downloadId,
      songId: song.id,
      name: song.name,
      artist: song.artist,
      album: song.album,
      progress: 0,
      status: 'Searching...',
      image: song.image,
      startTime: Date.now()
    };
    
    downloads.push(download);
    updateDownloadsPanel();
    
    // If album is not known, try to get it
    let albumTitle = song.album;
    if (!albumTitle) {
      try {
        const trackInfo = await window.api.getTrackInfo({ artist: song.artist, track: song.name });
        albumTitle = trackInfo.album?.title || "Unknown Album";
        download.album = albumTitle;
        updateDownloadsPanel();
      } catch (error) {
        console.error('Error getting track info:', error);
      }
    }
    
    // Start download
    const result = await window.api.downloadSong({
      artist: song.artist,
      title: song.name,
      album: albumTitle || "Unknown Album",
      downloadId: downloadId,
      organize: organizeFilesCheckbox.checked,
      preferredFormat: preferredFormatSelect.value
    });
    
    // Update download status
    const index = downloads.findIndex(d => d.id === downloadId);
    if (index !== -1) {
      downloads[index].status = 'Completed';
      downloads[index].progress = 100;
      downloads[index].path = result.path;
      updateDownloadsPanel();
    }
    
    // Add to library
    addSongToLibrary({
      ...song,
      album: albumTitle || "Unknown Album",
      path: result.path,
      format: result.format || 'Unknown'
    });
    
  } catch (error) {
    console.error('Error downloading song:', error);
    
    // Update download status
    const index = downloads.findIndex(d => d.songId === song.id);
    if (index !== -1) {
      downloads[index].status = 'Failed';
      downloads[index].error = error.message;
      updateDownloadsPanel();
    }
  }
}

// Download progress update event
window.api.onDownloadProgress((data) => {
  const index = downloads.findIndex(d => d.id === data.downloadId);
  if (index !== -1) {
    downloads[index].progress = data.progress;
    downloads[index].status = data.status || downloads[index].status;
    updateDownloadsPanel();
  }
});

// Download album
downloadAlbumBtn.addEventListener('click', async () => {
  if (!currentAlbum) return;
  
  if (!slskConnected) {
    alert('Please connect to Soulseek first');
    switchSection('settings');
    return;
  }
  
  try {
    // Get album tracks if not already loaded
    const tracks = albumTracksList.querySelectorAll('.song-item');
    
    if (tracks.length === 0) {
      alert('No tracks found for this album');
      return;
    }
    
    // Start downloading each track
    Array.from(tracks).forEach(trackElement => {
      const trackId = trackElement.dataset.id;
      const trackName = trackElement.querySelector('.song-title').textContent;
      const trackArtist = trackElement.querySelector('.song-artist').textContent;
      
      const song = {
        id: trackId,
        name: trackName,
        artist: trackArtist,
        album: currentAlbum.name,
        image: currentAlbum.image
      };
      
      downloadSong(song);
    });
    
  } catch (error) {
    console.error('Error downloading album:', error);
    alert(`Error downloading album: ${error.message}`);
  }
});

// Toggle favorite artist
favoriteArtistBtn.addEventListener('click', () => {
  if (!currentArtist) return;
  toggleFavoriteArtist(currentArtist);
});

function toggleFavoriteArtist(artist) {
  const index = favoritesData.artists.findIndex(a => a.id === artist.id);
  
  if (index === -1) {
    // Add to favorites
    favoritesData.artists.push(artist);
    favoriteArtistBtn.innerHTML = '<i class="fas fa-heart"></i>';
    favoriteArtistBtn.classList.add('active');
  } else {
    // Remove from favorites
    favoritesData.artists.splice(index, 1);
    favoriteArtistBtn.innerHTML = '<i class="far fa-heart"></i>';
    favoriteArtistBtn.classList.remove('active');
  }
  
  // Save to localStorage
  saveFavoritesData();
  
  // Update UI if in favorites section
  if (currentActiveSection === 'favorites') {
    updateFavoritesUI();
  }
}

// Toggle favorite track
favoriteTrackBtn.addEventListener('click', () => {
  if (currentTrackIndex === -1 || !queue[currentTrackIndex]) return;
  
  const song = queue[currentTrackIndex];
  toggleFavoriteSong(song);
});

function toggleFavoriteSong(song) {
  const index = favoritesData.songs.findIndex(s => s.id === song.id);
  
  if (index === -1) {
    // Add to favorites
    favoritesData.songs.push(song);
    if (queue[currentTrackIndex] && queue[currentTrackIndex].id === song.id) {
      favoriteTrackBtn.innerHTML = '<i class="fas fa-heart"></i>';
      favoriteTrackBtn.classList.add('active');
    }
  } else {
    // Remove from favorites
    favoritesData.songs.splice(index, 1);
    if (queue[currentTrackIndex] && queue[currentTrackIndex].id === song.id) {
      favoriteTrackBtn.innerHTML = '<i class="far fa-heart"></i>';
      favoriteTrackBtn.classList.remove('active');
    }
  }
  
  // Save to localStorage
  saveFavoritesData();
  
  // Update UI if in library with saved songs tab
  if (currentActiveSection === 'library') {
    updateLibraryUI();
  }
}

// Add song to library
function addSongToLibrary(song) {
  // Check if song already exists in library
  const index = libraryData.songs.findIndex(s => s.id === song.id);
  
  if (index === -1) {
    // Add to library
    libraryData.songs.push(song);
    
    // Check if album exists in library
    if (song.album) {
      const albumIndex = libraryData.albums.findIndex(a => 
        a.name.toLowerCase() === song.album.toLowerCase() && 
        a.artist.toLowerCase() === song.artist.toLowerCase()
      );
      
      if (albumIndex === -1) {
        // Add album to library
        libraryData.albums.push({
          id: generateId(),
          name: song.album,
          artist: song.artist,
          image: song.image
        });
      }
    }
    
    // Check if artist exists in library
    const artistIndex = libraryData.artists.findIndex(a => 
      a.name.toLowerCase() === song.artist.toLowerCase()
    );
    
    if (artistIndex === -1) {
      // Add artist to library
      libraryData.artists.push({
        id: generateId(),
        name: song.artist,
        image: song.image
      });
    }
    
    // Save to localStorage
    saveLibraryData();
    
    // Update UI if in library section
    if (currentActiveSection === 'library') {
      updateLibraryUI();
    }
  }
}

// Update downloads panel
function updateDownloadsPanel() {
  // Clear container
  downloadsContainer.innerHTML = '';
  
  if (downloads.length === 0) {
    downloadsContainer.innerHTML = `
      <div class="empty-downloads">
        <p>No active downloads</p>
      </div>
    `;
    return;
  }
  
  // Add downloads in reverse order (newest first)
  [...downloads].reverse().forEach(download => {
    const downloadItem = document.createElement('div');
    downloadItem.className = 'download-item';
    downloadItem.dataset.id = download.id;
    
    const statusClass = download.status === 'Completed' ? 'success' :
                        download.status === 'Failed' ? 'error' : '';
    
    downloadItem.innerHTML = `
      <div class="download-info">
        <div class="download-title">${download.name}</div>
        <div class="download-artist">${download.artist}</div>
      </div>
      <div class="download-progress-container">
        <div class="download-progress" style="width: ${download.progress}%"></div>
      </div>
      <div class="download-status ${statusClass}">${download.status}</div>
    `;
    
    downloadsContainer.appendChild(downloadItem);
  });
}

// Show/hide downloads panel
minimizeDownloadsBtn.addEventListener('click', () => {
  downloadsPanel.classList.toggle('minimized');
  
  // Update icon
  if (downloadsPanel.classList.contains('minimized')) {
    minimizeDownloadsBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
  } else {
    minimizeDownloadsBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
  }
});

// Player controls
playPauseBtn.addEventListener('click', togglePlayPause);
prevTrackBtn.addEventListener('click', playPreviousTrack);
nextTrackBtn.addEventListener('click', playNextTrack);
volumeBtn.addEventListener('click', toggleMute);

// Play a song
// Update the playSong function
function playSong(song, context) {
    // If playing from a new context, create a new queue
    if (context !== currentContext) {
      // Get all songs from the current context
      let songs = [];
      
      if (context === 'search') {
        songs = searchResultsData.songs;
      } else if (context === 'album') {
        // Get all songs from the album view
        const songElements = albumTracksList.querySelectorAll('.song-item');
        songs = Array.from(songElements).map(el => {
          const id = el.dataset.id;
          const name = el.querySelector('.song-title').textContent;
          const artist = el.querySelector('.song-artist').textContent;
          const number = el.querySelector('.song-number').textContent;
          
          return {
            id,
            name,
            artist,
            number,
            album: currentAlbum.name,
            image: currentAlbum.image,
            path: libraryData.songs.find(s => s.id === id)?.path // Get path from library if available
          };
        });
      } else if (context === 'artist') {
        // Get all songs from the artist view
        const songElements = artistSongsList.querySelectorAll('.song-item');
        songs = Array.from(songElements).map(el => {
          const id = el.dataset.id;
          const name = el.querySelector('.song-title').textContent;
          const artist = el.querySelector('.song-artist').textContent;
          const number = el.querySelector('.song-number').textContent;
          
          return {
            id,
            name,
            artist,
            number,
            image: currentArtist.image,
            path: libraryData.songs.find(s => s.id === id)?.path // Get path from library if available
          };
        });
      } else if (context === 'library') {
        songs = libraryData.songs;
      }
      
      // Set the queue and context
      queue = [...songs];
      currentContext = context;
    }
    
    // Find the index of the song in the queue
    const songIndex = queue.findIndex(s => s.id === song.id);
    
    if (songIndex === -1) {
      console.error('Song not found in queue');
      return;
    }
    
    currentTrackIndex = songIndex;
    
    // Stop current audio if exists
    if (audio) {
      audio.pause();
      audio = null;
    }
    
    // Get the current song
    const currentSong = queue[currentTrackIndex];
    
    // Update player UI first to show something is happening
    updatePlayerUI();
    
    // Check if the song file exists
    if (currentSong.path) {
      console.log('Playing local file:', currentSong.path);
      // Request playing the local file through the main process
      window.api.playLocalFile(currentSong.path)
        .then(audioPath => {
          // Create audio element with the proper file URL
          audio = new Audio(audioPath);
          startPlayback();
        })
        .catch(error => {
          console.error('Error playing local file:', error);
          showNotification(`Error playing file: ${error.message}`, 'error');
        });
    } else {
      // Need to download the song first
      showNotification('This song needs to be downloaded before it can be played', 'info');
      downloadSong(currentSong);
    }
}
  
  // Also add this function to show notifications to the user
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification';
      document.body.appendChild(notification);
    }
    
    // Set content and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show the notification
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
}

// Start audio playback
function startPlayback() {
  if (!audio) return;
  
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });
  
  audio.addEventListener('timeupdate', () => {
    currentTimeEl.textContent = formatTime(audio.currentTime);
    const progress = (audio.currentTime / audio.duration) * 100;
    trackProgress.style.width = `${progress}%`;
  });
  
  audio.addEventListener('ended', () => {
    playNextTrack();
  });
  
  audio.play()
    .then(() => {
      isPlaying = true;
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      playPauseBtn.classList.add('playing');
    })
    .catch(error => {
      console.error('Playback error:', error);
      isPlaying = false;
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      playPauseBtn.classList.remove('playing');
    });
}

// Toggle play/pause
function togglePlayPause() {
  if (!audio) return;
  
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playPauseBtn.classList.remove('playing');
  } else {
    audio.play();
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    playPauseBtn.classList.add('playing');
  }
}

// Play previous track
function playPreviousTrack() {
  if (queue.length === 0) return;
  
  // If current time is more than 3 seconds, restart current track
  if (audio && audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  
  currentTrackIndex--;
  if (currentTrackIndex < 0) {
    currentTrackIndex = queue.length - 1;
  }
  
  playSong(queue[currentTrackIndex], currentContext);
}

// Play next track
function playNextTrack() {
  if (queue.length === 0) return;
  
  currentTrackIndex++;
  if (currentTrackIndex >= queue.length) {
    currentTrackIndex = 0;
  }
  
  playSong(queue[currentTrackIndex], currentContext);
}

// Update player UI
function updatePlayerUI() {
  if (currentTrackIndex === -1 || !queue[currentTrackIndex]) {
    currentTrackName.textContent = 'No track playing';
    currentTrackArtist.textContent = '';
    currentTrackImage.src = '/api/placeholder/60/60';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = '0:00';
    trackProgress.style.width = '0%';
    playPauseBtn.disabled = true;
    prevTrackBtn.disabled = true;
    nextTrackBtn.disabled = true;
    return;
  }
  
  const currentSong = queue[currentTrackIndex];
  
  currentTrackName.textContent = currentSong.name;
  currentTrackArtist.textContent = currentSong.artist;
  currentTrackImage.src = currentSong.image || '/api/placeholder/60/60';
  
  // Check if song is in favorites
  const isFavorite = favoritesData.songs.some(s => s.id === currentSong.id);
  favoriteTrackBtn.innerHTML = isFavorite ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
  favoriteTrackBtn.classList.toggle('active', isFavorite);
  
  playPauseBtn.disabled = false;
  prevTrackBtn.disabled = false;
  nextTrackBtn.disabled = false;
}

// Toggle mute
function toggleMute() {
  if (!audio) return;
  
  audio.muted = !audio.muted;
  
  if (audio.muted) {
    volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    volumeProgress.style.width = '0%';
  } else {
    volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    volumeProgress.style.width = `${audio.volume * 100}%`;
  }
}

// Update volume
function updateVolume(volume) {
  if (!audio) return;
  
  volume = Math.max(0, Math.min(1, volume));
  audio.volume = volume;
  
  volumeProgress.style.width = `${volume * 100}%`;
  
  if (volume === 0) {
    volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else if (volume < 0.5) {
    volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
  } else {
    volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
}

// Volume slider drag functionality
const volumeSlider = document.querySelector('.volume-slider');
volumeSlider.addEventListener('click', (e) => {
  const rect = volumeSlider.getBoundingClientRect();
  const volume = (e.clientX - rect.left) / rect.width;
  updateVolume(volume);
});

// Progress bar functionality
const progressBar = document.querySelector('.progress-bar');
progressBar.addEventListener('click', (e) => {
  if (!audio) return;
  
  const rect = progressBar.getBoundingClientRect();
  const clickPosition = (e.clientX - rect.left) / rect.width;
  const newTime = clickPosition * audio.duration;
  
  audio.currentTime = newTime;
});

// Update library UI
function updateLibraryUI() {
  // Update saved songs
  savedSongsList.innerHTML = '';
  
  if (libraryData.songs.length === 0) {
    savedSongsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-music"></i>
        <p>Your saved songs will appear here</p>
      </div>
    `;
  } else {
    libraryData.songs.forEach((song, index) => {
      savedSongsList.appendChild(createSongItem(
        { ...song, number: index + 1 },
        true,
        'library'
      ));
    });
  }
  
  // Update albums grid
  albumsGrid.innerHTML = '';
  
  if (libraryData.albums.length === 0) {
    albumsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-compact-disc"></i>
        <p>Your albums will appear here</p>
      </div>
    `;
  } else {
    libraryData.albums.forEach(album => {
      albumsGrid.appendChild(createAlbumCard(album));
    });
  }
  
  // Update artists grid
  artistsGrid.innerHTML = '';
  
  if (libraryData.artists.length === 0) {
    artistsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-music"></i>
        <p>Your favorite artists will appear here</p>
      </div>
    `;
  } else {
    libraryData.artists.forEach(artist => {
      artistsGrid.appendChild(createArtistCard(artist));
    });
  }
}

// Update favorites UI
function updateFavoritesUI() {
  favoriteArtistsGrid.innerHTML = '';
  
  if (favoritesData.artists.length === 0) {
    favoriteArtistsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-heart"></i>
        <p>Artists you've hearted will appear here</p>
      </div>
    `;
  } else {
    favoritesData.artists.forEach(artist => {
      favoriteArtistsGrid.appendChild(createArtistCard(artist, true));
    });
  }
}

// Load library data from localStorage
function loadLibraryData() {
  const savedData = localStorage.getItem('yarnball_library');
  
  if (savedData) {
    try {
      libraryData = JSON.parse(savedData);
    } catch (error) {
      console.error('Error parsing library data:', error);
      libraryData = { songs: [], albums: [], artists: [] };
    }
  } else {
    libraryData = { songs: [], albums: [], artists: [] };
  }
}

// Save library data to localStorage
function saveLibraryData() {
  localStorage.setItem('yarnball_library', JSON.stringify(libraryData));
}

// Load favorites data from localStorage
function loadFavoritesData() {
  const savedData = localStorage.getItem('yarnball_favorites');
  
  if (savedData) {
    try {
      favoritesData = JSON.parse(savedData);
    } catch (error) {
      console.error('Error parsing favorites data:', error);
      favoritesData = { artists: [], songs: [] };
    }
  } else {
    favoritesData = { artists: [], songs: [] };
  }
}

// Save favorites data to localStorage
function saveFavoritesData() {
  localStorage.setItem('yarnball_favorites', JSON.stringify(favoritesData));
}

// Logs modal
openLogsBtn.addEventListener('click', () => {
  logsModal.style.display = 'block';
  refreshLogs();
});

closeModal.addEventListener('click', () => {
  logsModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === logsModal) {
    logsModal.style.display = 'none';
  }
});

refreshLogsBtn.addEventListener('click', refreshLogs);

async function refreshLogs() {
  try {
    const logs = await window.api.getLogs();
    logsContent.textContent = logs;
    
    // Scroll to bottom
    logsContent.scrollTop = logsContent.scrollHeight;
  } catch (error) {
    logsContent.textContent = `Error loading logs: ${error}`;
  }
}

// Change download path
changePathBtn.addEventListener('click', async () => {
  try {
    const path = await window.api.selectDownloadPath();
    
    if (path) {
      downloadPathInput.value = path;
    }
  } catch (error) {
    console.error('Error changing download path:', error);
  }
});

// Helper functions
function formatTime(seconds) {
  if (!seconds) return '0:00';
  
  seconds = Math.floor(seconds);
  const minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function showStatus(element, message, className) {
  element.textContent = message;
  element.className = className;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}