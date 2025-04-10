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

      // Monitor download progress
      if (progressCallback) {
        const progressInterval = setInterval(() => {
          if (!download || !download.status) {
            clearInterval(progressInterval);
            return;
          }

          if (download.status.state === 'Transferring') {
            downloadStarted = true;
            const progress = Math.floor((download.status.transferred / download.status.size) * 100);
            lastProgress = progress;
            progressCallback(progress, 'Downloading...');
          } else if (download.status.state === 'Connecting') {
            progressCallback(0, 'Connecting...');
          } else if (download.status.state === 'Negotiating') {
            progressCallback(0, 'Negotiating connection...');
          } else if (download.status.state === 'Initializing') {
            progressCallback(0, 'Initializing...');
          } else if (download.status.state === 'Queued') {
            progressCallback(0, `Queued (${download.status.position} in line)`);
          } else if (download.status.state === 'Aborted') {
            clearInterval(progressInterval);
            reject(new Error('Download aborted'));
          } else if (download.status.state === 'Completed') {
            clearInterval(progressInterval);
            progressCallback(100, 'Completed');
          }
        }, 500);
      }
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

  // New method for downloading an entire album
  async findAndDownloadAlbum(artistName, albumTitle, tracks, downloadDir, progressCallback = null, preferredFormat = 'any') {
    logger.info(`Finding and downloading album "${albumTitle}" by "${artistName}" with ${tracks.length} tracks`);
    
    try {
      // Send initial progress update
      if (progressCallback) {
        progressCallback(0, 'Searching for album...');
      }
      
      // First search for the complete album
      const albumQuery = `${artistName} ${albumTitle}`;
      logger.debug(`Searching for album: "${albumQuery}"`);
      let results = await this.searchSoulseek(albumQuery, 15000); // Longer timeout for album search
      
      if (results.length === 0) {
        logger.warn(`No results found for album query. Trying alternative search.`);
        // Try alternate query with just the album name
        const simpleQuery = albumTitle.replace(/[\(\)\[\]]/g, ''); // Remove parentheses that might confuse search
        results = await this.searchSoulseek(simpleQuery, 15000);
      }
      
      if (results.length === 0) {
        throw new Error('No album matches found');
      }
      
      // Identify potential complete albums by grouping files by user and folder
      const albumCandidates = this.findAlbumCandidates(results, artistName, albumTitle, tracks, preferredFormat);
      
      if (albumCandidates.length === 0) {
        throw new Error('No complete album matches found');
      }
      
      logger.info(`Found ${albumCandidates.length} potential sources for complete album`);
      
      // Update progress
      if (progressCallback) {
        progressCallback(10, 'Found potential album matches, preparing download...');
      }
      
      // Attempt to download the album from the best candidate
      const downloadedTracks = [];
      let downloadSuccess = false;
      
      // Try the top 3 candidates
      for (let i = 0; i < Math.min(3, albumCandidates.length); i++) {
        const candidate = albumCandidates[i];
        
        try {
          if (progressCallback) {
            progressCallback(15, `Downloading album from ${candidate.user}...`);
          }
          
          logger.info(`Attempting album download from user "${candidate.user}" (score: ${candidate.score})`);
          
          // Download each track in the album
          const totalTracks = candidate.tracks.length;
          let successfulDownloads = 0;
          
          for (let j = 0; j < totalTracks; j++) {
            const track = candidate.tracks[j];
            const trackFile = track.file;
            
            // Clean up filename
            const fileName = path.basename(trackFile.replace(/\\/g, path.sep))
              .replace(/[<>:"/\\|?*]/g, '-');
            
            const filePath = path.join(downloadDir, fileName);
            
            try {
              // Update progress for each track
              if (progressCallback) {
                const overallProgress = 15 + Math.floor((85 * j) / totalTracks);
                progressCallback(overallProgress, `Downloading track ${j+1}/${totalTracks}...`);
              }
              
              const data = await this.downloadFile(track, filePath);
              
              // Add to our successful downloads
              downloadedTracks.push({
                title: this.extractTrackTitle(fileName, tracks[j]?.name),
                path: filePath,
                track: j + 1
              });
              
              successfulDownloads++;
              
            } catch (trackError) {
              logger.warn(`Failed to download track "${fileName}": ${trackError.message}`);
            }
          }
          
          // If we got at least 80% of the tracks, consider it a success
          if (successfulDownloads >= 0.8 * totalTracks) {
            downloadSuccess = true;
            
            // Final progress update
            if (progressCallback) {
              progressCallback(100, `Downloaded ${successfulDownloads}/${totalTracks} tracks`);
            }
            
            logger.info(`Successfully downloaded ${successfulDownloads}/${totalTracks} tracks from album "${albumTitle}"`);
            break;
          } else {
            logger.warn(`Only downloaded ${successfulDownloads}/${totalTracks} tracks from user "${candidate.user}", trying next source...`);
          }
          
        } catch (candidateError) {
          logger.warn(`Download failed from user "${candidate.user}": ${candidateError.message}`);
        }
        
        // If we failed with this candidate, wait before trying the next one
        if (!downloadSuccess && i < albumCandidates.length - 1) {
          logger.info(`Waiting 3 seconds before trying next album source...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      if (!downloadSuccess) {
        throw new Error('Failed to download album from any source');
      }
      
      return {
        success: true,
        tracks: downloadedTracks
      };
    } catch (error) {
      logger.error(`Error in findAndDownloadAlbum: ${error.message}`);
      throw error;
    }
  }

  // Helper function to find album candidates
  findAlbumCandidates(results, artistName, albumTitle, tracks, preferredFormat) {
    logger.debug(`Analyzing ${results.length} results for album "${albumTitle}" by "${artistName}"`);
    
    // Normalize inputs for case-insensitive comparison
    const normalizedArtist = artistName.toLowerCase();
    const normalizedAlbum = albumTitle.toLowerCase();
    const trackCount = tracks.length;
    
    // Group results by user and folder
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
          score: 0,
          files: [],
          fileTypes: new Set()
        };
        
        // Score the folder name
        if (folderName.includes(normalizedArtist)) {
          folderGroups[folderKey].score += 10;
        }

        if (folderName.includes(normalizedAlbum)) {
          folderGroups[folderKey].score += 15;
        }
      }
      
      // Add file to the folder
      folderGroups[folderKey].files.push(result);
      
      // Track file extensions
      const fileExt = path.extname(fileName).toLowerCase().substring(1);
      folderGroups[folderKey].fileTypes.add(fileExt);
    });
    
    // Convert to array for filtering and sorting
    let candidates = Object.values(folderGroups);
    
    // Keep only folders with a reasonable number of files
    // (at least half the number of tracks we're looking for)
    candidates = candidates.filter(c => c.files.length >= (trackCount / 2));
    
    // Adjust scores based on additional factors
    candidates.forEach(candidate => {
      // --- Base Score (Folder Name Match) --- already applied before this loop

      // --- File Count Accuracy Bonus ---
      const fileCountDiff = Math.abs(candidate.files.length - trackCount);
      if (fileCountDiff <= 2) {
        candidate.score += 15; // Perfect or nearly perfect match
        logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: +15 points (file count diff ${fileCountDiff})`);
      } else if (fileCountDiff <= 5) {
        candidate.score += 8; // Reasonably close
        logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: +8 points (file count diff ${fileCountDiff})`);
      }

      // --- File Type Scoring (Prioritizing Preferred Format) ---
      const preferredFormatLower = preferredFormat?.toLowerCase(); // Handle potential undefined/null
      if (candidate.fileTypes.size === 1) {
        const fileType = [...candidate.fileTypes][0];
        if (preferredFormatLower && preferredFormatLower !== 'any' && fileType === preferredFormatLower) {
          candidate.score += 20; // High bonus for matching preferred format
          logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: +20 points (matches preferred format: ${preferredFormat})`);
        } else if (preferredFormatLower === 'any' || !preferredFormatLower) {
           // If preference is 'any' or not set, give bonus for lossless
           if (fileType === 'flac') {
             candidate.score += 8;
             logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: +8 points (FLAC format, preference 'any')`);
           } else if (fileType === 'wav') {
             candidate.score += 5;
             logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: +5 points (WAV format, preference 'any')`);
           } else {
             candidate.score += 2; // Small bonus for consistency
             logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: +2 points (consistent type: ${fileType}, preference 'any')`);
           }
        } else {
           // Consistent type, but doesn't match non-'any' preference
           candidate.score += 2;
           logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: +2 points (consistent type: ${fileType}, but doesn't match preference ${preferredFormat})`);
        }
      } else if (candidate.fileTypes.size > 1) {
        candidate.score -= 5; // Penalty for inconsistent file types
        logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: -5 points (inconsistent file types: ${[...candidate.fileTypes].join(', ')})`);
      }

      // --- Speed and Slot Scoring ---
      const totalSpeed = candidate.files.reduce((sum, file) => sum + (file.speed || 0), 0);
      const avgSpeed = candidate.files.length > 0 ? totalSpeed / candidate.files.length : 0;
      const hasSlots = candidate.files.some(file => file.slots);

      // Bonus for average speed (up to 10 points)
      // Scale: 1 point per 1000 kbps, max 10 points
      const speedBonus = Math.min(10, Math.floor(avgSpeed / 1000));
      if (speedBonus > 0) {
        candidate.score += speedBonus;
        logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: +${speedBonus} points (avg speed ${avgSpeed.toFixed(0)} kbps)`);
      }

      // Bonus for slot availability (5 points)
      if (hasSlots) {
        candidate.score += 5;
        logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: +5 points (slots available)`);
      }
      
      // Clean up candidate.tracks and map files to the tracks array
      candidate.tracks = candidate.files.filter(file => {
        const ext = path.extname(file.file).toLowerCase();
        // Only include audio files
        return ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac'].includes(ext);
      }).map(file => file);
      
      // Sort tracks by filename (which often includes track number)
      candidate.tracks.sort((a, b) => {
        const aName = path.basename(a.file).toLowerCase();
        const bName = path.basename(b.file).toLowerCase();
        return aName.localeCompare(bName);
      });
      
      // --- Final adjustment based on actual number of *audio* tracks ---
      // Ensure we only count valid audio files for disqualification
      const audioTrackCount = candidate.tracks.length; // .tracks is already filtered for audio
      if (audioTrackCount < (trackCount / 2)) {
        logger.debug(`Candidate ${candidate.user}/${candidate.folderName}: Disqualified (only ${audioTrackCount} audio tracks found, need at least ${Math.ceil(trackCount / 2)})`);
        candidate.score = 0; // Disqualify if too few audio files
      }
    });
    
    // Filter out disqualified candidates
    candidates = candidates.filter(c => c.score > 0);
    
    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates;
  }

  // Helper to extract track title from filename
  extractTrackTitle(fileName, defaultTitle) {
    // Remove file extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    // Try to remove track number patterns
    let cleanedName = nameWithoutExt
      .replace(/^\d+\s*[-–—.)\]]\s*/, '') // Remove leading numbers with separators
      .replace(/^\d+\s+/, '');             // Remove just leading numbers with space
    
    // If the result seems too short, use the original name without extension
    if (cleanedName.length < 3 && nameWithoutExt.length > cleanedName.length) {
      cleanedName = nameWithoutExt;
    }
    
    // Return either the extracted name or the default title
    return cleanedName || defaultTitle || fileName;
  }
}

module.exports = SlskSearch;