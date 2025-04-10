import React from 'react';
import { Check } from 'lucide-react';

const AlbumCard = ({ album, onClick, isDownloaded = false }) => {
  return (
    <div className="album-card" data-id={album.id} onClick={onClick}>
      <div className="relative">
        <img 
          src={album.image || '/api/placeholder/180/180'} 
          alt={album.name} 
          className="album-image" 
        />
        
        {/* Show a badge for downloaded albums */}
        {isDownloaded && (
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1" title="Downloaded">
            <Check size={14} />
          </div>
        )}
      </div>
      
      <div className="album-info">
        <div className="album-title flex items-center">
          <span className="truncate">{album.name}</span>
          {isDownloaded && (
            <span className="ml-1 text-green-500 flex-shrink-0">
              <Check size={12} />
            </span>
          )}
        </div>
        <div className="album-artist">{album.artist}</div>
      </div>
    </div>
  );
};

export default AlbumCard;