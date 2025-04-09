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

const App = () => {
  // State variables
  const [activeSection, setActiveSection] = useState('search');
  const [previousSection, setPreviousSection] = useState('');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [currentArtist, setCurrentArtist] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
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
    window.api.onDownloadProgress((data) => {
      updateDownloadProgress(data);
    });

    return () => {
      // Cleanup
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  // Initialize the app
  const initApp = async () => {
    loadLibraryData();
    loadFavoritesData();
    
    // Get download path
    try {
      const path = await window.api.getDownloadPath();
      // Set path in settings
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
  };

  // Switch between sections
  const switchSection = (sectionName) => {
    setPreviousSection(activeSection);
    setActiveSection(sectionName);
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
  const playSong = (song, context) => {
    // Implementation for playing songs
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
          status: data.status || newDownloads[index].status
        };
      }
      
      return newDownloads;
    });
  };

  // Download a song
  const downloadSong = async (song) => {
    // Implementation for downloading songs
  };

  // Toggle favorite artist
  const toggleFavoriteArtist = (artist) => {
    // Implementation for toggling favorite artists
  };

  // Toggle favorite song
  const toggleFavoriteSong = (song) => {
    // Implementation for toggling favorite songs
  };

  // Load library data from localStorage
  const loadLibraryData = () => {
    const savedData = localStorage.getItem('yarnball_library');
    
    if (savedData) {
      try {
        setLibraryData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing library data:', error);
        setLibraryData({ songs: [], albums: [], artists: [] });
      }
    }
  };

  // Save library data to localStorage
  const saveLibraryData = () => {
    localStorage.setItem('yarnball_library', JSON.stringify(libraryData));
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

  // Save favorites data to localStorage
  const saveFavoritesData = () => {
    localStorage.setItem('yarnball_favorites', JSON.stringify(favoritesData));
  };

  // Add song to library
  const addSongToLibrary = (song) => {
    setLibraryData(prev => {
      // Check if song already exists
      if (prev.songs.some(s => s.id === song.id)) {
        return prev;
      }
      
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
        newLibraryData.artists.push({
          id: generateId(),
          name: song.artist,
          image: song.image
        });
      }
      
      // Save to localStorage
      localStorage.setItem('yarnball_library', JSON.stringify(newLibraryData));
      
      return newLibraryData;
    });
  };

  // Helper function to generate ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
          />
        )}
        
        {activeSection === 'library' && (
          <LibrarySection 
            libraryData={libraryData}
            loadAlbumView={loadAlbumView}
            loadArtistView={loadArtistView}
            playSong={playSong}
            downloadSong={downloadSong}
          />
        )}
        
        {activeSection === 'favorites' && (
          <FavoritesSection 
            favoritesData={favoritesData}
            toggleFavoriteArtist={toggleFavoriteArtist}
            loadArtistView={loadArtistView}
          />
        )}
        
        {activeSection === 'settings' && (
          <SettingsSection 
            connectToSoulseek={connectToSoulseek}
            initializeLastFm={initializeLastFm}
            setShowLogsModal={setShowLogsModal}
            slskConnected={slskConnected}
            lastfmInitialized={lastfmInitialized}
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
          />
        )}
        
        {activeSection === 'album-view' && (
          <AlbumViewSection 
            album={currentAlbum}
            switchSection={switchSection}
            previousSection={previousSection}
            playSong={playSong}
            downloadSong={downloadSong}
            slskConnected={slskConnected}
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