import React, { useState, useEffect } from 'react';
import { Music, Disc, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components

import SongItem from '../common/SongItem';
import AlbumCard from '../common/AlbumCard';
import ArtistCard from '../common/ArtistCard';
import './LibrarySection.css'; // Import the component-specific CSS

const LibrarySection = ({
  libraryData,
  loadAlbumView,
  loadArtistView,
  playSong,
  // downloadSong prop seems unused here, can be removed if not needed later
  activeSection,
  setLibraryData, // We need this to update the library state
  showNotification // For showing notifications after deletion
}) => {
  const [activeTab, setActiveTab] = useState('songs'); // Default to songs tab

  // Debug the library data on mount
  useEffect(() => {
    console.log("Library Data in Library Section:", libraryData);
  }, [libraryData]);

  // Delete song from library
  const deleteSong = async (song) => {
    try {
      // 1. Check for other references to the same file path
      const duplicates = libraryData.songs.filter(s => 
        s.id !== song.id && s.path === song.path && song.path
      );
      const hasOtherReferences = duplicates.length > 0;

      // 2. Delete the actual file if no other songs reference it
      if (song.path && !hasOtherReferences) {
        try {
          await window.api.deleteFile(song.path);
          console.log(`File deleted successfully: ${song.path}`);
        } catch (error) {
          console.error(`Error deleting file: ${error.message}`);
          showNotification(`Error deleting file: ${error.message}`, 'error');
          // Optionally decide if you want to proceed with removing from library if file deletion fails
        }
      } else if (hasOtherReferences) {
        console.log(`Skipping file deletion as ${duplicates.length} other entries reference this file`);
      }

      // 3. Remove the song from the library state
      const updatedSongs = libraryData.songs.filter(s => s.id !== song.id);
      
      // 4. Check if album/artist needs removal
      let updatedAlbums = [...libraryData.albums];
      let updatedArtists = [...libraryData.artists];
      
      if (song.album) {
        const albumSongs = updatedSongs.filter(s => 
          s.album?.toLowerCase() === song.album.toLowerCase() && 
          s.artist?.toLowerCase() === song.artist?.toLowerCase()
        );
        if (albumSongs.length === 0) {
          updatedAlbums = updatedAlbums.filter(a => 
            !(a.name.toLowerCase() === song.album.toLowerCase() && 
              a.artist.toLowerCase() === song.artist.toLowerCase())
          );
        }
      }
      
      if (song.artist) {
        const artistSongs = updatedSongs.filter(s => 
          s.artist?.toLowerCase() === song.artist.toLowerCase()
        );
        if (artistSongs.length === 0) {
          updatedArtists = updatedArtists.filter(a => 
            a.name.toLowerCase() !== song.artist.toLowerCase()
          );
        }
      }
      
      // 5. Create updated library data
      const updatedLibraryData = {
        songs: updatedSongs,
        albums: updatedAlbums,
        artists: updatedArtists
      };
      
      // 6. Save to localStorage
      localStorage.setItem('yarnball_library', JSON.stringify(updatedLibraryData));
      
      // 7. Update the app state
      setLibraryData(updatedLibraryData);
      
      // 8. Show success notification
      showNotification(`Removed "${song.name}" from your library`, 'success');
      
    } catch (error) {
      console.error('Error deleting song:', error);
      showNotification(`Error removing song: ${error.message}`, 'error');
    }
  };

  return (
    <div id="library-section" className={`content-section ${activeSection === 'library' ? 'active' : ''}`}>
      <h2 className="text-2xl font-bold mb-5">your library</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Use TabsList instead of button group */}
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="songs">
            <Music className="mr-2 h-4 w-4" /> Songs ({libraryData?.songs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="albums">
            <Disc className="mr-2 h-4 w-4" /> Albums ({libraryData?.albums?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="artists">
            <User className="mr-2 h-4 w-4" /> Artists ({libraryData?.artists?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Songs Tab */}
        <TabsContent value="songs">
          {libraryData?.songs && libraryData.songs.length > 0 ? (
            <>
              <div className="song-list-headers">
                <div className="song-number">#</div>
                <div className="song-info">Title</div>
                <div className="song-album">Album</div>
                <div className="song-duration">Duration</div>
                <div className="song-actions"></div>
              </div>
              
              <div id="saved-songs-list" className="song-list">
                {libraryData.songs.map((song, index) => (
                  <SongItem
                    key={song.id || `${song.name}-${song.artist}-${index}`} // More robust key
                    song={{ ...song, number: index + 1, isDownloaded: true }} // Library songs are always downloaded
                    includeAlbum={true}
                    context="library"
                    onPlay={() => playSong(song, "library")}
                    onDelete={() => deleteSong(song)}
                    isDownloaded={true} // Explicitly set for clarity
                    loadAlbumView={loadAlbumView} // Pass album nav function
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Music size={48} />
              <p>your saved songs will appear here.</p>
            </div>
          )}
        </TabsContent>
        
        {/* Albums Tab */}
        <TabsContent value="albums">
          {libraryData?.albums && libraryData.albums.length > 0 ? (
            <div id="albums-grid" className="albums-grid">
              {libraryData.albums.map((album, index) => (
                <AlbumCard
                  key={album.id || `${album.name}-${album.artist}-${index}`} // More robust key
                  album={album}
                  onClick={() => loadAlbumView(album)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Disc size={48} />
              <p>your albums will appear here.</p>
            </div>
          )}
        </TabsContent>
        
        {/* Artists Tab */}
        <TabsContent value="artists">
          {libraryData?.artists && libraryData.artists.length > 0 ? (
            <div id="artists-grid" className="artists-grid">
              {libraryData.artists.map((artist, index) => (
                <ArtistCard
                  key={artist.id || `${artist.name}-${index}`} // More robust key
                  artist={artist}
                  onClick={() => loadArtistView(artist)}
                  // Add favorite toggle if needed in library context
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <User size={48} />
              <p>artists from your library will appear here.</p> 
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibrarySection;