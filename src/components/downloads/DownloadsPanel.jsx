import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '../../lib/utils';
import './DownloadsPanel.css'; // Import the component-specific CSS

const DownloadsPanel = ({ downloads }) => {
  const [minimized, setMinimized] = useState(true);

  const toggleMinimize = () => {
    setMinimized(!minimized);
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
              <div className={cn(
                "download-status",
                download.status === 'Completed' && "success",
                download.status === 'Failed' && "error"
              )}>
                {download.status}
              </div>
              {/* Action buttons for in-progress downloads */}
              {download.status !== 'Completed' && download.status !== 'Failed' && (
                <div className="download-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginLeft: '8px' }}>
                  <Button
                    id={`cancel-download-${download.id}`}
                    variant="ghost"
                    size="lg"
                    className="cancel-btn"
                    title="Cancel download"
                    style={{ fontSize: '1.5rem', width: '2.5rem', height: '2.5rem' }}
                    onClick={() => download.onCancel && download.onCancel(download)}
                  >
                    &#10005;
                  </Button>
                  <Button
                    id={`retry-download-${download.id}`}
                    variant="ghost"
                    size="lg"
                    className="retry-btn"
                    title="Try next peer"
                    style={{ fontSize: '1.5rem', width: '2.5rem', height: '2.5rem' }}
                    onClick={() => download.onRetry && download.onRetry(download)}
                  >
                    &#x21bb;
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DownloadsPanel;
