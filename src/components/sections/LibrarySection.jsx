import React, { useState, useEffect } from 'react';
import { Music, Disc, User } from 'lucide-react';

// A simpler version that directly renders content without complex components
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

  // Handle tab change
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Format time helper function
  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div id="library-section" className={`content-section ${activeSection === 'library' ? 'active' : ''}`}>
      <h2 style={{ textTransform: 'lowercase' }}>Your Library</h2>
      
      {/* Simple Tab Navigation */}
      <div className="library-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={`library-tab ${activeTab === 'saved-songs' ? 'active' : ''}`}
          onClick={() => handleTabChange('saved-songs')}
          style={{
            padding: '8px 15px',
            borderRadius: '20px',
            background: activeTab === 'saved-songs' ? '#1DB954' : '#333',
            color: activeTab === 'saved-songs' ? 'white' : '#888',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Saved Songs ({libraryData.songs?.length || 0})
        </button>
        <button 
          className={`library-tab ${activeTab === 'downloaded-albums' ? 'active' : ''}`}
          onClick={() => handleTabChange('downloaded-albums')}
          style={{
            padding: '8px 15px',
            borderRadius: '20px',
            background: activeTab === 'downloaded-albums' ? '#1DB954' : '#333',
            color: activeTab === 'downloaded-albums' ? 'white' : '#888',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Albums ({libraryData.albums?.length || 0})
        </button>
        <button 
          className={`library-tab ${activeTab === 'artists' ? 'active' : ''}`}
          onClick={() => handleTabChange('artists')}
          style={{
            padding: '8px 15px',
            borderRadius: '20px',
            background: activeTab === 'artists' ? '#1DB954' : '#333',
            color: activeTab === 'artists' ? 'white' : '#888',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Artists ({libraryData.artists?.length || 0})
        </button>
      </div>
      
      {/* Saved Songs Tab Content */}
      <div style={{ display: activeTab === 'saved-songs' ? 'block' : 'none' }}>
        <div className="song-list-headers" style={{
          display: 'grid',
          gridTemplateColumns: '50px 1fr 1fr 120px 80px',
          gap: '10px',
          padding: '10px 20px',
          borderBottom: '1px solid #eee',
          fontWeight: 'bold',
          color: '#888',
          fontSize: '14px'
        }}>
          <div className="song-number">#</div>
          <div className="song-info">Title</div>
          <div className="song-album">Album</div>
          <div className="song-duration">Duration</div>
          <div className="song-actions"></div>
        </div>
        
        <div id="saved-songs-list" className="song-list" style={{ marginTop: '10px' }}>
          {libraryData.songs && libraryData.songs.length > 0 ? (
            libraryData.songs.map((song, index) => (
              <div key={`song-${song.id || index}`} className="song-item" style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 1fr 120px 80px',
                gap: '10px',
                padding: '12px 20px',
                borderRadius: '4px',
                marginBottom: '4px',
                backgroundColor: '#333',
                alignItems: 'center'
              }}>
                <div className="song-number" style={{ color: '#888', fontSize: '14px' }}>{index + 1}</div>
                <div className="song-info" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="song-title" style={{ fontWeight: '500' }}>{song.name || 'Unknown'}</div>
                  <div className="song-artist" style={{ color: '#888', fontSize: '14px' }}>{song.artist || 'Unknown'}</div>
                </div>
                <div className="song-album" style={{ color: '#888', fontSize: '14px' }}>{song.album || 'Unknown Album'}</div>
                <div className="song-duration" style={{ color: '#888', fontSize: '14px' }}>{song.duration ? formatTime(song.duration) : '--:--'}</div>
                <div className="song-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="song-play-btn" style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }} onClick={() => playSong(song, "library")}>▶️</button>
                  <button className="song-download-btn" style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }} onClick={() => downloadSong(song)}>⬇️</button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#888',
              textAlign: 'center'
            }}>
              <Music size={48} style={{ marginBottom: '15px', opacity: '0.5' }} />
              <p style={{ textTransform: 'lowercase' }}>Your saved songs will appear here</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Albums Tab Content - simplified */}
      <div style={{ display: activeTab === 'downloaded-albums' ? 'block' : 'none' }}>
        <div id="albums-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {libraryData.albums && libraryData.albums.length > 0 ? (
            libraryData.albums.map((album, index) => (
              <div key={`album-${album.id || index}`} className="album-card" style={{
                backgroundColor: '#333',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer'
              }} onClick={() => loadAlbumView(album)}>
                <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#555' }}></div>
                <div style={{ padding: '15px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {album.name || 'Unknown Album'}
                  </div>
                  <div style={{ color: '#888', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {album.artist || 'Unknown Artist'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#888',
              textAlign: 'center'
            }}>
              <Disc size={48} style={{ marginBottom: '15px', opacity: '0.5' }} />
              <p style={{ textTransform: 'lowercase' }}>Your albums will appear here</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Artists Tab Content - simplified */}
      <div style={{ display: activeTab === 'artists' ? 'block' : 'none' }}>
        <div id="artists-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {libraryData.artists && libraryData.artists.length > 0 ? (
            libraryData.artists.map((artist, index) => (
              <div key={`artist-${artist.id || index}`} className="artist-card" style={{
                backgroundColor: '#333',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer'
              }} onClick={() => loadArtistView(artist)}>
                <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#555' }}></div>
                <div style={{ padding: '15px' }}>
                  <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {artist.name || 'Unknown Artist'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#888',
              textAlign: 'center'
            }}>
              <User size={48} style={{ marginBottom: '15px', opacity: '0.5' }} />
              <p style={{ textTransform: 'lowercase' }}>Your favorite artists will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibrarySection;