import React from 'react';
import { Play, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SongItem = ({ song, includeAlbum = false, context = 'search', onPlay, onDownload }) => {
  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const duration = song.duration ? formatTime(song.duration) : '--:--';

  return (
    <div className="song-item" data-id={song.id} data-context={context}>
      <div className="song-number">{song.number || '-'}</div>
      <div className="song-info">
        <div className="song-title">{song.name}</div>
        <div className="song-artist">{song.artist}</div>
      </div>
      
      {includeAlbum && (
        <div className="song-album">{song.album || '-'}</div>
      )}
      
      <div className="song-duration">{duration}</div>
      <div className="song-actions">
        <Button 
          variant="ghost" 
          size="icon" 
          className="song-play-btn" 
          onClick={onPlay}
        >
          <Play size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="song-download-btn" 
          onClick={onDownload}
        >
          <Download size={16} />
        </Button>
      </div>
    </div>
  );
};

export default SongItem;