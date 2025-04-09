import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ArtistCard = ({ artist, isFavorite = false, onClick, onFavoriteToggle }) => {
  return (
    <div className="artist-card" data-id={artist.id} onClick={onClick}>
      <img 
        src={artist.image || '/api/placeholder/180/180'} 
        alt={artist.name} 
        className="artist-image" 
      />
      <div className="artist-info">
        <div className="artist-name">{artist.name}</div>
        {onFavoriteToggle && (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`heart-btn ${isFavorite ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(artist);
            }}
          >
            <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ArtistCard;