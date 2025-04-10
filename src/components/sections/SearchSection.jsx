import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';

import SongItem from '../common/SongItem';
import AlbumCard from '../common/AlbumCard';
import ArtistCard from '../common/ArtistCard';

const SearchSection = ({
  setSearchResultsData,
  searchResultsData,
  loadArtistView,
  loadAlbumView,
  playSong,
  downloadSong,
  lastfmInitialized,
  switchSection,
  showNotification,
  activeSection,
  libraryData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');

  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchStatus('Please enter a search query');
      return;
    }
    
    if (!lastfmInitialized) {
      setSearchStatus('Please initialize Last.fm API first');
      switchSection('settings');
      return;
    }
    
    setIsSearching(true);
    setSearchStatus('Searching...');
    
    try {
      // Reset search results
      const initialResults = { songs: [], albums: [], artists: [] };
      setSearchResultsData(initialResults);
      
      // Get tracks
      const tracks = await window.api.searchLastFm(searchQuery);
      const formattedTracks = tracks.map(track => {
        // Check if the track is already in the library and get its path
        const librarySong = libraryData.songs.find(s =>
          s.name.toLowerCase() === track.name.toLowerCase() &&
          s.artist.toLowerCase() === track.artist.toLowerCase()
        );
        const isDownloaded = !!librarySong;
        const path = librarySong ? librarySong.path : null; // Get the path if downloaded

        return {
          id: track.mbid || generateId(),
          name: track.name,
          artist: track.artist,
          listeners: track.listeners,
          album: null, // Search results don't reliably provide album info for tracks
          duration: null, // Search results don't reliably provide duration
          image: track.image && track.image.length > 0 ? track.image[2]['#text'] : null,
          isDownloaded, // Add downloaded flag
          path // Add the path property
        };
      });
      
      // Only search for albums and artists if the query isn't too specific
      let formattedAlbums = [];
      let formattedArtists = [];
      
      if (searchQuery.split(' ').length < 3) {
        // Get albums
        const albums = await window.api.searchLastFmAlbums(searchQuery);
        formattedAlbums = albums.map(album => ({
          id: album.mbid || generateId(),
          name: album.name,
          artist: album.artist,
          image: album.image && album.image.length > 0 ? album.image[2]['#text'] : null
        }));
        
        // Get artists
        const artists = await window.api.searchLastFmArtists(searchQuery);
        formattedArtists = artists.map(artist => ({
          id: artist.mbid || generateId(),
          name: artist.name,
          listeners: artist.listeners,
          image: artist.image && artist.image.length > 0 ? artist.image[2]['#text'] : null
        }));
      }
      
      const results = {
        songs: formattedTracks,
        albums: formattedAlbums,
        artists: formattedArtists
      };
      
      setSearchResultsData(results);
      
      // Update status
      const totalResults = formattedTracks.length + formattedAlbums.length + formattedArtists.length;
      setSearchStatus(`Found ${totalResults} results`);
    } catch (error) {
      setSearchStatus(`Error: ${error}`);
      showNotification(`Search error: ${error}`, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Helper function to generate ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Get filtered results based on current filter
  const getFilteredResults = () => {
    if (currentFilter === 'all') {
      return searchResultsData;
    }
    
    return {
      songs: currentFilter === 'songs' ? searchResultsData.songs : [],
      albums: currentFilter === 'albums' ? searchResultsData.albums : [],
      artists: currentFilter === 'artists' ? searchResultsData.artists : []
    };
  };

  const filteredResults = getFilteredResults();

  return (
    <div id="search-section" className={`content-section ${activeSection === 'search' ? 'active' : ''}`}>
      <div className="search-container">
        {/* Updated search bar container with max-width and relative positioning */}
        <div className="search-input-container relative max-w-3xl mx-auto">
          <Input
            type="text"
            id="global-search"
            placeholder="search for songs, albums, or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pr-10" // Add padding to the right for the search icon
          />
          {/* Position search button absolutely inside the input */}
          <Button 
            id="global-search-btn" 
            onClick={handleSearch} 
            disabled={isSearching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2"
            variant="ghost"
            size="sm"
          >
            <Search size={18} />
          </Button>
        </div>

        {/* Center the filter buttons */}
        <div className="search-filters flex justify-center mt-4">
          <Button
            className={`search-filter ${currentFilter === 'all' ? 'active' : ''}`}
            data-filter="all"
            onClick={() => setCurrentFilter('all')}
          >
            all
          </Button>
          <Button
            className={`search-filter ${currentFilter === 'songs' ? 'active' : ''}`}
            data-filter="songs"
            onClick={() => setCurrentFilter('songs')}
          >
            songs
          </Button>
          <Button
            className={`search-filter ${currentFilter === 'albums' ? 'active' : ''}`}
            data-filter="albums"
            onClick={() => setCurrentFilter('albums')}
          >
            albums
          </Button>
          <Button
            className={`search-filter ${currentFilter === 'artists' ? 'active' : ''}`}
            data-filter="artists"
            onClick={() => setCurrentFilter('artists')}
          >
            artists
          </Button>
        </div>
      </div>

      <div className="search-results-container mt-8">
        {searchStatus && (
          <Alert className="mb-6">
            <AlertDescription>{searchStatus}</AlertDescription>
          </Alert>
        )}

        {isSearching ? (
          <div className="loading">searching last.fm...</div>
        ) : (
          <div id="search-results" className="space-y-10">
            {/* Songs Section */}
            {filteredResults.songs && filteredResults.songs.length > 0 && (
              <div className="results-section songs-section">
                <h3 className="text-lg font-bold mb-4">songs</h3>
                <div className="song-list">
                  {filteredResults.songs.map(song => (
                    <SongItem
                      key={song.id}
                      song={song}
                      context="search"
                      onPlay={() => playSong(song, "search")}
                      onDownload={() => downloadSong(song)}
                      isDownloaded={song.isDownloaded}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Albums Section */}
            {filteredResults.albums && filteredResults.albums.length > 0 && (
              <div className="results-section albums-section">
                <h3 className="text-lg font-bold mb-4">albums</h3>
                <div className="albums-grid">
                  {filteredResults.albums.map(album => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      onClick={() => loadAlbumView(album)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Artists Section */}
            {filteredResults.artists && filteredResults.artists.length > 0 && (
              <div className="results-section artists-section">
                <h3 className="text-lg font-bold mb-4">artists</h3>
                <div className="artists-grid">
                  {filteredResults.artists.map(artist => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      onClick={() => loadArtistView(artist)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isSearching && 
             filteredResults.songs.length === 0 && 
             filteredResults.albums.length === 0 && 
             filteredResults.artists.length === 0 && (
              <div className="empty-state">
                <Search size={48} />
                <p>no results found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSection;