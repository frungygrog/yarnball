import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatTime } from '../../lib/utils';

const PlayerBar = ({ 
  currentTrackIndex, 
  queue, 
  isPlaying, 
  toggleFavoriteSong,
  favoritesData,
  onTogglePlayPause,
  onPrevTrack,
  onNextTrack,
  audio
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  const currentTrack = currentTrackIndex >= 0 && queue.length > 0 ? queue[currentTrackIndex] : null;
  const isFavorite = currentTrack ? favoritesData.songs.some(s => s.id === currentTrack.id) : false;

  // Update audio element when it changes
  useEffect(() => {
    if (!audio) return;
    
    // Set initial volume
    audio.volume = isMuted ? 0 : volume;
    
    // Set up event listeners
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleTimeUpdate);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleTimeUpdate);
    };
  }, [audio, volume, isMuted]);

  // Handle volume change
  const handleVolumeChange = (values) => {
    const newVolume = values[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (audio) {
      audio.volume = newVolume;
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audio) {
      audio.volume = newMutedState ? 0 : volume;
    }
  };

  // Handle progress bar click
  const handleProgressChange = (values) => {
    const newPosition = values[0];
    if (audio && duration > 0) {
      audio.currentTime = newPosition;
      setCurrentTime(newPosition);
    }
  };

  return (
    <div className="player-bar">
      <div className="now-playing">
        {currentTrack ? (
          <>
            <div className="track-image">
              <img 
                id="current-track-image" 
                src={currentTrack?.image || '/api/placeholder/60/60'} 
                alt="Track" 
              />
            </div>
            <div className="track-info">
              <div 
                id="current-track-name" 
                className="track-name"
                style={{ textTransform: 'lowercase' }}
              >
                {currentTrack?.name}
              </div>
              <div id="current-track-artist" className="track-artist">
                {currentTrack?.artist}
              </div>
            </div>
            <Button 
              id="favorite-track" 
              variant="ghost" 
              size="icon" 
              className={`heart-btn ${isFavorite ? 'active' : ''}`}
              onClick={() => toggleFavoriteSong(currentTrack)}
            >
              <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
            </Button>
          </>
        ) : (
          <div className="track-info">
            <div className="track-name">no track selected</div>
          </div>
        )}
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
            max={duration || 100}
            step={1}
            value={[currentTime]}
            onValueChange={handleProgressChange}
            disabled={!currentTrack}
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
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;