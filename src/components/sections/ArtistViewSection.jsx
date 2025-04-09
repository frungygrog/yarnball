import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

import SongItem from '../common/SongItem';
import AlbumCard from '../common/AlbumCard';

const ArtistViewSection = ({
  artist,
  switchSection,
  previousSection,
  toggleFavoriteArtist,
  favoritesData,
  loadAlbumView,
  playSong,
  downloadSong
}) => {
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState({ tracks: false, albums: false });
  const [error, setError] = useState({ tracks: null, albums: null });
  
  const isFavorite = favoritesData.artists.some(a => a.id === artist?.id);

  useEffect(() => {
    if (artist) {
      loadArtistData();
    }
  }, [artist]);

  const loadArtistData = async () => {
    setIsLoading({ tracks: true, albums: true });
    setError({ tracks: null, albums: null });
    
    try {
      // Get top tracks
      const topTracksData = await window.api.getArtistTopTracks(artist.name);
      const formattedTracks = topTracksData.map((track, index) => ({
        id: track.mbid || generateId(),
        name: track.name,
        artist: artist.name,
        number: index + 1,
        listeners: track.listeners,
        duration: track.duration,
        image: track.image && track.image.length > 0 ? track.image[2]['#text'] : null
      }));
      
      setTopTracks(formattedTracks);
      setIsLoading(prev => ({ ...prev, tracks: false }));
    } catch (err) {
      console.error('Error loading artist top tracks:', err);
      setError(prev => ({ ...prev, tracks: err.message }));
      setIsLoading(prev => ({ ...prev, tracks: false }));
    }
    
    try {
      // Get albums
      const albumsData = await window.api.getArtistAlbums(artist.name);
      const formattedAlbums = albumsData.map(album => ({
        id: album.mbid || generateId(),
        name: album.name,
        artist: artist.name,
        image: album.image && album.image.length > 0 ? album.image[2]['#text'] : null,
        fromArtist: true
      }));
      
      setAlbums(formattedAlbums);
      setIsLoading(prev => ({ ...prev, albums: false }));
    } catch (err) {
      console.error('Error loading artist albums:', err);
      setError(prev => ({ ...prev, albums: err.message }));
      setIsLoading(prev => ({ ...prev, albums: false }));
    }
  };

  // Helper function to generate ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  if (!artist) {
    return null;
  }

  return (
    <div id="artist-view-section" className="content-section">
      <div className="artist-header">
        <div className="back-button">
          <Button 
            id="back-to-search" 
            variant="outline"
            onClick={() => switchSection(previousSection || 'search')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
        </div>
        
        <div className="artist-info">
          <h1 id="artist-name" style={{ textTransform: 'lowercase' }}>{artist.name}</h1>
          <Button 
            id="favorite-artist" 
            variant="ghost"
            size="icon"
            className={`heart-btn ${isFavorite ? 'active' : ''}`}
            onClick={() => toggleFavoriteArtist(artist)}
          >
            <Heart size={24} className={isFavorite ? 'fill-current' : ''} />
          </Button>
        </div>
      </div>

      <div className="artist-content">
        {/* Top Songs */}
        <div className="artist-top-songs">
          <h3 style={{ textTransform: 'lowercase' }}>Top Songs</h3>
          
          <div id="artist-songs-list" className="song-list">
            {isLoading.tracks ? (
              <div className="loading">
                <Loader className="animate-spin" size={24} />
                <span className="ml-2">Loading songs...</span>
              </div>
            ) : error.tracks ? (
              <div className="empty-state">
                <p>Error loading songs: {error.tracks}</p>
              </div>
            ) : topTracks.length > 0 ? (
              topTracks.map(song => (
                <SongItem
                  key={song.id}
                  song={song}
                  context="artist"
                  onPlay={() => playSong(song, "artist")}
                  onDownload={() => downloadSong(song)}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>No songs found for this artist</p>
              </div>
            )}
          </div>
        </div>

        {/* Albums */}
        <div className="artist-albums">
          <h3 style={{ textTransform: 'lowercase' }}>Albums</h3>
          
          <div id="artist-albums-grid" className="albums-grid">
            {isLoading.albums ? (
              <div className="loading">
                <Loader className="animate-spin" size={24} />
                <span className="ml-2">Loading albums...</span>
              </div>
            ) : error.albums ? (
              <div className="empty-state">
                <p>Error loading albums: {error.albums}</p>
              </div>
            ) : albums.length > 0 ? (
              albums.map(album => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onClick={() => loadAlbumView(album)}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>No albums found for this artist</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistViewSection;