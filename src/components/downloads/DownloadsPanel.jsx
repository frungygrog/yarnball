import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '../../lib/utils';

const DownloadsPanel = ({ downloads }) => {
  const [minimized, setMinimized] = useState(true);

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  // Helper function to format download speed
  const formatSpeed = (speed) => {
    if (!speed || speed === 0) return '';
    
    if (speed >= 1024) {
      return `${(speed / 1024).toFixed(1)} MB/s`;
    }
    return `${speed} KB/s`;
  };

  return (
    <div className={cn("downloads-panel", minimized && "minimized")}>
      <div className="panel-header">
        <h3>downloads</h3>
        <Button 
          id="minimize-downloads" 
          variant="ghost" 
          size="icon" 
          className="minimize-btn"
          onClick={toggleMinimize}
        >
          {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
      <div className="downloads-list" id="downloads-container">
        {downloads.length === 0 ? (
          <div className="empty-downloads">
            <p>no active downloads.</p>
          </div>
        ) : (
          // Add downloads in reverse order (newest first)
          [...downloads].reverse().map(download => (
            <div 
              key={download.id} 
              className="download-item" 
              data-id={download.id}
            >
              <div className="download-info">
                <div className="download-title">{download.name}</div>
                <div className="download-artist">{download.artist}</div>
              </div>
              <Progress 
                className="download-progress-container"
                value={download.progress}
              />
              <div className="download-details">
                <div className={cn(
                  "download-status",
                  download.status === 'Completed' && "success",
                  download.status === 'Failed' && "error"
                )}>
                  {download.status}
                </div>
                {/* Display speed if available and downloading */}
                {download.speed > 0 && download.status.includes('Downloading') && (
                  <div className="download-speed">
                    {formatSpeed(download.speed)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DownloadsPanel;