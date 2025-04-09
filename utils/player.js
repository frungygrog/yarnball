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
    
    // Get current playback position in seconds
    getCurrentTime() {
      return this.audio.currentTime;
    }
    
    // Get total duration in seconds
    getDuration() {
      return this.audio.duration;
    }
    
    // Create a playlist starting from the current track
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
    
    // Event handlers that can be overridden
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
  
  module.exports = MusicPlayer;