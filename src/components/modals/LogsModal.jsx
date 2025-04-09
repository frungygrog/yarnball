import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const LogsModal = ({ onClose }) => {
  const [logs, setLogs] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = async () => {
    setIsLoading(true);
    
    try {
      const logsData = await window.api.getLogs();
      setLogs(logsData);
      
      // Scroll to bottom
      const logsContent = document.getElementById('logs-content');
      if (logsContent) {
        logsContent.scrollTop = logsContent.scrollHeight;
      }
    } catch (error) {
      setLogs(`Error loading logs: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="logs-modal" size="lg">
        <DialogHeader>
          <DialogTitle style={{ textTransform: 'lowercase' }}>Debug Logs</DialogTitle>
          <Button
            variant="ghost" 
            size="icon" 
            className="close-modal"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </DialogHeader>
        
        <div className="modal-body">
          <Button 
            id="refresh-logs" 
            onClick={refreshLogs}
            disabled={isLoading}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh Logs
          </Button>
          
          <div className="logs-container">
            <pre id="logs-content">{logs}</pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogsModal;