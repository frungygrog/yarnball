import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const PlayerBar = ({ 
  currentTrackIndex, 
  queue, 
  isPlaying, 
  toggleFavoriteSong,
  favoritesData,
  onTogglePlayPause,
  onPrevTrack,
  onNextTrack
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  const currentTrack = currentTrackIndex >= 0 && queue.length > 0 ? queue[currentTrackIndex] : null;
  const isFavorite = currentTrack ? favoritesData.songs.some(s => s.id === currentTrack.id) : false;

  // Format time for display (e.g., 3:45)
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle volume change
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    // Apply volume to audio element
  };

  // Toggle mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Apply mute to audio element
  };

  // Handle progress bar click
  const handleProgressChange = (newProgress) => {
    // Apply progress to audio element
  };

  return (
    <div className="player-bar">
      <div className="now-playing">
        <div className="track-image">
          <img 
            id="current-track-image" 
            src={currentTrack?.image || '/api/placeholder/60/60'} 
            alt="Track Image" 
          />
        </div>
        <div className="track-info">
          <div 
            id="current-track-name" 
            className="track-name"
            style={{ textTransform: 'lowercase' }}
          >
            {currentTrack?.name || 'No track playing'}
          </div>
          <div id="current-track-artist" className="track-artist">
            {currentTrack?.artist || ''}
          </div>
        </div>
        <Button 
          id="favorite-track" 
          variant="ghost" 
          size="icon" 
          className={`heart-btn ${isFavorite ? 'active' : ''}`}
          disabled={!currentTrack}
          onClick={() => currentTrack && toggleFavoriteSong(currentTrack)}
        >
          <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
        </Button>
      </div>
      
      <div className="player-controls">
        <div className="control-buttons">
          <Button 
            id="prev-track" 
            variant="ghost" 
            size="icon" 
            className="control-btn" 
            disabled={!currentTrack}
            onClick={onPrevTrack}
          >
            <SkipBack size={16} />
          </Button>
          <Button 
            id="play-pause" 
            variant="default" 
            size="icon" 
            className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
            disabled={!currentTrack}
            onClick={onTogglePlayPause}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button 
            id="next-track" 
            variant="ghost" 
            size="icon" 
            className="control-btn" 
            disabled={!currentTrack}
            onClick={onNextTrack}
          >
            <SkipForward size={16} />
          </Button>
        </div>
        <div className="progress-container">
          <span id="current-time">{formatTime(currentTime)}</span>
          <Slider
            className="progress-bar"
            min={0}
            max={duration}
            step={1}
            value={[currentTime]}
            onValueChange={(values) => handleProgressChange(values[0])}
          />
          <span id="total-time">{formatTime(duration)}</span>
        </div>
      </div>
      
      <div className="volume-controls">
        <Button 
          id="volume-btn" 
          variant="ghost" 
          size="icon" 
          className="volume-btn"
          onClick={handleToggleMute}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </Button>
        <div className="volume-slider-container">
          <Slider
            className="volume-slider"
            min={0}
            max={1}
            step={0.01}
            value={[isMuted ? 0 : volume]}
            onValueChange={(values) => handleVolumeChange(values[0])}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;