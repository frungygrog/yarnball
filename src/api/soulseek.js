const path = require('path');
const logger = require('../lib/logger');

class SlskSearch {
  constructor(slskClient) {
    this.slskClient = slskClient;
    logger.info('SlskSearch utility initialized');
  }

  async searchSoulseek(query, timeout = 10000) {
    logger.debug(`Starting Soulseek search for: "${query}"`);
    
    return new Promise((resolve, reject) => {
      this.slskClient.search({
        req: query,
        timeout: timeout
      }, (err, results) => {
        if (err) {
          logger.error(`Soulseek search error: ${err.message}`);
          reject(err);
          return;
        }
        
        logger.debug(`Soulseek search complete. Found ${results.length} results`);
        resolve(results);
      });
    });
  }

  scoreResults(results, artistName, songTitle, albumTitle, preferredFormat) {
    logger.debug(`Scoring ${results.length} results for artist "${artistName}", song "${songTitle}", album "${albumTitle}"`);
    
    // Normalize inputs for case-insensitive comparison
    const normalizedArtist = artistName.toLowerCase();
    const normalizedSong = songTitle.toLowerCase();
    const normalizedAlbum = albumTitle.toLowerCase();
    
    // Group results by folder
    const folderGroups = {};
    
    results.forEach(result => {
      // Convert Windows paths to proper format
      const normalizedPath = result.file.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      const fileName = parts[parts.length - 1].toLowerCase();
      
      // Extract folder name - try to get parent folder
      let folderName = '';
      if (parts.length > 1) {
        folderName = parts[parts.length - 2].toLowerCase();
      }
      
      // Create a key for the folder grouping
      const folderKey = `${result.user}_${folderName}`;
      
      if (!folderGroups[folderKey]) {
        folderGroups[folderKey] = {
          user: result.user,
          folderName: folderName,
          files: [],
          score: 0
        };
        
        // Score the folder name
        if (folderName.includes(normalizedArtist)) {
          folderGroups[folderKey].score += 1;
          logger.debug(`Folder "${folderName}" includes artist name "${normalizedArtist}": +1 points`);
        }

        if (folderName.includes(normalizedAlbum)) {
          folderGroups[folderKey].score += 1;
          logger.debug(`Folder "${folderName}" includes album name "${normalizedAlbum}": +1 points`);
        }

        // Combined bonus for artist, album, and song
        if (folderName.includes(normalizedArtist) && folderName.includes(normalizedAlbum) && fileName.includes(normalizedSong)) {
          folderGroups[folderKey].score += 20;
          logger.debug(`Folder "${folderName}" includes artist and album, and file "${fileName}" includes song title: +20 points`);
        }
      }
      
      // Add file to the folder
      folderGroups[folderKey].files.push({
        ...result,
        fileName,
        normalizedPath
      });
      
      // Score for the file name
      if (fileName === normalizedSong) {
        folderGroups[folderKey].score += 15;
        logger.debug(`File "${fileName}" exactly matches song title "${normalizedSong}": +15 points`);
      } else if (fileName.includes(normalizedSong)) {
        folderGroups[folderKey].score += 5;
        logger.debug(`File "${fileName}" includes song title "${normalizedSong}": +5 points`);
      }
      
      // Bonus points for preferred format
      if (preferredFormat && preferredFormat !== 'any') {
        const fileExt = path.extname(fileName).toLowerCase().substring(1);
        if (fileExt === preferredFormat.toLowerCase()) {
          folderGroups[folderKey].score += 4;
          logger.debug(`File "${fileName}" matches preferred format "${preferredFormat}": +4 points`);
        }
      }
      
      // Bonus points for better quality
      const fileExt = path.extname(fileName).toLowerCase().substring(1);
      if (fileExt === 'flac') {
        folderGroups[folderKey].score += 3;
        logger.debug(`File "${fileName}" is lossless format (FLAC): +3 points`);
      } else if (fileExt === 'wav') {
        folderGroups[folderKey].score += 2;
        logger.debug(`File "${fileName}" is lossless format (WAV): +2 points`);
      } else if (fileExt === 'mp3' && result.bitrate && result.bitrate >= 320) {
        folderGroups[folderKey].score += 2;
        logger.debug(`File "${fileName}" is high bitrate MP3 (${result.bitrate}kbps): +2 points`);
      } else if (fileExt === 'mp3' && result.bitrate && result.bitrate >= 256) {
        folderGroups[folderKey].score += 1;
        logger.debug(`File "${fileName}" is good bitrate MP3 (${result.bitrate}kbps): +1 point`);
      }
    });
    
    // Convert to array and sort by score
    const scoredResults = Object.values(folderGroups);
    
    // Additional processing for each folder group
    scoredResults.forEach(group => {
      // Bonus points for folders with multiple files (likely complete albums)
      if (group.files.length > 5) {
        group.score += 2;
        logger.debug(`Folder from user "${group.user}" has ${group.files.length} files: +2 points`);
      }
      
      // Sort files by preferred format first, then by slots availability and then by speed
      group.files.sort((a, b) => {
        // Preferred format takes priority
        if (preferredFormat && preferredFormat !== 'any') {
          const aExt = path.extname(a.fileName).toLowerCase().substring(1);
          const bExt = path.extname(b.fileName).toLowerCase().substring(1);
          
          if (aExt === preferredFormat.toLowerCase() && bExt !== preferredFormat.toLowerCase()) {
            return -1;
          }
          
          if (aExt !== preferredFormat.toLowerCase() && bExt === preferredFormat.toLowerCase()) {
            return 1;
          }
        }
        
        // Then sort by slots and speed
        if (a.slots === b.slots) {
          return b.speed - a.speed;
        }
        return a.slots ? -1 : 1;
      });
      
      // Find the best match for the song title
      const songMatches = group.files.filter(file => 
        file.fileName.includes(normalizedSong)
      );
      
      if (songMatches.length > 0) {
        group.bestMatch = songMatches[0];
        logger.debug(`Found best match in folder "${group.folderName}" for song "${songTitle}"`);
      } else {
        group.bestMatch = group.files[0];
        logger.debug(`No exact match found, using first file in folder "${group.folderName}"`);
      }
    });
    
    // Sort by score (descending)
    scoredResults.sort((a, b) => b.score - a.score);
    
    logger.debug(`Scoring complete. Top score: ${scoredResults.length > 0 ? scoredResults[0].score : 'N/A'}`);
    
    return scoredResults;
  }

  async downloadFile(fileInfo, downloadPath, progressCallback = null) {
    logger.debug(`Starting download for file: ${fileInfo.file}`);
    
    return new Promise((resolve, reject) => {
      let downloadStarted = false;
      let lastProgress = 0;
      
      const download = this.slskClient.download({
        file: fileInfo,
        path: downloadPath
      }, (err, data) => {
        if (err) {
          if (progressCallback) {
            progressCallback(lastProgress, 'Failed');
          }
          logger.error(`Download error: ${err.message}`);
          reject(err);
          return;
        }
        
        if (progressCallback) {
          progressCallback(100, 'Completed');
        }
        
        logger.info(`Download complete for ${fileInfo.file}`);
        resolve(data);
      });
    });
  }

  async findAndDownloadSong(artistName, songTitle, albumTitle, downloadDir, progressCallback = null, preferredFormat = 'any') {
    logger.info(`Finding and downloading "${songTitle}" by "${artistName}" from album "${albumTitle}"`);
    
    try {
      // Send initial progress update
      if (progressCallback) {
        progressCallback(0, 'Searching...');
      }
      
      // First search for artist, album, and song
      const artistAlbumSongQuery = `${artistName} ${albumTitle} ${songTitle}`;
      logger.debug(`Searching for artist, album, and song: "${artistAlbumSongQuery}"`);
      let results = await this.searchSoulseek(artistAlbumSongQuery);
      
      
      if (results.length === 0) {
        logger.warn(`No results found for artist, album, and song. Attempting fallback to album name search.`);
        const albumQuery = albumTitle;
        logger.debug(`Searching Soulseek for album: "${albumQuery}"`);
        results = await this.searchSoulseek(albumQuery);

        if (results.length === 0) {
          logger.warn(`No results found for album "${albumTitle}". Attempting fallback to album name without capitalization or punctuation.`);
          const albumQueryCleaned = albumTitle.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
          logger.debug(`Searching Soulseek for cleaned album: "${albumQueryCleaned}"`);
          results = await this.searchSoulseek(albumQueryCleaned);

          if (results.length === 0) {
            logger.warn(`No results found for any search attempts`);
            throw new Error('No results found');
          }
        }
      }
      
      // Score the results
      const scoredResults = this.scoreResults(results, artistName, songTitle, albumTitle, preferredFormat);
      
      if (scoredResults.length === 0) {
        logger.warn(`No valid results after scoring`);
        throw new Error('No scored results available');
      }
      
      // Update progress
      if (progressCallback) {
        progressCallback(0, 'Found sources, starting download...');
      }
      
      logger.info(`Found ${scoredResults.length} potential sources, attempting downloads in order of score`);
      
      // Try downloading from the highest scored results
      for (let i = 0; i < Math.min(3, scoredResults.length); i++) {
        const resultGroup = scoredResults[i];
        const fileToDownload = resultGroup.bestMatch;
        
        if (!fileToDownload) {
          logger.warn(`No suitable file found in result group ${i + 1}`);
          continue;
        }
        
        logger.info(`Attempting download from user "${fileToDownload.user}" (score: ${resultGroup.score})`);
        
        // Clean up filename
        const fileName = path.basename(fileToDownload.file.replace(/\\/g, path.sep))
          .replace(/[<>:"/\\|?*]/g, '-');
        
        const filePath = path.join(downloadDir, fileName);
        
        try {
          // Send progress update
          if (progressCallback) {
            progressCallback(0, `Downloading from ${fileToDownload.user}...`);
          }
          
          const data = await this.downloadFile(fileToDownload, filePath, progressCallback);
          logger.info(`Successfully downloaded to ${filePath}`);
          return {
            path: filePath,
            data: data,
            result: fileToDownload
          };
        } catch (err) {
          logger.warn(`Download failed from user "${fileToDownload.user}": ${err.message}`);
          logger.info(`Waiting 3 seconds before trying next result...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // If we get here, all download attempts failed
      logger.error('All download attempts failed');
      throw new Error('All download attempts failed');
    } catch (error) {
      logger.error(`Error in findAndDownloadSong: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SlskSearch;