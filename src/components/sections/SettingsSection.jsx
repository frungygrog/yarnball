import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, File, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SettingsSection = ({
  connectToSoulseek,
  initializeLastFm,
  setShowLogsModal,
  slskConnected,
  lastfmInitialized
}) => {
  // Form state
  const [username, setUsername] = useState('yarnball');
  const [password, setPassword] = useState('yarnball');
  const [lastfmKey, setLastfmKey] = useState('0ef47b7d4d7a5bd325bb2646837b4908');
  const [downloadPath, setDownloadPath] = useState('');
  const [organizeFiles, setOrganizeFiles] = useState(true);
  const [preferredFormat, setPreferredFormat] = useState('any');
  
  // Status messages
  const [connectionStatus, setConnectionStatus] = useState('');
  const [lastfmStatus, setLastfmStatus] = useState('');

  // Load saved settings on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('slsk_username');
    const savedPassword = localStorage.getItem('slsk_password');
    const savedApiKey = localStorage.getItem('lastfm_api_key');
    
    if (savedUsername) setUsername(savedUsername);
    if (savedPassword) setPassword(savedPassword);
    if (savedApiKey) setLastfmKey(savedApiKey);
    
    // Get download path
    window.api.getDownloadPath()
      .then(path => setDownloadPath(path))
      .catch(err => console.error('Error getting download path:', err));
  }, []);

  // Handle Soulseek connection
  const handleConnectSoulseek = async () => {
    if (!username || !password) {
      setConnectionStatus('Please enter both username and password');
      return;
    }
    
    setConnectionStatus('Connecting...');
    
    const success = await connectToSoulseek(username, password);
    
    if (success) {
      setConnectionStatus('Connected successfully!');
    } else {
      setConnectionStatus('Connection failed.');
    }
  };

  // Handle Last.fm API initialization
  const handleInitLastFm = async () => {
    if (!lastfmKey) {
      setLastfmStatus('Please enter a Last.fm API key');
      return;
    }
    
    setLastfmStatus('Initializing Last.fm API...');
    
    const success = await initializeLastFm(lastfmKey);
    
    if (success) {
      setLastfmStatus('Last.fm API initialized successfully');
    } else {
      setLastfmStatus('Last.fm API initialization failed.');
    }
  };

  // Handle download path selection
  const handleChangeDownloadPath = async () => {
    try {
      const path = await window.api.selectDownloadPath();
      
      if (path) {
        setDownloadPath(path);
      }
    } catch (error) {
      console.error('Error changing download path:', error);
    }
  };

  return (
    <div id="settings-section" className="content-section">
      <h2 style={{ textTransform: 'lowercase' }}>Settings</h2>
      
      <div className="settings-container">
        {/* Soulseek Connection */}
        <div className="settings-group">
          <h3 style={{ textTransform: 'lowercase' }}>Soulseek Connection</h3>
          
          <div className="form-group">
            <Label htmlFor="username" style={{ textTransform: 'lowercase' }}>Username:</Label>
            <Input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <Label htmlFor="password" style={{ textTransform: 'lowercase' }}>Password:</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <Button 
            id="connect-btn" 
            onClick={handleConnectSoulseek}
          >
            {slskConnected ? (
              <>
                <RefreshCw size={16} className="mr-2" />
                Reconnect
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Connect
              </>
            )}
          </Button>
          
          {connectionStatus && (
            <Alert className="mt-4">
              <AlertDescription>{connectionStatus}</AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Last.fm API Key */}
        <div className="settings-group">
          <h3 style={{ textTransform: 'lowercase' }}>Last.fm API Key</h3>
          
          <div className="form-group">
            <Input
              type="text"
              id="lastfm-key"
              value={lastfmKey}
              onChange={(e) => setLastfmKey(e.target.value)}
            />
            
            <Button 
              id="init-lastfm-btn" 
              onClick={handleInitLastFm}
              className="mt-2"
            >
              Initialize Last.fm API
            </Button>
            
            {lastfmStatus && (
              <Alert className="mt-4">
                <AlertDescription>{lastfmStatus}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        {/* Download Settings */}
        <div className="settings-group">
          <h3 style={{ textTransform: 'lowercase' }}>Download Settings</h3>
          
          <div className="form-group">
            <Label htmlFor="download-path" style={{ textTransform: 'lowercase' }}>Download Path:</Label>
            <div className="flex">
              <Input
                type="text"
                id="download-path"
                value={downloadPath}
                disabled
                className="mr-2"
              />
              <Button 
                id="change-path-btn"
                onClick={handleChangeDownloadPath}
              >
                <FolderOpen size={16} />
              </Button>
            </div>
          </div>
          
          <div className="form-group">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="organize-files" 
                checked={organizeFiles} 
                onCheckedChange={setOrganizeFiles} 
              />
              <Label htmlFor="organize-files">
                Organize files by Artist/Album
              </Label>
            </div>
          </div>
          
          <div className="form-group">
            <Label htmlFor="preferred-format" style={{ textTransform: 'lowercase' }}>Preferred Format:</Label>
            <Select 
              id="preferred-format" 
              value={preferredFormat} 
              onValueChange={setPreferredFormat}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any (Best Available)</SelectItem>
                <SelectItem value="flac">FLAC</SelectItem>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Debug Logs */}
        <div className="settings-group">
          <h3 style={{ textTransform: 'lowercase' }}>Debug Logs</h3>
          <Button 
            id="open-logs-btn"
            onClick={() => setShowLogsModal(true)}
          >
            <File size={16} className="mr-2" />
            View Logs
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;