import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Loader } from 'lucide-react';
import { Button } from '../../components/ui/button';

import SongItem from '../common/SongItem';
import AlbumCard from '../common/AlbumCard';

// Helper function to format large numbers (scrobbles/listeners)
const formatCount = (count) => {
  const num = parseInt(count);
  if (isNaN(num)) return '';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toLocaleString();
};

// Helper function to generate ID (can be moved to utils)
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};


const ArtistViewSection = ({
  artist,
  switchSection,
  previousSection,
  toggleFavoriteArtist,
  favoritesData,
  loadAlbumView,
  playSong,
  downloadSong,
  activeSection,
  libraryData // Needed to check download status for songs
}) => {
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  // Store full artist info including playcount
  const [fullArtistInfo, setFullArtistInfo] = useState(artist); 
  const [isLoading, setIsLoading] = useState({ tracks: false, albums: false, artist: false });
  const [error, setError] = useState({ tracks: null, albums: null, artist: null });
  
  // Check if the current artist is favorited
  const isFavorite = favoritesData?.artists?.some(a => a.id === artist?.id || a.name === artist?.name);

  useEffect(() => {
    if (artist) {
      // Load artist details (including playcount) and then tracks/albums
      loadArtistDetails(); 
    }
    // Reset state if artist becomes null
    return () => {
       setTopTracks([]);
       setAlbums([]);
       setFullArtistInfo(null); // Reset full info
       setIsLoading({ tracks: false, albums: false, artist: false });
       setError({ tracks: null, albums: null, artist: null });
    }
  }, [artist]); // Rerun if the base artist prop changes

  // Function to load detailed artist info (including playcount)
  const loadArtistDetails = async () => {
     if (!artist || !artist.name) {
       console.error("Cannot load artist details: artist object or name is missing.");
       setError(prev => ({ ...prev, artist: "Invalid artist data" }));
       return;
     }
     setIsLoading(prev => ({ ...prev, artist: true }));
     setError(prev => ({ ...prev, artist: null }));
     try {
       // Use getArtistInfo which should return playcount
       const detailedInfo = await window.api.getArtistInfo(artist.name); 
       setFullArtistInfo(detailedInfo); // Store detailed info
       // Once artist details are loaded, load tracks and albums
       loadArtistTracksAndAlbums(detailedInfo.name); 
     } catch (err) {
       console.error('Error loading detailed artist info:', err);
       setError(prev => ({ ...prev, artist: err.message }));
       setFullArtistInfo(artist); // Fallback to initial artist prop on error
       // Still try to load tracks/albums even if details fail
       loadArtistTracksAndAlbums(artist.name); 
     } finally {
       setIsLoading(prev => ({ ...prev, artist: false }));
     }
  };

  // Function to load tracks and albums (called after artist details)
  const loadArtistTracksAndAlbums = async (artistName) => {
    setIsLoading(prev => ({ ...prev, tracks: true, albums: true }));
    setError(prev => ({ ...prev, tracks: null, albums: null }));

    // Fetch top tracks
    try {
      const topTracksData = await window.api.getArtistTopTracks(artistName);
      const formattedTracks = topTracksData.map((track, index) => {
         const librarySong = libraryData?.songs?.find(s => 
           s.name.toLowerCase() === track.name.toLowerCase() && 
           s.artist?.toLowerCase() === artistName.toLowerCase()
         );
         return {
           id: track.mbid || generateId(),
           name: track.name,
           artist: artistName, 
           number: index + 1,
           listeners: track.listeners, // Keep listeners if needed elsewhere
           duration: track.duration,
           image: track.image?.[2]?.['#text'] || fullArtistInfo?.image || artist?.image, // Use best available image
           isDownloaded: !!librarySong,
           path: librarySong ? librarySong.path : null
         };
      });
      setTopTracks(formattedTracks);
    } catch (err) {
      console.error('error loading artist top tracks:', err);
      setError(prev => ({ ...prev, tracks: err.message }));
    } finally {
       setIsLoading(prev => ({ ...prev, tracks: false }));
    }
    
    // Fetch albums
    try {
      const albumsData = await window.api.getArtistAlbums(artistName);
      const formattedAlbums = albumsData.map(album => ({
        id: album.mbid || generateId(),
        name: album.name,
        artist: artistName, 
        image: album.image?.[2]?.['#text'] || null,
        fromArtist: true 
      }));
      setAlbums(formattedAlbums);
    } catch (err) {
      console.error('error loading artist albums:', err);
      setError(prev => ({ ...prev, albums: err.message }));
    } finally {
       setIsLoading(prev => ({ ...prev, albums: false }));
    }
  };


  // Use fullArtistInfo for display, fallback to artist prop if needed
  const displayArtist = fullArtistInfo || artist; 

  if (!displayArtist) {
    return <div className={`content-section ${activeSection === 'artist-view' ? 'active' : ''}`}>Loading artist...</div>;
  }

  // Determine count and label for display
  const displayCount = displayArtist?.playcount || displayArtist?.listeners;
  const countLabel = displayArtist?.playcount ? 'scrobbles' : 'listeners';
  const fullCountTitle = displayCount ? `${parseInt(displayCount).toLocaleString()} ${countLabel}` : "";


  return (
    <div id="artist-view-section" className={`content-section ${activeSection === 'artist-view' ? 'active' : ''}`}>
      <div className="artist-header mb-6"> 
        <div className="back-button mb-4"> 
          <Button 
            id="back-from-artist" 
            variant="outline"
            onClick={() => switchSection(previousSection || 'search')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
        </div>
        
        <div className="artist-info flex items-center gap-4"> 
          <img 
             src={displayArtist.image || '/api/placeholder/80/80'} 
             alt={displayArtist.name} 
             className="w-20 h-20 rounded-full object-cover flex-shrink-0" 
           />
          {/* Container for text elements to ensure stacking */}
          {/* Removed flex-grow to allow natural sizing, added padding */}
          <div className="flex flex-col min-w-0 pr-4"> 
            <h1 id="artist-name" className="text-3xl font-bold truncate" title={displayArtist.name}>
              {displayArtist.name}
            </h1>
            {/* Display count (scrobbles or listeners) if available */}
            {isLoading.artist ? (
               <div className="text-sm text-muted-foreground mt-0.5">Loading stats...</div> // Reduced margin
            ) : displayCount ? (
              <div 
                className="artist-count text-sm text-muted-foreground mt-0.5" // Reduced margin
                title={fullCountTitle} 
              >
                {formatCount(displayCount)} {countLabel} 
              </div>
            ) : error.artist ? (
               <div className="text-sm text-destructive mt-0.5">Error loading stats</div> // Reduced margin
            ) : null 
            }
          </div>
          {/* Favorite Button */}
          <Button 
            id="favorite-artist" 
            variant="ghost"
            size="icon"
            className={`heart-btn ${isFavorite ? 'active' : ''} ml-auto flex-shrink-0`} 
            onClick={() => toggleFavoriteArtist(displayArtist)} 
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            disabled={!displayArtist} 
          >
            <Heart size={24} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
          </Button>
        </div>
      </div>

      <div className="artist-content">
        {/* Top Songs */}
        <div className="artist-top-songs mb-8"> 
          <h3 className="text-xl font-semibold mb-3">top songs</h3> 
          
          <div id="artist-songs-list" className="song-list">
             <div className="song-list-headers">
               <div className="song-number">#</div>
               <div className="song-info">Title</div>
               <div className="song-duration">Duration</div> 
               <div className="song-actions"></div>
             </div>
            {isLoading.tracks ? (
              <div className="loading p-4 text-center">
                <Loader className="animate-spin inline-block mr-2" size={18} />
                <span>loading songs...</span>
              </div>
            ) : error.tracks ? (
              <div className="empty-state p-4">
                <p className="text-destructive">Error loading songs: {error.tracks}</p>
              </div>
            ) : topTracks.length > 0 ? (
              topTracks.map(song => (
                <SongItem
                  key={song.id || `${song.name}-${song.artist}`}
                  song={song}
                  context="artist" 
                  onPlay={() => playSong(song, "artist")}
                  onDownload={() => downloadSong(song)}
                  isDownloaded={song.isDownloaded}
                  loadAlbumView={loadAlbumView} 
                />
              ))
            ) : (
              <div className="empty-state p-4">
                <p>no songs found for this artist.</p>
              </div>
            )}
          </div>
        </div>

        {/* Albums */}
        <div className="artist-albums">
          <h3 className="text-xl font-semibold mb-3">albums</h3> 
          
          <div id="artist-albums-grid" className="albums-grid">
            {isLoading.albums ? (
              <div className="loading p-4 text-center">
                <Loader className="animate-spin inline-block mr-2" size={18} />
                <span>loading albums...</span>
              </div>
            ) : error.albums ? (
              <div className="empty-state p-4">
                <p className="text-destructive">error loading albums: {error.albums}</p>
              </div>
            ) : albums.length > 0 ? (
              albums.map(album => (
                <AlbumCard
                  key={album.id || `${album.name}-${album.artist}`}
                  album={album}
                  onClick={() => loadAlbumView(album)}
                />
              ))
            ) : (
              <div className="empty-state p-4">
                <p>no albums found for this artist.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistViewSection;