import React, { useState, useEffect } from 'react';
import { Music, Disc, User } from 'lucide-react';

import SongItem from '../common/SongItem';
import AlbumCard from '../common/AlbumCard';
import ArtistCard from '../common/ArtistCard';

const LibrarySection = ({
  libraryData,
  loadAlbumView,
  loadArtistView,
  playSong,
  downloadSong,
  activeSection,
  setLibraryData, // We need this to update the library state
  showNotification // For showing notifications after deletion
}) => {
  const [activeTab, setActiveTab] = useState('saved-songs');
  
  // Debug the library data on mount
  useEffect(() => {
    console.log("Library Data in Library Section:", libraryData);
  }, [libraryData]);

  // Delete song from library
  const deleteSong = async (song) => {
    try {
      // 1. First check if there are other songs pointing to the same file path
      const duplicates = libraryData.songs.filter(s => 
        s.id !== song.id && // Not the same song
        s.path === song.path && // Same file path
        song.path // Make sure path exists
      );
      
      const hasOtherReferences = duplicates.length > 0;
      
      // 2. Only delete the actual file if no other songs reference it
      if (song.path && !hasOtherReferences) {
        try {
          // Use the Electron API to delete the file
          await window.api.deleteFile(song.path);
          console.log(`File deleted successfully: ${song.path}`);
        } catch (error) {
          console.error(`Error deleting file: ${error.message}`);
          showNotification(`Error deleting file: ${error.message}`, 'error');
        }
      } else if (hasOtherReferences) {
        console.log(`Skipping file deletion as ${duplicates.length} other entries reference this file`);
      }

      // 2. Remove the song from localStorage regardless of file deletion success
      const updatedSongs = libraryData.songs.filter(s => s.id !== song.id);
      
      // 3. Check if we need to update album and artist data
      let updatedAlbums = [...libraryData.albums];
      let updatedArtists = [...libraryData.artists];
      
      // If this was the last song from an album, consider removing the album
      if (song.album) {
        const albumSongs = updatedSongs.filter(s => 
          s.album?.toLowerCase() === song.album.toLowerCase() && 
          s.artist?.toLowerCase() === song.artist?.toLowerCase()
        );
        
        if (albumSongs.length === 0) {
          // This was the last song from this album, so remove the album
          updatedAlbums = updatedAlbums.filter(a => 
            !(a.name.toLowerCase() === song.album.toLowerCase() && 
              a.artist.toLowerCase() === song.artist.toLowerCase())
          );
        }
      }
      
      // If this was the last song from an artist, consider removing the artist
      if (song.artist) {
        const artistSongs = updatedSongs.filter(s => 
          s.artist?.toLowerCase() === song.artist.toLowerCase()
        );
        
        if (artistSongs.length === 0) {
          // This was the last song from this artist, so remove the artist
          updatedArtists = updatedArtists.filter(a => 
            a.name.toLowerCase() !== song.artist.toLowerCase()
          );
        }
      }
      
      // 4. Create the updated library data
      const updatedLibraryData = {
        songs: updatedSongs,
        albums: updatedAlbums,
        artists: updatedArtists
      };
      
      // 5. Save to localStorage
      localStorage.setItem('yarnball_library', JSON.stringify(updatedLibraryData));
      
      // 6. Update the app state
      setLibraryData(updatedLibraryData);
      
      // 7. Show success notification
      showNotification(`Removed "${song.name}" from your library`, 'success');
      
    } catch (error) {
      console.error('Error deleting song:', error);
      showNotification(`Error removing song: ${error.message}`, 'error');
    }
  };

  return (
    <div id="library-section" className={`content-section ${activeSection === 'library' ? 'active' : ''}`}>
      <div className="flex items-center mb-5">
        <h2 className="text-2xl font-bold mr-4">your library</h2>
        <div className="flex gap-2">
          <button 
            className={`py-2 px-4 rounded-full text-sm ${activeTab === 'saved-songs' ? 'bg-primary text-white' : 'bg-accent text-muted-foreground'}`}
            onClick={() => setActiveTab('saved-songs')}
          >
            saved songs ({libraryData.songs?.length || 0})
          </button>
          <button 
            className={`py-2 px-4 rounded-full text-sm ${activeTab === 'downloaded-albums' ? 'bg-primary text-white' : 'bg-accent text-muted-foreground'}`}
            onClick={() => setActiveTab('downloaded-albums')}
          >
            albums ({libraryData.albums?.length || 0})
          </button>
          <button 
            className={`py-2 px-4 rounded-full text-sm ${activeTab === 'artists' ? 'bg-primary text-white' : 'bg-accent text-muted-foreground'}`}
            onClick={() => setActiveTab('artists')}
          >
            artists ({libraryData.artists?.length || 0})
          </button>
        </div>
      </div>
      
      <div className={`library-content ${activeTab === 'saved-songs' ? 'active' : ''}`}>
        {libraryData.songs && libraryData.songs.length > 0 ? (
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
                  key={song.id || index}
                  song={{ ...song, number: index + 1 }}
                  includeAlbum={true}
                  context="library"
                  onPlay={() => playSong(song, "library")}
                  onDelete={() => deleteSong(song)}
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
      </div>
      
      <div className={`library-content ${activeTab === 'downloaded-albums' ? 'active' : ''}`}>
        {libraryData.albums && libraryData.albums.length > 0 ? (
          <div id="albums-grid" className="albums-grid">
            {libraryData.albums.map((album, index) => (
              <AlbumCard
                key={album.id || index}
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
      </div>
      
      <div className={`library-content ${activeTab === 'artists' ? 'active' : ''}`}>
        {libraryData.artists && libraryData.artists.length > 0 ? (
          <div id="artists-grid" className="artists-grid">
            {libraryData.artists.map((artist, index) => (
              <ArtistCard
                key={artist.id || index}
                artist={artist}
                onClick={() => loadArtistView(artist)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <User size={48} />
            <p>your favorite artists will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarySection;