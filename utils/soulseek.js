const path = require('path');
const fs = require('fs');
const slsk = require('slsk-client');

class SoulseekClient {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  async connect(username, password) {
    try {
      // Using callback style as required by the library
      this.client = await new Promise((resolve, reject) => {
        slsk.connect({
          username, 
          password
        }, (err, client) => {
          if (err) reject(err);
          else resolve(client);
        });
      });
      
      this.connected = true;
      console.log('Connected to Soulseek');
      return true;
    } catch (error) {
      console.error('Failed to connect to Soulseek:', error);
      this.connected = false;
      throw error;
    }
  }

  async search(params) {
    if (!this.connected || !this.client) {
      throw new Error('Not connected to Soulseek');
    }

    const { artist, track, album } = params;
    
    // Create a search query from the track and artist/album info
    const query = album 
      ? `${artist} ${album} ${track}`
      : `${artist} ${track}`;
    
    try {
      const results = await this.client.search({
        req: query,
        timeout: 10000
      });
      
      // Filter for MP3 files
      const filteredResults = results.filter(result => {
        const fileExt = path.extname(result.file).toLowerCase();
        return fileExt === '.mp3';
      });
      
      // Score the results
      const scoredResults = this.scoreResults(filteredResults, { artist, track });
      
      // Sort by score (highest first)
      return scoredResults.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Soulseek search error:', error);
      throw error;
    }
  }

  scoreResults(results, { artist, track }) {
    return results.map(result => {
      const filename = path.basename(result.file, '.mp3').toLowerCase();
      
      // Simple scoring: check if both artist and track are in the filename
      const artistInFile = filename.includes(artist.toLowerCase());
      const trackInFile = filename.includes(track.toLowerCase());
      
      let score = 0;
      if (artistInFile) score += 3;
      if (trackInFile) score += 5;
      
      return { ...result, score };
    });
  }

  async downloadTrack({ username, file, size }, downloadPath) {
    if (!this.connected || !this.client) {
      throw new Error('Not connected to Soulseek');
    }
    
    try {
      // Ensure the download directory exists
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }
      
      const filename = path.basename(file);
      const filePath = path.join(downloadPath, filename);
      
      // Check if file already exists
      if (fs.existsSync(filePath)) {
        return { success: true, filePath, alreadyExists: true };
      }
      
      // Download the file
      await new Promise((resolve, reject) => {
        this.client.download({
          file: file,
          user: username,
          size: size
        }, filePath, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      return { success: true, filePath };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}

module.exports = SoulseekClient;