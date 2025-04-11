import React from 'react';
import { Check } from 'lucide-react';

function getAlbumImageSrc(image) {
  if (typeof image === 'string' && image.startsWith('/')) {
    return `localfile://${image}`;
  }
  return image || '/api/placeholder/180/180';
}

const AlbumCard = ({ album, onClick, isDownloaded = false }) => {
  return (
    // Added cursor-pointer
    <div className="album-card flex flex-col cursor-pointer" data-id={album?.id} onClick={onClick}> 
      <div className="relative">
        <img 
          src={getAlbumImageSrc(album?.image)} 
          alt={album?.name || 'Unknown Album'} 
          className="album-image w-full aspect-square object-cover rounded-md" // Added rounded corners
        />
        
        {/* Badge for downloaded albums */}
        {isDownloaded && (
          <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1 shadow-md" title="Downloaded">
            <Check size={12} strokeWidth={3}/> {/* Slightly bolder check */}
          </div>
        )}
      </div>
      
      {/* Info section below image */}
      <div className="album-info p-2 flex flex-col"> {/* Re-added padding */}
        {/* Album Title - Removed truncate, allow wrapping */}
        <div 
          className="album-title text-sm font-medium" // Removed mb-0.5
          title={album?.name || 'Unknown Album'}
        >
          {album?.name || 'Unknown Album'}
        </div>
        {/* Artist Name - Smaller text, below title, removed margin */}
        <div 
          className="album-artist text-xs text-muted-foreground truncate leading-tight" // Re-added leading-tight
          title={album?.artist || 'Unknown Artist'}
        >
          {album?.artist || 'Unknown Artist'}
        </div>
      </div>
    </div>
  );
};

export default AlbumCard;
