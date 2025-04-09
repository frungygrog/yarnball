import React, { useState } from 'react';
import { Music, Disc, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import SongItem from '../common/SongItem';
import AlbumCard from '../common/AlbumCard';
import ArtistCard from '../common/ArtistCard';

const LibrarySection = ({ 
  libraryData,
  loadAlbumView,
  loadArtistView,
  playSong,
  downloadSong
}) => {
  const [activeTab, setActiveTab] = useState('saved-songs');

  return (
    <div id="library-section" className="content-section">
      <h2 style={{ textTransform: 'lowercase' }}>Your Library</h2>
      
      <Tabs 
        defaultValue="saved-songs" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="library-tabs"
      >
        <TabsList>
          <TabsTrigger value="saved-songs">Saved Songs</TabsTrigger>
          <TabsTrigger value="downloaded-albums">Albums</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
        </TabsList>
        
        <TabsContent value="saved-songs" className="library-content">
          <div className="song-list-headers">
            <div className="song-number">#</div>
            <div className="song-info">Title</div>
            <div className="song-album">Album</div>
            <div className="song-duration">Duration</div>
            <div className="song-actions"></div>
          </div>
          
          <div id="saved-songs-list" className="song-list">
            {libraryData.songs.length > 0 ? (
              libraryData.songs.map((song, index) => (
                <SongItem
                  key={song.id}
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
        </TabsContent>
        
        <TabsContent value="downloaded-albums" className="library-content">
          <div id="albums-grid" className="albums-grid">
            {libraryData.albums.length > 0 ? (
              libraryData.albums.map(album => (
                <AlbumCard
                  key={album.id}
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
        </TabsContent>
        
        <TabsContent value="artists" className="library-content">
          <div id="artists-grid" className="artists-grid">
            {libraryData.artists.length > 0 ? (
              libraryData.artists.map(artist => (
                <ArtistCard
                  key={artist.id}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibrarySection;