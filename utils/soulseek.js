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
      // Make sure username and password are always strings
      const user = typeof username === 'string' ? username : 'yarnball';
      const pass = typeof password === 'string' ? password : 'yarnball';
      
      console.log(`Connecting to Soulseek with username: ${user}`);
      
      this.client = await new Promise((resolve, reject) => {
        slsk.connect({
          user,
          pass
        }, (err, client) => {
          if (err) {
            console.error('Connection error:', err);
            reject(err);
          } else {
            resolve(client);
          }
        });
      });
      
      this.connected = true;
      console.log('Connected to Soulseek successfully');
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
      console.log(`Searching Soulseek for: ${query}`);
      
      // Use a promise to handle callback-based API
      const results = await new Promise((resolve, reject) => {
        this.client.search({
          req: query,
          timeout: 10000
        }, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      // Filter for MP3 files and add username property (from user)
      const filteredResults = results.filter(result => {
        const fileExt = path.extname(result.file).toLowerCase();
        // The API returns 'user' instead of 'username', so add username property
        if (result.user) {
          result.username = result.user;
        }
        
        return fileExt === '.mp3';
      });
      
      console.log(`Found ${filteredResults.length} MP3 results`);
      
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

  async downloadTrack(trackInfo, downloadPath) {
    if (!this.connected || !this.client) {
      throw new Error('Not connected to Soulseek');
    }
    
    try {
      const { username, file, size } = trackInfo;
      
      // Use username or fall back to user property if username is missing
      const user = username || trackInfo.user;
      
      if (!user) {
        throw new Error('Username is missing for download');
      }
      
      console.log(`Downloading file from user: ${user}`);
      
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
      return new Promise((resolve, reject) => {
        try {
          console.log(`Downloading ${file} from ${user} to ${filePath}`);
          
          this.client.download({
            file,
            user,  // Use the user variable which handles both cases
            size
          }, (err, data) => {
            if (err) {
              console.error('Download callback error:', err);
              reject(err);
              return;
            }
            
            // Write the data to file
            try {
              fs.writeFileSync(filePath, data);
              console.log(`Successfully saved file to ${filePath}`);
              resolve({ success: true, filePath });
            } catch (writeErr) {
              console.error('Error writing file:', writeErr);
              reject(writeErr);
            }
          });
        } catch (e) {
          console.error('Download setup error:', e);
          reject(e);
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}

module.exports = SoulseekClient;