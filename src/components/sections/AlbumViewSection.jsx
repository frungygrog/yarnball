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
  downloadAlbum,
  slskConnected,
  activeSection,
  libraryData // Add this prop to check if songs are already downloaded
}) => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0); // Track how many songs are already downloaded

  useEffect(() => {
    if (album) {
      loadAlbumTracks();
    }
  }, [album, libraryData]); // Added libraryData to dependencies to refresh when library changes

  const loadAlbumTracks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tracksData = await window.api.getAlbumTracks(album.artist, album.name);
      const formattedTracks = tracksData.map((track, index) => {
        // For each track, check if it's already in the library and get its path
        const librarySong = libraryData.songs.find(s =>
          s.name.toLowerCase() === track.name.toLowerCase() &&
          s.artist.toLowerCase() === album.artist.toLowerCase()
        );
        const isDownloaded = !!librarySong;
        const path = librarySong ? librarySong.path : null; // Get the path if downloaded

        return {
          id: track.mbid || generateId(),
          name: track.name,
          artist: album.artist,
          album: album.name,
          number: index + 1,
          duration: track.duration,
          image: album.image,
          isDownloaded, // Add downloaded flag
          path // Add the path property
        };
      });
      
      // Count downloaded tracks
      const downloadedCount = formattedTracks.filter(track => track.isDownloaded).length;
      setDownloadCount(downloadedCount);
      
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
    
    // Filter out already downloaded tracks
    const tracksToDownload = tracks.filter(track => !track.isDownloaded);
    
    if (tracksToDownload.length === 0) {
      alert('All tracks from this album are already downloaded');
      return;
    }
    
    // Set downloading state
    setIsDownloading(true);
    
    try {
      // Download the entire album at once instead of track-by-track
      await downloadAlbum(album, tracksToDownload);
      
      // Show success message (handled by downloadAlbum function)
    } catch (error) {
      console.error('Failed to download album:', error);
      alert(`Failed to download album: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper function to generate ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  if (!album) {
    return null;
  }

  // Calculate how many tracks are left to download
  const tracksRemaining = tracks.length - downloadCount;

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
            
            {/* Show download status in the button */}
            <Button 
              id="download-album" 
              className="download-album-btn"
              onClick={handleDownloadAlbum}
              disabled={isDownloading || tracksRemaining === 0}
            >
              {isDownloading ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Downloading Album...
                </>
              ) : tracksRemaining === 0 ? (
                <>
                  <Download size={16} className="mr-2" />
                  Album Downloaded
                </>
              ) : downloadCount > 0 ? (
                <>
                  <Download size={16} className="mr-2" />
                  Download {tracksRemaining} Remaining Tracks
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Download Album
                </>
              )}
            </Button>
            
            {/* Show download stats */}
            {downloadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {downloadCount} of {tracks.length} tracks downloaded
              </p>
            )}
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
                  isDownloaded={track.isDownloaded} // Pass the downloaded status
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