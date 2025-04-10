import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Loader } from 'lucide-react';
import { Button } from '../../components/ui/button';

import SongItem from '../common/SongItem';

const AlbumViewSection = ({
  album,
  switchSection,
  previousSection,
  playSong,
  downloadSong,
  slskConnected,
  activeSection
}) => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (album) {
      loadAlbumTracks();
    }
  }, [album]);

  const loadAlbumTracks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tracksData = await window.api.getAlbumTracks(album.artist, album.name);
      const formattedTracks = tracksData.map((track, index) => ({
        id: track.mbid || generateId(),
        name: track.name,
        artist: album.artist,
        album: album.name,
        number: index + 1,
        duration: track.duration,
        image: album.image
      }));
      
      setTracks(formattedTracks);
    } catch (err) {
      console.error('Error loading album tracks:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAlbum = async () => {
    if (!slskConnected) {
      alert('Please connect to Soulseek first');
      switchSection('settings');
      return;
    }
    
    if (tracks.length === 0) {
      alert('No tracks found for this album');
      return;
    }
    
    // Download each track
    tracks.forEach(track => {
      downloadSong(track);
    });
  };

  // Helper function to generate ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  if (!album) {
    return null;
  }

  return (
    <div id="album-view-section" className={`content-section ${activeSection === 'album-view' ? 'active' : ''}`}>
      <div className="album-header">
        <div className="back-button">
          <Button 
            id="back-from-album" 
            variant="outline"
            onClick={() => {
              if (album.fromArtist) {
                // If we came from artist view, go back there
                switchSection('artist-view');
              } else {
                // Otherwise go back to previous section
                switchSection(previousSection || 'search');
              }
            }}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
        </div>
        
        <div className="album-info">
          <div className="album-cover">
            <img 
              id="album-cover-img" 
              src={album.image || '/api/placeholder/200/200'} 
              alt="Album Cover" 
            />
          </div>
          
          <div className="album-details">
            <h1 id="album-title">{album.name}</h1>
            <h3 id="album-artist">{album.artist}</h3>
            <Button 
              id="download-album" 
              className="download-album-btn"
              onClick={handleDownloadAlbum}
            >
              <Download size={16} className="mr-2" />
              Download Album
            </Button>
          </div>
        </div>
      </div>

      <div className="album-content">
        <div className="album-tracks">
          <div className="song-list-headers">
            <div className="song-number">#</div>
            <div className="song-info">title</div>
            <div className="song-duration">duration</div>
            <div className="song-actions"></div>
          </div>
          
          <div id="album-tracks-list" className="song-list">
            {isLoading ? (
              <div className="loading">
                <Loader className="animate-spin" size={24} />
                <span className="ml-2">loading tracks...</span>
              </div>
            ) : error ? (
              <div className="empty-state">
                <p style={{ textTransform: 'lowercase' }}>error loading tracks: {error}</p>
              </div>
            ) : tracks.length > 0 ? (
              tracks.map(track => (
                <SongItem
                  key={track.id}
                  song={track}
                  context="album"
                  onPlay={() => playSong(track, "album")}
                  onDownload={() => downloadSong(track)}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>no tracks found for this album.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumViewSection;