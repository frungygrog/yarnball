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

  return (
    <div className={cn("downloads-panel", minimized && "minimized")}>
      <div className="panel-header">
        <h3 style={{ textTransform: 'lowercase' }}>Downloads</h3>
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
            <p style={{ textTransform: 'lowercase' }}>No active downloads</p>
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
              <div className={cn(
                "download-status",
                download.status === 'Completed' && "success",
                download.status === 'Failed' && "error"
              )}>
                {download.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DownloadsPanel;