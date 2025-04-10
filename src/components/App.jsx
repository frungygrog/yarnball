import React, { useState, useEffect } from 'react';
import { Search, Music, Heart, Settings } from 'lucide-react';

// Import components
import Sidebar from './layout/Sidebar';
import SearchSection from './sections/SearchSection';
import LibrarySection from './sections/LibrarySection';
import FavoritesSection from './sections/FavoritesSection';
import SettingsSection from './sections/SettingsSection';
import ArtistViewSection from './sections/ArtistViewSection';
import AlbumViewSection from './sections/AlbumViewSection';
import PlayerBar from './player/PlayerBar';
import DownloadsPanel from './downloads/DownloadsPanel';
import LogsModal from './modals/LogsModal';
import Notification from './common/Notification';
import { generateId } from '../lib/utils';

const App = () => {
  // State variables
  const [activeSection, setActiveSection] = useState('search');
  const [previousSection, setPreviousSection] = useState('');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [currentArtist, setCurrentArtist] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [currentContext, setCurrentContext] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [libraryData, setLibraryData] = useState({ songs: [], albums: [], artists: [] });
  const [favoritesData, setFavoritesData] = useState({ artists: [], songs: [] });
  const [downloads, setDownloads] = useState([]);
  const [slskConnected, setSlskConnected] = useState(false);
  const [lastfmInitialized, setLastfmInitialized] = useState(false);
  const [searchResultsData, setSearchResultsData] = useState({ songs: [], albums: [], artists: [] });
  const [organizeFiles, setOrganizeFiles] = useState(true);
  const [preferredFormat, setPreferredFormat] = useState('any');
  const [downloadPath, setDownloadPath] = useState('');

  // Navigation items
  const navItems = [
    { id: 'search', icon: <Search size={18} />, label: 'search' },
    { id: 'library', icon: <Music size={18} />, label: 'library' },
    { id: 'favorites', icon: <Heart size={18} />, label: 'favorites' },
    { id: 'settings', icon: <Settings size={18} />, label: 'settings' }
  ];

  // Load data from localStorage on component mount
  useEffect(() => {
    initApp();

    // Setup event listeners
    const downloadProgressHandler = (data) => {
      updateDownloadProgress(data);
    };

    const albumDownloadProgressHandler = (data) => {
      updateDownloadProgress(data); // Reuse the same function for album downloads
    };

    const addSongToLibraryHandler = (song) => {
      addSongToLibrary(song);
    };

    // Set up event listeners
    const unsubscribeDownloadProgress = window.api.onDownloadProgress(downloadProgressHandler);
    const unsubscribeAlbumDownloadProgress = window.api.onAlbumDownloadProgress(albumDownloadProgressHandler);
    const unsubscribeAddSongToLibrary = window.api.addSongToLibrary(addSongToLibraryHandler);

    return () => {
      // Clean up event listeners
      unsubscribeDownloadProgress();
      unsubscribeAlbumDownloadProgress();
      unsubscribeAddSongToLibrary();
      
      // Clean up audio
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  // Force refresh of library data on mount
  useEffect(() => {
    // Force refresh of library data
    const savedData = localStorage.getItem('yarnball_library');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log("Manually loaded library data:", parsedData);
        
        // Force update the library data state
        setLibraryData({
          songs: Array.isArray(parsedData.songs) ? parsedData.songs : [],
          albums: Array.isArray(parsedData.albums) ? parsedData.albums : [],
          artists: Array.isArray(parsedData.artists) ? parsedData.artists : []
        });
      } catch (error) {
        console.error("Error parsing library data:", error);
      }
    }
  }, []);

  // Debug logging for library data changes
  useEffect(() => {
    // Log the current library data when it changes
    console.log("Current library data:", libraryData);
  }, [libraryData]);

  // Initialize the app
  const initApp = async () => {
    loadLibraryData();
    loadFavoritesData();
    
    // Get download path
    try {
      const path = await window.api.getDownloadPath();
      setDownloadPath(path);
    } catch (error) {
      console.error('Error getting download path:', error);
    }
    
    // Check for saved Soulseek credentials
    const savedUsername = localStorage.getItem('slsk_username');
    const savedPassword = localStorage.getItem('slsk_password');
    
    if (savedUsername && savedPassword) {
      // Auto-connect if credentials exist
      connectToSoulseek(savedUsername, savedPassword);
    }
    
    // Check for saved Last.fm API key
    const savedApiKey = localStorage.getItem('lastfm_api_key');
    
    if (savedApiKey) {
      // Auto-initialize Last.fm API if key exists
      initializeLastFm(savedApiKey);
    }

    // Load settings
    const savedOrganizeFiles = localStorage.getItem('yarnball_organize_files');
    if (savedOrganizeFiles !== null) {
      setOrganizeFiles(savedOrganizeFiles === 'true');
    }

    const savedFormat = localStorage.getItem('yarnball_preferred_format');
    if (savedFormat) {
      setPreferredFormat(savedFormat);
    }
  };

  // Switch between sections
  const switchSection = (sectionName) => {
    setPreviousSection(activeSection);
    setActiveSection(sectionName);
    console.log(`Switched to section: ${sectionName}`);
  };

  // Connect to Soulseek
  const connectToSoulseek = async (username, password) => {
    try {
      const result = await window.api.connect({ username, password });
      showNotification(result, 'success');
      
      // Save credentials to localStorage
      localStorage.setItem('slsk_username', username);
      localStorage.setItem('slsk_password', password);
      
      setSlskConnected(true);
      return true;
    } catch (error) {
      showNotification(`Error: ${error}`, 'error');
      setSlskConnected(false);
      return false;
    }
  };

  // Initialize Last.fm API
  const initializeLastFm = async (apiKey) => {
    try {
      const result = await window.api.initLastFm(apiKey);
      showNotification(result, 'success');
      
      // Save API key to localStorage
      localStorage.setItem('lastfm_api_key', apiKey);
      
      setLastfmInitialized(true);
      return true;
    } catch (error) {
      showNotification(`Error: ${error}`, 'error');
      setLastfmInitialized(false);
      return false;
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  // Load artist view
  const loadArtistView = async (artist) => {
    setCurrentArtist(artist);
    switchSection('artist-view');
  };

  // Load album view
  const loadAlbumView = async (album) => {
    setCurrentAlbum(album);
    switchSection('album-view');
  };

  // Play a song
  const playSong = async (song, context) => {
    console.log(`Playing song: ${song.name} by ${song.artist} in context: ${context}`);
    
    // If playing from a new context, create a new queue
    if (context !== currentContext) {
      // Get all songs from the current context
      let songs = [];
      
      if (context === 'search') {
        songs = searchResultsData.songs;
      } else if (context === 'album') {
        // For albums, get songs from current album
        try {
          const tracks = await window.api.getAlbumTracks(song.artist, currentAlbum.name);
          songs = tracks.map((track, index) => ({
            id: track.mbid || generateId(),
            name: track.name,
            artist: song.artist,
            album: currentAlbum.name,
            number: index + 1,
            duration: track.duration,
            image: currentAlbum.image,
            path: libraryData.songs.find(s => 
              s.name.toLowerCase() === track.name.toLowerCase() && 
              s.artist.toLowerCase() === song.artist.toLowerCase()
            )?.path // Get path from library if available
          }));
        } catch(error) {
          console.error("Error loading album tracks:", error);
          songs = [song];
        }
      } else if (context === 'artist') {
        // For artists, use current artist's top songs
        try {
          const tracks = await window.api.getArtistTopTracks(song.artist);
          songs = tracks.map((track, index) => ({
            id: track.mbid || generateId(),
            name: track.name,
            artist: song.artist,
            number: index + 1,
            duration: track.duration,
            image: currentArtist?.image,
            path: libraryData.songs.find(s => 
              s.name.toLowerCase() === track.name.toLowerCase() && 
              s.artist.toLowerCase() === song.artist.toLowerCase()
            )?.path
          }));
        } catch(error) {
          console.error("Error loading artist tracks:", error);
          songs = [song];
        }
      } else if (context === 'library') {
        songs = libraryData.songs;
        console.log("Using library songs for queue:", songs);
      } else if (context === 'favorites') {
        songs = favoritesData.songs;
      }
      
      // Set the queue and context
      console.log(`Setting queue with ${songs.length} songs from ${context} context`);
      setQueue([...songs]);
      setCurrentContext(context);
    }
    
    // Find the index of the song in the queue
    const songIndex = queue.findIndex(s => s.id === song.id);
    
    if (songIndex === -1) {
      // If song not found in queue, add it
      console.log("Song not found in queue, adding it");
      setQueue(prevQueue => [...prevQueue, song]);
      setCurrentTrackIndex(queue.length);
    } else {
      console.log(`Song found in queue at index ${songIndex}`);
      setCurrentTrackIndex(songIndex);
    }
    
    // Stop current audio if exists
    if (audio) {
      audio.pause();
      audio.src = '';
      setAudio(null);
    }
    
    // Create new audio element
    const newAudio = new Audio();
    
    // Update player UI first to show something is happening
    // Set up the audio once it's loaded
    if (song.path) {
      try {
        console.log(`Attempting to play file: ${song.path}`);
        // Request playing the local file through the main process
        const audioPath = await window.api.playLocalFile(song.path);
        
        // Create audio element with the proper file URL
        newAudio.src = audioPath;
        console.log(`Audio source set to: ${audioPath}`);
        
        // Set up event listeners
        newAudio.addEventListener('loadedmetadata', () => {
          console.log(`Audio metadata loaded, duration: ${newAudio.duration}`);
        });
        
        newAudio.addEventListener('timeupdate', () => {
          // Update progress
        });
        
        newAudio.addEventListener('ended', () => {
          console.log("Audio playback ended, playing next track");
          playNextTrack();
        });
        
        // Start playback
        await newAudio.play();
        console.log("Audio playback started");
        setIsPlaying(true);
        setAudio(newAudio);
      } catch (error) {
        console.error('Error playing local file:', error);
        showNotification(`Error playing file: ${error.message}`, 'error');
      }
    } else {
      // Need to download the song first
      console.log("Song needs to be downloaded before playing");
      showNotification('This song needs to be downloaded before it can be played', 'info');
      downloadSong(song);
    }
  };

  // Update download progress
  const updateDownloadProgress = (data) => {
    setDownloads(prev => {
      const newDownloads = [...prev];
      const index = newDownloads.findIndex(d => d.id === data.downloadId);
      
      if (index !== -1) {
        newDownloads[index] = {
          ...newDownloads[index],
          progress: data.progress,
          status: data.status || newDownloads[index].status,
          speed: data.speed || 0 // Add speed to download information
        };
      }
      
      return newDownloads;
    });
  };

  // Download a song
  const downloadSong = async (song) => {
    if (!slskConnected) {
      showNotification('Please connect to Soulseek first', 'error');
      switchSection('settings');
      return;
    }
    
    try {
      // Check if the song is already in the library
      const existingSong = libraryData.songs.find(s => 
        s.name.toLowerCase() === song.name.toLowerCase() && 
        s.artist.toLowerCase() === song.artist.toLowerCase()
      );
  
      if (existingSong) {
        showNotification(`"${song.name}" is already in your library`, 'info');
        return;
      }
      
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
        speed: 0, // Initialize with 0 speed
        image: song.image,
        startTime: Date.now()
      };
      
      setDownloads(prev => [...prev, download]);
      
      // If album is not known, try to get it
      let albumTitle = song.album;
      if (!albumTitle) {
        try {
          const trackInfo = await window.api.getTrackInfo({ 
            artist: song.artist, 
            track: song.name 
          });
          albumTitle = trackInfo.album?.title || "Unknown Album";
          // Update download with album info
          setDownloads(prev => prev.map(d => 
            d.id === downloadId ? { ...d, album: albumTitle } : d
          ));
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
        organize: organizeFiles,
        preferredFormat: preferredFormat
      });
      
      // Check if the file already existed (new property returned by main process)
      if (result.alreadyExists) {
        // Update download status
        setDownloads(prev => 
          prev.map(d => d.id === downloadId 
            ? { ...d, status: 'Already Exists', progress: 100, path: result.path, speed: 0 } 
            : d
          )
        );
        
        showNotification(`"${song.name}" already exists and has been added to your library`, 'info');
      } else {
        // Update download status for a new download
        setDownloads(prev => 
          prev.map(d => d.id === downloadId 
            ? { ...d, status: 'Completed', progress: 100, path: result.path, speed: 0 } 
            : d
          )
        );
        
        showNotification(`Downloaded: ${song.name} by ${song.artist}`, 'success');
      }
      
      // Add to library
      addSongToLibrary({
        ...song,
        album: albumTitle || "Unknown Album",
        path: result.path,
        format: result.format || 'Unknown'
      });
      
      return result;
    } catch (error) {
      console.error('Error downloading song:', error);
      
      // Update download status
      setDownloads(prev => 
        prev.map(d => d.songId === song.id
          ? { ...d, status: 'Failed', error: error.message, speed: 0 }
          : d
        )
      );
      
      showNotification(`Download failed: ${error.message}`, 'error');
      throw error;
    }
  };

  // NEW: Download an entire album at once
  const downloadAlbum = async (album, tracks) => {
    if (!slskConnected) {
      showNotification('Please connect to Soulseek first', 'error');
      switchSection('settings');
      return;
    }
    
    try {
      // Add to downloads with a special album type
      const downloadId = generateId();
      const download = {
        id: downloadId,
        albumId: album.id,
        name: album.name,
        artist: album.artist,
        isAlbum: true,
        trackCount: tracks.length,
        progress: 0,
        status: 'Searching...',
        speed: 0, // Initialize with 0 speed
        image: album.image,
        startTime: Date.now()
      };
      
      setDownloads(prev => [...prev, download]);
      
      // Start download
      const result = await window.api.downloadAlbum({
        artist: album.artist,
        albumName: album.name,
        tracks: tracks,
        downloadId: downloadId,
        organize: true, // Always organize albums
        preferredFormat: preferredFormat
      });
      
      // Update download status
      setDownloads(prev => 
        prev.map(d => d.id === downloadId 
          ? { ...d, status: 'Completed', progress: 100, speed: 0 } 
          : d
        )
      );
      
      showNotification(`Downloaded album: ${album.name} by ${album.artist}`, 'success');
      
      return result;
    } catch (error) {
      console.error('Error downloading album:', error);
      
      // Update download status
      setDownloads(prev => 
        prev.map(d => d.albumId === album.id
          ? { ...d, status: 'Failed', error: error.message, speed: 0 }
          : d
        )
      );
      
      showNotification(`Album download failed: ${error.message}`, 'error');
      throw error;
    }
  };

  // Toggle favorite song
  const toggleFavoriteSong = async (song) => { // Make async to handle potential API call
    // Find the current index in favorites
    const currentIndex = favoritesData.songs.findIndex(s => s.id === song.id);

    if (currentIndex === -1) {
      // --- Add to favorites ---
      let songToAdd = { ...song }; // Start with the provided song data

      // Check if album info is missing or incomplete
      if (!songToAdd.album || songToAdd.album === 'Unknown Album') {
        console.log(`Album info missing for "${song.name}", attempting to fetch...`);
        try {
          // Fetch full track info from Last.fm via main process
          const trackInfo = await window.api.getTrackInfo({
            artist: song.artist,
            track: song.name
          });
          
          // Update songToAdd with fetched album info if available
          if (trackInfo?.album?.title) {
            songToAdd.album = trackInfo.album.title;
            // Optionally update image if available and missing
            if (!songToAdd.image && trackInfo.album.image && trackInfo.album.image.length > 0) {
               songToAdd.image = trackInfo.album.image[2]['#text']; // Assuming index 2 is medium size
            }
            console.log(`Fetched album info: "${songToAdd.album}"`);
          } else {
             console.warn(`Could not fetch album info for "${song.name}"`);
             // Keep 'Unknown Album' or whatever was originally there
             songToAdd.album = songToAdd.album || 'Unknown Album';
          }
        } catch (error) {
          console.error('Error fetching track info for favorites:', error);
          // Keep 'Unknown Album' on error
          songToAdd.album = songToAdd.album || 'Unknown Album';
        }
      }

      // Update state and localStorage with potentially enriched song data
      setFavoritesData(prev => {
        const newFavorites = {
          ...prev,
          songs: [...prev.songs, songToAdd] // Add the potentially enriched song
        };
        localStorage.setItem('yarnball_favorites', JSON.stringify(newFavorites));
        showNotification(`Added "${songToAdd.name}" to favorites`, 'success');
        return newFavorites;
      });

    } else {
      // --- Remove from favorites ---
      setFavoritesData(prev => {
        const newFavorites = {
          ...prev,
          songs: prev.songs.filter(s => s.id !== song.id)
        };
        localStorage.setItem('yarnball_favorites', JSON.stringify(newFavorites));
        showNotification(`Removed "${song.name}" from favorites`, 'info');
        return newFavorites;
      });
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  // Play previous track
  const playPreviousTrack = () => {
    if (queue.length === 0) return;
    
    // If current time is more than 3 seconds, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    
    let newIndex = currentTrackIndex - 1;
    if (newIndex < 0) {
      newIndex = queue.length - 1;
    }
    
    setCurrentTrackIndex(newIndex);
    playSong(queue[newIndex], currentContext);
  };

  // Play next track
  const playNextTrack = () => {
    if (queue.length === 0) return;
    
    let newIndex = currentTrackIndex + 1;
    if (newIndex >= queue.length) {
      newIndex = 0;
    }
    
    setCurrentTrackIndex(newIndex);
    playSong(queue[newIndex], currentContext);
  };

  // Load library data from localStorage
  const loadLibraryData = () => {
    console.log("Loading library data...");
    const savedData = localStorage.getItem('yarnball_library');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log("Library data loaded:", parsedData);
        
        // Make sure we have valid arrays
        const sanitizedData = {
          songs: Array.isArray(parsedData.songs) ? parsedData.songs : [],
          albums: Array.isArray(parsedData.albums) ? parsedData.albums : [],
          artists: Array.isArray(parsedData.artists) ? parsedData.artists : []
        };
        
        // Log the sanitized data
        console.log("Sanitized library data:", sanitizedData);
        
        setLibraryData(sanitizedData);
      } catch (error) {
        console.error('Error parsing library data:', error);
        setLibraryData({ songs: [], albums: [], artists: [] });
      }
    } else {
      console.log("No library data found in localStorage");
      setLibraryData({ songs: [], albums: [], artists: [] });
    }
  };

  // Save library data to localStorage
  const saveLibraryData = (data) => {
    console.log("Saving library data to localStorage:", data);
    localStorage.setItem('yarnball_library', JSON.stringify(data));
  };

  // Load favorites data from localStorage
  const loadFavoritesData = () => {
    const savedData = localStorage.getItem('yarnball_favorites');
    
    if (savedData) {
      try {
        setFavoritesData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing favorites data:', error);
        setFavoritesData({ artists: [], songs: [] });
      }
    }
  };

  // Update settings
  const updateSettings = (settings) => {
    if (settings.organizeFiles !== undefined) {
      setOrganizeFiles(settings.organizeFiles);
      localStorage.setItem('yarnball_organize_files', settings.organizeFiles);
    }
    
    if (settings.preferredFormat) {
      setPreferredFormat(settings.preferredFormat);
      localStorage.setItem('yarnball_preferred_format', settings.preferredFormat);
    }
  };

  // Add song to library
  const addSongToLibrary = (song) => {
    console.log("Adding song to library:", song);
    
    setLibraryData(prev => {
      // First check if we already have this exact song ID
      if (prev.songs.some(s => s.id === song.id)) {
        console.log("Song already exists in library (same ID), skipping");
        return prev;
      }
      
      // Next check if we already have a song with the same file path
      // This prevents file system duplicates
      if (song.path && prev.songs.some(s => s.path === song.path)) {
        return prev;
      }
      
      // If unique by both ID and path, add it to the library
      console.log("Song doesn't exist in library, adding it");
      
      // Create new library data with song added
      const newLibraryData = {
        songs: [...prev.songs, song],
        albums: [...prev.albums],
        artists: [...prev.artists]
      };
      
      // Check if album exists
      if (song.album && !newLibraryData.albums.some(a => 
        a.name.toLowerCase() === song.album.toLowerCase() && 
        a.artist.toLowerCase() === song.artist.toLowerCase()
      )) {
        console.log("Adding new album to library:", song.album);
        newLibraryData.albums.push({
          id: generateId(),
          name: song.album,
          artist: song.artist,
          image: song.image
        });
      }
      
      // Check if artist exists
      if (!newLibraryData.artists.some(a => 
        a.name.toLowerCase() === song.artist.toLowerCase()
      )) {
        console.log("Adding new artist to library:", song.artist);
        newLibraryData.artists.push({
          id: generateId(),
          name: song.artist,
          image: song.image
        });
      }
      
      // Save to localStorage
      console.log("Saving updated library data");
      saveLibraryData(newLibraryData);
      
      return newLibraryData;
    });
  };

  const toggleFavoriteArtist = (artist) => {
    setFavoritesData(prev => {
      const index = prev.artists.findIndex(a => a.id === artist.id);
      
      if (index === -1) {
        // Add to favorites
        const newFavorites = {
          ...prev,
          artists: [...prev.artists, artist]
        };
        // Save to localStorage
        localStorage.setItem('yarnball_favorites', JSON.stringify(newFavorites));
        return newFavorites;
      } else {
        // Remove from favorites
        const newFavorites = {
          ...prev,
          artists: prev.artists.filter(a => a.id !== artist.id)
        };
        // Save to localStorage
        localStorage.setItem('yarnball_favorites', JSON.stringify(newFavorites));
        return newFavorites;
      }
    });
  };

  return (
    <div className="app-container">
      <Sidebar 
        navItems={navItems} 
        activeSection={activeSection} 
        onNavItemClick={switchSection} 
      />
      
      <div className="main-content">
        {activeSection === 'search' && (
          <SearchSection
            setSearchResultsData={setSearchResultsData}
            searchResultsData={searchResultsData}
            loadArtistView={loadArtistView}
            loadAlbumView={loadAlbumView}
            playSong={playSong}
            downloadSong={downloadSong}
            lastfmInitialized={lastfmInitialized}
            switchSection={switchSection}
            showNotification={showNotification}
            activeSection={activeSection}
            libraryData={libraryData}
          />
        )}
        
        {activeSection === 'library' && (
          <LibrarySection
            libraryData={libraryData}
            loadAlbumView={loadAlbumView}
            loadArtistView={loadArtistView}
            playSong={playSong}
            downloadSong={downloadSong}
            activeSection={activeSection}
            setLibraryData={setLibraryData}
            showNotification={showNotification} 
          />
        )}
        
        {activeSection === 'favorites' && (
          <FavoritesSection
            favoritesData={favoritesData}
            toggleFavoriteArtist={toggleFavoriteArtist}
            toggleFavoriteSong={toggleFavoriteSong}
            loadArtistView={loadArtistView}
            playSong={playSong}
            libraryData={libraryData}
            loadAlbumView={loadAlbumView}
            activeSection={activeSection}
          />
        )}
        
        {activeSection === 'settings' && (
          <SettingsSection
            connectToSoulseek={connectToSoulseek}
            initializeLastFm={initializeLastFm}
            setShowLogsModal={setShowLogsModal}
            slskConnected={slskConnected}
            lastfmInitialized={lastfmInitialized}
            downloadPath={downloadPath}
            organizeFiles={organizeFiles}
            preferredFormat={preferredFormat}
            updateSettings={updateSettings}
            activeSection={activeSection}
          />
        )}
        
        {activeSection === 'artist-view' && (
          <ArtistViewSection
            artist={currentArtist}
            switchSection={switchSection}
            previousSection={previousSection}
            toggleFavoriteArtist={toggleFavoriteArtist}
            favoritesData={favoritesData}
            loadAlbumView={loadAlbumView}
            playSong={playSong}
            downloadSong={downloadSong}
            activeSection={activeSection}
          />
        )}
        
        {activeSection === 'album-view' && (
          <AlbumViewSection
            album={currentAlbum}
            switchSection={switchSection}
            previousSection={previousSection}
            playSong={playSong}
            downloadSong={downloadSong}
            downloadAlbum={downloadAlbum} // New prop for album downloads
            slskConnected={slskConnected}
            activeSection={activeSection}
            libraryData={libraryData}
          />
        )}
        
        <DownloadsPanel 
          downloads={downloads}
        />
      </div>
      
      <PlayerBar 
        currentTrackIndex={currentTrackIndex}
        queue={queue}
        isPlaying={isPlaying}
        toggleFavoriteSong={toggleFavoriteSong}
        favoritesData={favoritesData}
        onTogglePlayPause={togglePlayPause}
        onPrevTrack={playPreviousTrack}
        onNextTrack={playNextTrack}
        loadAlbumView={loadAlbumView}
        loadArtistView={loadArtistView}
        audio={audio}
      />
      
      {showLogsModal && (
        <LogsModal 
          onClose={() => setShowLogsModal(false)} 
        />
      )}
      
      <Notification 
        show={notification.show}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default App;