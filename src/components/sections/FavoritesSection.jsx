import React from 'react';
import { Heart } from 'lucide-react';

import ArtistCard from '../common/ArtistCard';

const FavoritesSection = ({
  favoritesData,
  toggleFavoriteArtist,
  loadArtistView,
  activeSection
}) => {
  // Handle error gracefully if toggleFavoriteArtist is not provided
  const handleToggleFavorite = (artist) => {
    if (typeof toggleFavoriteArtist === 'function') {
      toggleFavoriteArtist(artist);
    } else {
      console.error('toggleFavoriteArtist function is not defined');
    }
  };

  return (
    <div id="favorites-section" className={`content-section ${activeSection === 'favorites' ? 'active' : ''}`}>
      <h2 className="text-2xl font-bold mb-5">your favorites</h2>
      
      <div className="favorites-container w-full h-full">
        {favoritesData.artists && favoritesData.artists.length > 0 ? (
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
    </div>
  );
};

export default FavoritesSection;