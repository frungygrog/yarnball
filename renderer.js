// renderer.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const lastfmResults = document.getElementById('lastfm-results');
    const soulseekResults = document.getElementById('soulseek-results');
    const soulseekSection = document.querySelector('.soulseek-results');
    const soulseekLoading = document.getElementById('soulseek-loading');
    const libraryList = document.getElementById('library-list');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Player elements
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const volumeControl = document.getElementById('volume-control');
    const trackTitleEl = document.getElementById('track-title');
    const trackArtistEl = document.getElementById('track-artist');
    
    // Settings elements
    const settingsForm = document.getElementById('settings-form');
    const downloadPathEl = document.getElementById('download-path');
    const browseBtn = document.getElementById('browse-btn');
    const lastfmApiKeyEl = document.getElementById('lastfm-api-key');
    const soulseekUsernameEl = document.getElementById('soulseek-username');
    const soulseekPasswordEl = document.getElementById('soulseek-password');
    
    // Audio player implementation in renderer process
    class MusicPlayer {
      constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTrack = null;
        this.playlist = [];
        this.volume = 0.7; // Default volume (0-1)
        
        // Set up event listeners
        this.audio.addEventListener('ended', () => {
          if (this.onTrackEnded) this.onTrackEnded();
        });
        
        this.audio.addEventListener('timeupdate', () => {
          if (this.onTimeUpdate) this.onTimeUpdate(this.audio.currentTime, this.audio.duration);
        });
        
        this.audio.addEventListener('loadedmetadata', () => {
          if (this.onTrackLoaded) this.onTrackLoaded(this.audio.duration);
        });
        
        // Set initial volume
        this.audio.volume = this.volume;
      }
      
      setTrack(track) {
        this.currentTrack = track;
        this.audio.src = `file://${track.filePath}`;
        this.isPlaying = false;
      }
      
      play() {
        if (!this.currentTrack) return false;
        
        this.audio.play();
        this.isPlaying = true;
        return true;
      }
      
      pause() {
        this.audio.pause();
        this.isPlaying = false;
      }
      
      togglePlay() {
        if (this.isPlaying) {
          this.pause();
        } else {
          this.play();
        }
        return this.isPlaying;
      }
      
      stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
      }
      
      seek(time) {
        if (time >= 0 && time <= this.audio.duration) {
          this.audio.currentTime = time;
        }
      }
      
      setVolume(volume) {
        // Ensure volume is between 0 and 1
        const newVolume = Math.max(0, Math.min(1, volume));
        this.volume = newVolume;
        this.audio.volume = newVolume;
        return newVolume;
      }
      
      getCurrentTime() {
        return this.audio.currentTime;
      }
      
      getDuration() {
        return this.audio.duration;
      }
      
      createPlaylistFromTracks(tracks, currentTrackIndex = 0) {
        if (!tracks || !tracks.length) return;
        
        this.playlist = [...tracks];
        
        // If current track is specified, move it to the front
        if (currentTrackIndex > 0 && currentTrackIndex < tracks.length) {
          this.playlist = [
            ...tracks.slice(currentTrackIndex),
            ...tracks.slice(0, currentTrackIndex)
          ];
        }
      }
      
      playNext() {
        if (this.playlist.length <= 1) return null;
        
        // Remove the current track from the front of the playlist
        this.playlist.shift();
        
        // Play the next track if available
        if (this.playlist.length > 0) {
          const nextTrack = this.playlist[0];
          this.setTrack(nextTrack);
          this.play();
          return nextTrack;
        }
        
        return null;
      }
      
      playPrevious() {
        // If we're more than 3 seconds into the song, restart it instead of going to previous
        if (this.audio.currentTime > 3) {
          this.audio.currentTime = 0;
          return this.currentTrack;
        }
        
        // If we have a playlist with more than one track
        if (this.playlist.length > 1) {
          // Move the last track to the front
          const lastTrack = this.playlist.pop();
          this.playlist.unshift(lastTrack);
          
          // Move current track to the end
          const currentTrack = this.playlist.shift();
          this.playlist.push(currentTrack);
          
          // Play the "new" first track (previously the last)
          this.setTrack(this.playlist[0]);
          this.play();
          return this.playlist[0];
        }
        
        return null;
      }
      
      setOnTrackEnded(callback) {
        this.onTrackEnded = callback;
      }
      
      setOnTimeUpdate(callback) {
        this.onTimeUpdate = callback;
      }
      
      setOnTrackLoaded(callback) {
        this.onTrackLoaded = callback;
      }
    }
    
    // Initialize music player
    const player = new MusicPlayer();
    
    // App state
    let libraryTracks = [];
    
    // Initialize
    loadLibrary();
    loadSettings();
    initializePlayer();
    
    // Event listeners for tabs
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show active tab content
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
          }
        });
        
        // Refresh library when switching to library tab
        if (tabId === 'library') {
          loadLibrary();
        }
      });
    });
    
    // Search Last.fm
    searchBtn.addEventListener('click', searchLastFm);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchLastFm();
    });
    
    // Audio player controls
    playBtn.addEventListener('click', () => {
      const isPlaying = player.togglePlay();
      playBtn.textContent = isPlaying ? '⏸' : '▶';
    });
    
    prevBtn.addEventListener('click', () => {
      const track = player.playPrevious();
      if (track) updatePlayerUI(track);
    });
    
    nextBtn.addEventListener('click', () => {
      const track = player.playNext();
      if (track) updatePlayerUI(track);
    });
    
    progressBar.addEventListener('input', () => {
      player.seek(parseFloat(progressBar.value));
    });
    
    volumeControl.addEventListener('input', () => {
      player.setVolume(volumeControl.value / 100);
    });
    
    // Settings
    browseBtn.addEventListener('click', async () => {
      const path = await window.api.setDownloadPath();
      downloadPathEl.value = path;
    });
    
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const settings = {
        downloadPath: downloadPathEl.value,
        lastfmApiKey: lastfmApiKeyEl.value,
        soulseekUsername: soulseekUsernameEl.value,
        soulseekPassword: soulseekPasswordEl.value
      };
      
      await window.api.saveSettings(settings);
      alert('Settings saved successfully!');
    });
    
    // Soulseek status
    window.api.onSoulseekStatus((status, error) => {
      if (status === 'connected') {
        console.log('Connected to Soulseek');
      } else if (status === 'error') {
        console.error('Soulseek error:', error);
        alert(`Failed to connect to Soulseek: ${error}`);
      }
    });
    
    // Initialize player
    function initializePlayer() {
      // Set initial volume from UI
      player.setVolume(volumeControl.value / 100);
      
      // Set event handlers
      player.setOnTrackEnded(() => {
        const track = player.playNext();
        if (track) updatePlayerUI(track);
      });
      
      player.setOnTimeUpdate((currentTime, duration) => {
        progressBar.value = currentTime;
        currentTimeEl.textContent = formatTime(currentTime);
      });
      
      player.setOnTrackLoaded((duration) => {
        durationEl.textContent = formatTime(duration);
        progressBar.max = duration;
      });
    }
    
    // Update player UI
    function updatePlayerUI(track) {
      playBtn.textContent = '⏸';
      trackTitleEl.textContent = track.title;
      trackArtistEl.textContent = track.artist;
    }
    
    // Functions
    async function searchLastFm() {
      const query = searchInput.value.trim();
      if (!query) return;
      
      try {
        lastfmResults.innerHTML = '<li>Searching...</li>';
        soulseekSection.style.display = 'none';
        
        const results = await window.api.searchLastFm(query);
        
        if (results.length === 0) {
          lastfmResults.innerHTML = '<li>No results found</li>';
          return;
        }
        
        lastfmResults.innerHTML = '';
        results.forEach(track => {
          const li = document.createElement('li');
          li.textContent = `${track.name} - ${track.artist}`;
          li.addEventListener('click', () => {
            searchSoulseek(track);
          });
          lastfmResults.appendChild(li);
        });
      } catch (error) {
        console.error('Error searching Last.fm:', error);
        lastfmResults.innerHTML = `<li>Error: ${error.message}</li>`;
      }
    }
    
    async function searchSoulseek(track) {
      try {
        soulseekSection.style.display = 'block';
        soulseekResults.innerHTML = '';
        soulseekLoading.style.display = 'block';
        
        const params = {
          artist: track.artist,
          track: track.name,
          album: track.album || ''
        };
        
        const results = await window.api.searchSoulseek(params);
        
        soulseekLoading.style.display = 'none';
        
        if (results.length === 0) {
          soulseekResults.innerHTML = '<li>No results found</li>';
          return;
        }
        
        soulseekResults.innerHTML = '';
        results.forEach(result => {
          const li = document.createElement('li');
          const filename = result.file.split('\\').pop().split('/').pop();
          const size = formatFileSize(result.size);
          
          li.innerHTML = `
            <div>${filename}</div>
            <div style="color: #999; font-size: 12px;">
              Size: ${size} | User: ${result.username} | Score: ${result.score}/8
            </div>
          `;
          
          li.addEventListener('click', () => {
            downloadTrack(result, track);
          });
          
          soulseekResults.appendChild(li);
        });
      } catch (error) {
        console.error('Error searching Soulseek:', error);
        soulseekLoading.style.display = 'none';
        soulseekResults.innerHTML = `<li>Error: ${error.message}</li>`;
      }
    }
    
    async function downloadTrack(result, trackInfo) {
      try {
        soulseekResults.innerHTML = '<li>Downloading...</li>';
        
        const downloadResult = await window.api.downloadTrack({
          username: result.username,
          file: result.file,
          size: result.size
        });
        
        if (downloadResult.success) {
          // Add to library
          const track = {
            title: trackInfo.name,
            artist: trackInfo.artist,
            filePath: downloadResult.filePath,
            addedAt: new Date().toISOString()
          };
          
          addToLibrary(track);
          
          // Play the track
          playTrack(track);
          
          // Show success message
          if (downloadResult.alreadyExists) {
            soulseekResults.innerHTML = '<li>Track already downloaded. Playing now.</li>';
          } else {
            soulseekResults.innerHTML = '<li>Download complete! Playing now.</li>';
          }
        }
      } catch (error) {
        console.error('Error downloading track:', error);
        soulseekResults.innerHTML = `<li>Download error: ${error.message}</li>`;
      }
    }
    
    function addToLibrary(track) {
      // Check if track already exists in library
      const exists = libraryTracks.some(t => t.filePath === track.filePath);
      if (!exists) {
        libraryTracks.push(track);
        saveLibrary();
      }
    }
    
    function saveLibrary() {
      localStorage.setItem('libraryTracks', JSON.stringify(libraryTracks));
    }
    
    function loadLibrary() {
      const savedLibrary = localStorage.getItem('libraryTracks');
      if (savedLibrary) {
        libraryTracks = JSON.parse(savedLibrary);
        renderLibrary();
      }
    }
    
    function renderLibrary() {
      if (libraryTracks.length === 0) {
        libraryList.innerHTML = '<li>No tracks in your library</li>';
        return;
      }
      
      libraryList.innerHTML = '';
      libraryTracks.forEach(track => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div>${track.title}</div>
          <div style="color: #999; font-size: 12px;">${track.artist}</div>
        `;
        
        li.addEventListener('click', () => {
          playTrack(track);
        });
        
        libraryList.appendChild(li);
      });
    }
    
    function playTrack(track) {
      // Set the track
      player.setTrack(track);
      
      // Play it
      player.play();
      
      // Update UI
      updatePlayerUI(track);
      
      // Create playlist from library
      const index = libraryTracks.findIndex(t => t.filePath === track.filePath);
      if (index !== -1) {
        player.createPlaylistFromTracks(libraryTracks, index);
      } else {
        // If not in library yet (e.g. just downloaded)
        player.createPlaylistFromTracks([track, ...libraryTracks]);
      }
    }
    
    async function loadSettings() {
      const settings = await window.api.getSettings();
      
      downloadPathEl.value = settings.downloadPath || '';
      lastfmApiKeyEl.value = settings.lastfmApiKey || '';
      soulseekUsernameEl.value = settings.soulseekUsername || '';
      soulseekPasswordEl.value = settings.soulseekPassword || '';
    }
    
    // Helper functions
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function formatFileSize(bytes) {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  });