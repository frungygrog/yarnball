import React from 'react';
import { Play, Download, Trash2, Check, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SongItem = ({ 
  song, 
  includeAlbum = false, 
  context = 'search', 
  onPlay, 
  onDownload, 
  onDelete,
  onToggleFavorite, // Add prop for toggling favorite status
  isDownloaded = false,
  loadAlbumView // Add prop for album navigation
}) => {
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

  // --- Album Navigation Handler ---
  const handleAlbumClick = () => {
    if (songAlbum && songAlbum !== 'Unknown Album' && songArtist && songArtist !== 'Unknown' && loadAlbumView) {
      // Pass necessary info to loadAlbumView
      loadAlbumView({ 
        name: songAlbum, 
        artist: songArtist, 
        image: song?.image // Pass image if available in song object
      });
    } else {
      console.warn("Cannot navigate to album: Missing album/artist name or loadAlbumView function.");
    }
  };
  // --- End Album Navigation Handler ---

  return (
    <div className="song-item group" data-id={song?.id} data-context={context}>
      
      {/* Number column with hover actions */}
      <div className="song-number flex items-center justify-center relative group"> 
        <span className="song-track-number mr-1">{songNumber}</span> 
        {isDownloaded && (
          <Button variant="ghost" size="icon" className="song-play-btn h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150" title="Play" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onPlay) onPlay(); }}>
            <Play size={16} />
          </Button>
        )}
        {!isDownloaded && context !== 'library' && (
          <Button variant="ghost" size="icon" className="song-download-hover-btn h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150" title="Download" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onDownload) onDownload(); }}>
            <Download size={16} />
          </Button>
        )}
      </div>
      
      {/* Song Info */}
      <div className="song-info">
        <div className="song-title flex items-center">
          {songName}
          {isDownloaded && (
            <span className="ml-2 text-green-500" title="Downloaded">
              <Check size={14} />
            </span>
          )}
        </div>
        <div className="song-artist">{songArtist}</div>
      </div>
      
      {/* Album Info (Optional and Clickable) */}
      {includeAlbum && (
        <div className="song-album">
          <button 
            className="text-left bg-transparent border-none p-0 cursor-pointer hover:underline disabled:cursor-default disabled:no-underline text-muted-foreground text-xs"
            onClick={handleAlbumClick}
            disabled={!songAlbum || songAlbum === 'Unknown Album' || !songArtist || songArtist === 'Unknown' || !loadAlbumView}
            title={songAlbum && songAlbum !== 'Unknown Album' ? `Go to album: ${songAlbum}` : ""}
          >
            {songAlbum}
          </button>
        </div>
      )}
      
      {/* Duration */}
      <div className="song-duration">{duration}</div>
      
      {/* Actions Column */}
      <div className="song-actions">
        {context === 'library' && onDelete && (
          <Button variant="ghost" size="icon" className="song-delete-btn" title="Remove from library" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}>
            <Trash2 size={16} />
          </Button>
        )}
        {context === 'favorites' && onToggleFavorite && (
          <Button variant="ghost" size="icon" className="song-favorite-btn text-red-500 hover:text-red-600" title="Remove from favorites" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}>
            <Heart size={16} fill="currentColor" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SongItem;