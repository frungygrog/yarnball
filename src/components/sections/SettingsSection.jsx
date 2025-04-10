import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, File, FolderOpen, Eye, EyeOff, HardDriveDownload } from 'lucide-react';
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
  lastfmInitialized,
  downloadPath,
  organizeFiles,
  preferredFormat,
  updateSettings,
  activeSection
}) => {
  // Form state
  const [username, setUsername] = useState('yarnball');
  const [password, setPassword] = useState('yarnball');
  const [lastfmKey, setLastfmKey] = useState('0ef47b7d4d7a5bd325bb2646837b4908');
  const [localOrganizeFiles, setLocalOrganizeFiles] = useState(organizeFiles);
  const [localPreferredFormat, setLocalPreferredFormat] = useState(preferredFormat);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
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
    
    // Update local state with props
    setLocalOrganizeFiles(organizeFiles);
    setLocalPreferredFormat(preferredFormat);
  }, [organizeFiles, preferredFormat]);

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
        // This would require a prop function to update the download path in the parent
      }
    } catch (error) {
      console.error('Error changing download path:', error);
    }
  };

  // Handle organize files change
  const handleOrganizeFilesChange = (checked) => {
    setLocalOrganizeFiles(checked);
    updateSettings({ organizeFiles: checked });
  };

  // Handle preferred format change
  const handlePreferredFormatChange = (value) => {
    setLocalPreferredFormat(value);
    updateSettings({ preferredFormat: value });
  };

  return (
    <div id="settings-section" className={`content-section ${activeSection === 'settings' ? 'active' : ''}`}>
      <h2 className="text-2xl font-bold mb-6">settings</h2>
      
      <div className="settings-container">
        {/* Soulseek Connection */}
        <div className="settings-group mb-8">
          <h3 className="font-bold">soulseek connection</h3>
          
          <div className="form-group mt-4 mb-4">
            <Label htmlFor="username">username:</Label>
            <div className="w-2/5">
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-group mb-4">
            <Label htmlFor="password">password:</Label>
            <div className="w-2/5">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10" /* Add padding to the right to make room for the icon */
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
          </div>
          
          <Button 
            id="connect-btn" 
            onClick={handleConnectSoulseek}
          >
            {slskConnected ? (
              <>
                <RefreshCw size={16} className="mr-2" />
                reconnect
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                connect
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
        <div className="settings-group mb-8">
          <h3 className="font-bold">last.fm API key</h3>
          
          <div className="form-group mt-4 mb-4">
            <div className="w-2/5">
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  id="lastfm-key"
                  value={lastfmKey}
                  onChange={(e) => setLastfmKey(e.target.value)}
                  className="pr-10" /* Add padding to the right to make room for the icon */
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
            
            <Button 
              id="init-lastfm-btn" 
              onClick={handleInitLastFm}
              className="mt-4"
            >
              <>
                <HardDriveDownload size={16} className="mr-2" />
                initialize
              </>
            </Button>
            
            {lastfmStatus && (
              <Alert className="mt-4">
                <AlertDescription>{lastfmStatus}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        {/* Download Settings */}
        <div className="settings-group mb-8">
          <h3 className="font-bold">download settings</h3>
          
          <div className="form-group mt-4 mb-4">
            <Label htmlFor="download-path">download path:</Label>
            <div className="flex w-2/5">
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
          
          <div className="form-group mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="organize-files" 
                checked={localOrganizeFiles} 
                onCheckedChange={handleOrganizeFilesChange} 
              />
              <Label htmlFor="organize-files">
                organize files by artist/album
              </Label>
            </div>
          </div>
          
          <div className="form-group mb-4">
            <Label htmlFor="preferred-format">preferred format:</Label>
            <div className="w-2/5">
              <Select 
                id="preferred-format" 
                value={localPreferredFormat} 
                onValueChange={handlePreferredFormatChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">any format</SelectItem>
                  <SelectItem value="flac">.flac</SelectItem>
                  <SelectItem value="mp3">.mp3</SelectItem>
                  <SelectItem value="wav">.wav</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Debug Logs */}
        <div className="settings-group mb-8">
          <h3 className="font-bold">debug logs</h3>
          <Button className="mt-4"
            id="open-logs-btn"
            onClick={() => setShowLogsModal(true)}
          >
            <File size={16} className="mr-2" />
            view logs
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;