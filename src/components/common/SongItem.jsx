import React from 'react';
import { Play, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SongItem = ({ song, includeAlbum = false, context = 'search', onPlay, onDownload }) => {
  // Format time function inside component
  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle potential undefined values gracefully
  const songName = song?.name || 'Unknown';
  const songArtist = song?.artist || 'Unknown';
  const songAlbum = song?.album || 'Unknown Album';
  const songNumber = song?.number || '-';
  const duration = song?.duration ? formatTime(song.duration) : '--:--';

  return (
    <div className="song-item" data-id={song?.id} data-context={context}>
      <div className="song-number">{songNumber}</div>
      <div className="song-info">
        <div className="song-title">{songName}</div>
        <div className="song-artist">{songArtist}</div>
      </div>
      
      {includeAlbum && (
        <div className="song-album">{songAlbum}</div>
      )}
      
      <div className="song-duration">{duration}</div>
      <div className="song-actions">
        <Button 
          variant="ghost" 
          size="icon" 
          className="song-play-btn" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onPlay) onPlay();
          }}
        >
          <Play size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="song-download-btn" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onDownload) onDownload();
          }}
        >
          <Download size={16} />
        </Button>
      </div>
    </div>
  );
};

export default SongItem;