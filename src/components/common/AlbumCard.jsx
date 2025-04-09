import React from 'react';

const AlbumCard = ({ album, onClick }) => {
  return (
    <div className="album-card" data-id={album.id} onClick={onClick}>
      <img 
        src={album.image || '/api/placeholder/180/180'} 
        alt={album.name} 
        className="album-image" 
      />
      <div className="album-info">
        <div className="album-title">{album.name}</div>
        <div className="album-artist">{album.artist}</div>
      </div>
    </div>
  );
};

export default AlbumCard;