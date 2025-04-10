import React from 'react';
import { Heart } from 'lucide-react';

import ArtistCard from '../common/ArtistCard';

const FavoritesSection = ({
  favoritesData,
  toggleFavoriteArtist,
  loadArtistView,
  activeSection
}) => {
  return (
    <div id="favorites-section" className={`content-section ${activeSection === 'favorites' ? 'active' : ''}`}>
      <h2>your favorites</h2>
      
      <div className="favorites-container">
        <div id="favorite-artists-grid" className="artists-grid">
          {favoritesData.artists.length > 0 ? (
            favoritesData.artists.map(artist => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                isFavorite={true}
                onClick={() => loadArtistView(artist)}
                onFavoriteToggle={toggleFavoriteArtist}
              />
            ))
          ) : (
            <div className="empty-state">
              <Heart size={48} />
              <p>artists you've hearted will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesSection;