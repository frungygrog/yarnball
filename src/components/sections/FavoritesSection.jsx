import React, { useState } from 'react';
import { Heart, Music, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ArtistCard from '../common/ArtistCard';
import SongItem from '../common/SongItem'; 

const FavoritesSection = ({
  favoritesData,
  toggleFavoriteArtist,
  toggleFavoriteSong, // <<< Add prop for toggling favorite song
  loadArtistView,
  playSong,
  libraryData,
  loadAlbumView, // Add prop for album navigation
  activeSection
}) => {
  const [activeTab, setActiveTab] = useState('songs'); 

  const handleToggleFavorite = (artist) => {
    if (typeof toggleFavoriteArtist === 'function') {
      toggleFavoriteArtist(artist);
    } else {
      console.error('toggleFavoriteArtist function is not defined');
    }
  };

  const isSongDownloaded = (song) => {
    // Ensure libraryData and libraryData.songs exist before accessing
    return libraryData?.songs?.some(s => 
      s.name.toLowerCase() === song.name.toLowerCase() && 
      s.artist?.toLowerCase() === song.artist?.toLowerCase() && // Check artist exists
      s.path 
    );
  };
  
  const getSongPath = (song) => {
     // Ensure libraryData and libraryData.songs exist
     const librarySong = libraryData?.songs?.find(s => 
       s.name.toLowerCase() === song.name.toLowerCase() && 
       s.artist?.toLowerCase() === song.artist?.toLowerCase() // Check artist exists
     );
     return librarySong ? librarySong.path : null;
  }

  return (
    <div id="favorites-section" className={`content-section ${activeSection === 'favorites' ? 'active' : ''}`}>
      <h2 className="text-2xl font-bold mb-5">your favorites</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="songs">
            <Music className="mr-2 h-4 w-4" /> Songs ({favoritesData?.songs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="artists">
            <User className="mr-2 h-4 w-4" /> Artists ({favoritesData?.artists?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Songs Tab */}
        <TabsContent value="songs">
          <div className="favorites-container w-full h-full">
            {favoritesData?.songs && favoritesData.songs.length > 0 ? (
              <div className="song-list">
                 {/* Add headers for the song list including Album */}
                 <div className="song-list-headers">
                   <div className="song-number">#</div>
                   <div className="song-info">title</div>
                   <div className="song-album">Album</div> 
                   <div className="song-duration">duration</div>
                   <div className="song-actions"></div>
                 </div>
                {favoritesData.songs.map((song, index) => { 
                  const downloaded = isSongDownloaded(song);
                  const path = getSongPath(song);
                  // Ensure song object passed includes necessary fields
                  const songData = {
                    ...song, 
                    path: path, 
                    number: index + 1, 
                    duration: song.duration || 0,
                    // Ensure album and artist are present, provide defaults if needed
                    album: song.album || 'Unknown Album', 
                    artist: song.artist || 'Unknown Artist' 
                  };
                  return (
                    <SongItem
                      key={song.id || `${song.name}-${song.artist}-${index}`} // More robust key
                      song={songData} 
                      includeAlbum={true} // <<< Show the album column
                      context="favorites" 
                      onPlay={() => playSong(songData, "favorites")} 
                      isDownloaded={downloaded}
                      loadAlbumView={loadAlbumView} // <<< Pass the navigation function
                      onToggleFavorite={() => toggleFavoriteSong(songData)} // <<< Pass the toggle function
                    />
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <Heart size={48} />
                <p>songs you've hearted will appear here.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Artists Tab */}
        <TabsContent value="artists">
          <div className="favorites-container w-full h-full">
            {favoritesData?.artists && favoritesData.artists.length > 0 ? (
              <div id="favorite-artists-grid" className="artists-grid">
                {favoritesData.artists.map(artist => (
                  <ArtistCard
                    key={artist.id || artist.name}
                    artist={artist}
                    isFavorite={true}
                    onClick={() => loadArtistView(artist)}
                    onFavoriteToggle={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Heart size={48} />
                <p>artists you've hearted will appear here.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FavoritesSection;