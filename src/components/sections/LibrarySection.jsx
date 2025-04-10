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
  activeSection
}) => {
  const [activeTab, setActiveTab] = useState('saved-songs');
  
  // Debug the library data on mount
  useEffect(() => {
    console.log("Library Data in Library Section:", libraryData);
  }, [libraryData]);

  return (
    <div id="library-section" className={`content-section ${activeSection === 'library' ? 'active' : ''}`}>
      <h2 style={{ textTransform: 'lowercase' }}>Your Library</h2>
      
      {/* Using styled tab buttons */}
      <div className="library-tabs">
        <button 
          className={`py-2 px-4 rounded-full text-sm ${activeTab === 'saved-songs' ? 'bg-primary text-white' : 'bg-accent text-muted-foreground'}`}
          onClick={() => setActiveTab('saved-songs')}
        >
          Saved Songs ({libraryData.songs?.length || 0})
        </button>
        <button 
          className={`py-2 px-4 rounded-full text-sm ${activeTab === 'downloaded-albums' ? 'bg-primary text-white' : 'bg-accent text-muted-foreground'}`}
          onClick={() => setActiveTab('downloaded-albums')}
        >
          Albums ({libraryData.albums?.length || 0})
        </button>
        <button 
          className={`py-2 px-4 rounded-full text-sm ${activeTab === 'artists' ? 'bg-primary text-white' : 'bg-accent text-muted-foreground'}`}
          onClick={() => setActiveTab('artists')}
        >
          Artists ({libraryData.artists?.length || 0})
        </button>
      </div>
      
      <div className={`library-content ${activeTab === 'saved-songs' ? 'active' : ''}`}>
        <div className="song-list-headers">
          <div className="song-number">#</div>
          <div className="song-info">Title</div>
          <div className="song-album">Album</div>
          <div className="song-duration">Duration</div>
          <div className="song-actions"></div>
        </div>
        
        <div id="saved-songs-list" className="song-list">
          {libraryData.songs && libraryData.songs.length > 0 ? (
            libraryData.songs.map((song, index) => (
              <SongItem
                key={song.id || index}
                song={{ ...song, number: index + 1 }}
                includeAlbum={true}
                context="library"
                onPlay={() => playSong(song, "library")}
                onDownload={() => downloadSong(song)}
              />
            ))
          ) : (
            <div className="empty-state">
              <Music size={48} />
              <p style={{ textTransform: 'lowercase' }}>Your saved songs will appear here</p>
            </div>
          )}
        </div>
      </div>
      
      <div className={`library-content ${activeTab === 'downloaded-albums' ? 'active' : ''}`}>
        <div id="albums-grid" className="albums-grid">
          {libraryData.albums && libraryData.albums.length > 0 ? (
            libraryData.albums.map((album, index) => (
              <AlbumCard
                key={album.id || index}
                album={album}
                onClick={() => loadAlbumView(album)}
              />
            ))
          ) : (
            <div className="empty-state">
              <Disc size={48} />
              <p style={{ textTransform: 'lowercase' }}>Your albums will appear here</p>
            </div>
          )}
        </div>
      </div>
      
      <div className={`library-content ${activeTab === 'artists' ? 'active' : ''}`}>
        <div id="artists-grid" className="artists-grid">
          {libraryData.artists && libraryData.artists.length > 0 ? (
            libraryData.artists.map((artist, index) => (
              <ArtistCard
                key={artist.id || index}
                artist={artist}
                onClick={() => loadArtistView(artist)}
              />
            ))
          ) : (
            <div className="empty-state">
              <User size={48} />
              <p style={{ textTransform: 'lowercase' }}>Your favorite artists will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibrarySection;