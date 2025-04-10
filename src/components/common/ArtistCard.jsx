import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper function to format large numbers (scrobbles/listeners)
const formatCount = (count) => {
  const num = parseInt(count);
  if (isNaN(num)) return '';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'; 
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K'; 
  }
  return num.toLocaleString(); 
};


const ArtistCard = ({ artist, isFavorite = false, onClick, onFavoriteToggle }) => {
  // Log the received artist data for debugging
  // console.log("ArtistCard received:", artist); 

  // Determine which count to display (prefer playcount, fallback to listeners)
  const displayCount = artist?.playcount || artist?.listeners;
  const countLabel = artist?.playcount ? 'scrobbles' : 'listeners'; // Use scrobbles if playcount exists
  const fullCountTitle = displayCount ? `${parseInt(displayCount).toLocaleString()} ${countLabel}` : "";

  return (
    // Added cursor-pointer for better UX
    <div className="artist-card flex flex-col cursor-pointer" data-id={artist?.id} onClick={onClick}> 
      <div className="relative"> 
        <img 
          src={artist?.image || '/api/placeholder/180/180'} 
          alt={artist?.name || 'Unknown Artist'} 
          className="artist-image w-full aspect-square object-cover rounded-md" // Added rounded corners
        />
         {/* Favorite button positioned over image */}
         {onFavoriteToggle && (
          <div className="absolute top-2 right-2"> 
            <Button 
              variant="ghost" 
              size="icon" 
              className={`heart-btn ${isFavorite ? 'active' : ''} h-7 w-7 p-1 bg-background/70 hover:bg-background/90 rounded-full`} 
              onClick={(e) => {
                e.stopPropagation(); 
                onFavoriteToggle(artist);
              }}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={14} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'} /> 
            </Button>
          </div>
        )}
      </div>
      {/* Info section below image */}
      {/* Removed mt-2, added padding for internal spacing */}
      <div className="artist-info p-2 flex flex-col"> {/* Re-added padding */}
        <div 
          className="artist-name text-sm font-medium truncate" // Removed mb-0.5
          title={artist?.name || 'Unknown Artist'}
        >
          {artist?.name || 'Unknown Artist'}
        </div>
        {/* Display count (scrobbles or listeners) if available */}
        {displayCount && (
          <div 
            // Removed mt-0.5 for tighter spacing
            className="artist-count text-xs text-muted-foreground leading-tight" // Re-added leading-tight
            title={fullCountTitle} 
          >
            {formatCount(displayCount)} {countLabel} 
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistCard;