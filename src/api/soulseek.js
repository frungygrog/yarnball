const path = require('path');
const logger = require('../lib/logger');

/**
 * Soulseek Search & Scoring System
 * - Prioritizes download speed and slot availability above all else.
 * - Ensures metadata accuracy (artist, song, album, format).
 * - Scores and sorts results globally for best possible download experience.
 */
class SoulseekSearch {
  constructor(slskClient) {
    this.slskClient = slskClient;
    logger.info('SoulseekSearch initialized');
  }

  /**
   * Perform a Soulseek search.
   * @param {string} query
   * @param {number} timeout
   * @returns {Promise<Array>}
   */
  async search(query, timeout = 10000) {
    logger.debug(`Soulseek search: "${query}"`);
    return new Promise((resolve, reject) => {
      this.slskClient.search({ req: query, timeout }, (err, results) => {
        if (err) {
          logger.error(`Soulseek search error: ${err.message}`);
          reject(err);
        } else {
          logger.debug(`Soulseek search found ${results.length} results`);
          resolve(results);
        }
      });
    });
  }

  /**
   * Score and sort Soulseek results for a single song.
   * @param {Array} results
   * @param {string} artist
   * @param {string} song
   * @param {string} album
   * @param {string} preferredFormat
   * @returns {Array} Sorted and scored results
   */
  scoreResults(results, artist, song, album, preferredFormat = 'any') {
    logger.debug(`Scoring ${results.length} results for "${artist}" - "${song}" [${album}]`);

    const norm = s => (s || '').toLowerCase();
    const nArtist = norm(artist);
    const nSong = norm(song);
    const nAlbum = norm(album);
    const nFormat = preferredFormat && preferredFormat !== 'any' ? norm(preferredFormat) : null;

    // Score each result individually
    const scored = results.map(result => {
      const normalizedPath = result.file.replace(/\\/g, '/');
      const fileName = path.basename(normalizedPath).toLowerCase();
      const folderName = normalizedPath.split('/').slice(-2, -1)[0]?.toLowerCase() || '';

      let score = 0;

      // --- 1. Download Speed & Slot Availability (Primary) ---
      // Available slot: +100, else +0
      if (result.slots) score += 100;
      // Download speed: +1 per 1000 kbps, up to +50
      if (result.speed) score += Math.min(50, Math.floor(result.speed / 1000));

      // --- 2. Metadata Accuracy (Secondary) ---
      // Artist/album in folder: +10 each
      if (folderName.includes(nArtist)) score += 10;
      if (folderName.includes(nAlbum)) score += 10;
      // Song in file name: +20 if exact, +10 if partial
      if (fileName === nSong) score += 20;
      else if (fileName.includes(nSong)) score += 10;
      // Album in file/folder: +5
      if (fileName.includes(nAlbum)) score += 5;

      // --- 3. Format & Quality (Tertiary) ---
      const ext = path.extname(fileName).replace('.', '');
      if (nFormat && ext === nFormat) score += 10;
      if (!nFormat) {
        if (ext === 'flac') score += 5;
        else if (ext === 'wav') score += 3;
        else if (ext === 'mp3' && result.bitrate >= 320) score += 2;
        else if (ext === 'mp3' && result.bitrate >= 256) score += 1;
      }

      // --- 4. Penalties ---
      // No slots: -30
      if (!result.slots) score -= 30;
      // Very slow: -10 if speed < 100 kbps
      if (result.speed && result.speed < 100) score -= 10;

      return {
        ...result,
        score,
        fileName,
        folderName,
        ext,
      };
    });

    // Sort: score DESC, then speed DESC, then slots DESC
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.speed || 0) !== (a.speed || 0)) return (b.speed || 0) - (a.speed || 0);
      if ((b.slots ? 1 : 0) !== (a.slots ? 1 : 0)) return (b.slots ? 1 : 0) - (a.slots ? 1 : 0);
      return 0;
    });

    logger.debug(`Top result score: ${scored[0]?.score ?? 'N/A'}`);
    return scored;
  }

  /**
   * Download a file from Soulseek.
   * @param {Object} fileInfo
   * @param {string} downloadPath
   * @param {Function} progressCallback
   * @returns {Promise}
   */
  async downloadFile(fileInfo, downloadPath, progressCallback = null) {
    logger.debug(`Downloading file: ${fileInfo.file}`);
    return new Promise((resolve, reject) => {
      let lastProgress = 0;
      const download = this.slskClient.download(
        { file: fileInfo, path: downloadPath },
        (err, data) => {
          if (err) {
            if (progressCallback) progressCallback(lastProgress, 'Failed');
            logger.error(`Download error: ${err.message}`);
            reject(err);
            return;
          }
          if (progressCallback) progressCallback(100, 'Completed');
          logger.info(`Download complete: ${fileInfo.file}`);
          resolve(data);
        }
      );

      if (progressCallback) {
        const interval = setInterval(() => {
          if (!download || !download.status) {
            clearInterval(interval);
            return;
          }
          const st = download.status.state;
          if (st === 'Transferring') {
            const progress = Math.floor((download.status.transferred / download.status.size) * 100);
            lastProgress = progress;
            progressCallback(progress, 'Downloading...');
          } else if (st === 'Connecting') {
            progressCallback(0, 'Connecting...');
          } else if (st === 'Queued') {
            progressCallback(0, `Queued (${download.status.position})`);
          } else if (st === 'Aborted') {
            clearInterval(interval);
            reject(new Error('Download aborted'));
          } else if (st === 'Completed') {
            clearInterval(interval);
            progressCallback(100, 'Completed');
          }
        }, 500);
      }
    });
  }

  /**
   * Find and download the best match for a song.
   * @param {string} artist
   * @param {string} song
   * @param {string} album
   * @param {string} downloadDir
   * @param {Function} progressCallback
   * @param {string} preferredFormat
   * @returns {Promise<Object>}
   */
  async findAndDownloadSong(artist, song, album, downloadDir, progressCallback = null, preferredFormat = 'any') {
    logger.info(`Searching and downloading "${song}" by "${artist}" [${album}]`);
    if (progressCallback) progressCallback(0, 'Searching...');

    // Compose query: artist + album (for best folder matches)
    let query = `${artist} ${album}`.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
    let results = await this.search(query);

    // Fallback: just album
    if (!results.length) {
      query = album.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
      results = await this.search(query);
      if (!results.length) throw new Error('No results found');
    }

    // Score and sort
    const scored = this.scoreResults(results, artist, song, album, preferredFormat);
    if (!scored.length) throw new Error('No valid results after scoring');

    if (progressCallback) progressCallback(0, 'Found sources, starting download...');

    // Try top 5 results (in case of failures)
    for (let i = 0; i < Math.min(5, scored.length); i++) {
      const fileToDownload = scored[i];
      const fileName = path.basename(fileToDownload.file.replace(/\\/g, path.sep)).replace(/[<>:"/\\|?*]/g, '-');
      const filePath = path.join(downloadDir, fileName);

      try {
        if (progressCallback) progressCallback(0, `Downloading from ${fileToDownload.user}...`);
        const data = await this.downloadFile(fileToDownload, filePath, progressCallback);
        logger.info(`Downloaded to ${filePath}`);
        return { path: filePath, data, result: fileToDownload };
      } catch (err) {
        logger.warn(`Download failed from user "${fileToDownload.user}": ${err.message}`);
        await new Promise(res => setTimeout(res, 2000));
      }
    }
    throw new Error('All download attempts failed');
  }

  /**
   * Find and download an album (all tracks).
   * @param {string} artist
   * @param {string} album
   * @param {Array} tracks
   * @param {string} downloadDir
   * @param {Function} progressCallback
   * @param {string} preferredFormat
   * @returns {Promise<Object>}
   */
  async findAndDownloadAlbum(artist, album, tracks, downloadDir, progressCallback = null, preferredFormat = 'any') {
    logger.info(`Searching and downloading album "${album}" by "${artist}"`);
    if (progressCallback) progressCallback(0, 'Searching for album...');

    let query = `${artist} ${album}`.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
    let results = await this.search(query, 15000);

    // Fallback: just album
    if (!results.length) {
      query = album.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
      results = await this.search(query, 15000);
      if (!results.length) throw new Error('No album matches found');
    }

    // Group by user/folder, score for speed/slots/accuracy
    const candidates = this.scoreAlbumCandidates(results, artist, album, tracks, preferredFormat);
    if (!candidates.length) throw new Error('No complete album matches found');

    if (progressCallback) progressCallback(10, 'Found album sources, preparing download...');

    // Try top 3 candidates
    for (let i = 0; i < Math.min(3, candidates.length); i++) {
      const candidate = candidates[i];
      let downloadedTracks = [];
      let successCount = 0;

      try {
        if (progressCallback) progressCallback(15, `Downloading album from ${candidate.user}...`);
        for (let j = 0; j < candidate.tracks.length; j++) {
          const track = candidate.tracks[j];
          const fileName = path.basename(track.file.replace(/\\/g, path.sep)).replace(/[<>:"/\\|?*]/g, '-');
          const filePath = path.join(downloadDir, fileName);

          try {
            if (progressCallback) {
              const prog = 15 + Math.floor((85 * j) / candidate.tracks.length);
              progressCallback(prog, `Downloading track ${j + 1}/${candidate.tracks.length}...`);
            }
            await this.downloadFile(track, filePath);
            downloadedTracks.push({
              title: this.extractTrackTitle(fileName, tracks[j]?.name),
              path: filePath,
              track: j + 1
            });
            successCount++;
          } catch (trackErr) {
            logger.warn(`Failed to download track "${fileName}": ${trackErr.message}`);
          }
        }
        // Success if at least 80% of tracks downloaded
        if (successCount >= 0.8 * candidate.tracks.length) {
          if (progressCallback) progressCallback(100, `Downloaded ${successCount}/${candidate.tracks.length} tracks`);
          logger.info(`Album download success: ${successCount}/${candidate.tracks.length}`);
          return { success: true, tracks: downloadedTracks };
        }
      } catch (err) {
        logger.warn(`Album download failed from user "${candidate.user}": ${err.message}`);
      }
      await new Promise(res => setTimeout(res, 2000));
    }
    throw new Error('Failed to download album from any source');
  }

  /**
   * Score album candidates (grouped by user/folder) for speed, slots, and accuracy.
   */
  scoreAlbumCandidates(results, artist, album, tracks, preferredFormat = 'any') {
    const norm = s => (s || '').toLowerCase();
    const nArtist = norm(artist);
    const nAlbum = norm(album);
    const nFormat = preferredFormat && preferredFormat !== 'any' ? norm(preferredFormat) : null;
    const trackCount = tracks.length;

    // Group by user/folder
    const groups = {};
    results.forEach(result => {
      const normalizedPath = result.file.replace(/\\/g, '/');
      const fileName = path.basename(normalizedPath).toLowerCase();
      const folderName = normalizedPath.split('/').slice(-2, -1)[0]?.toLowerCase() || '';
      const groupKey = `${result.user}::${folderName}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          user: result.user,
          folderName,
          files: [],
          score: 0,
          fileTypes: new Set(),
        };
      }
      groups[groupKey].files.push(result);
      groups[groupKey].fileTypes.add(path.extname(fileName).replace('.', ''));
    });

    // Score each group
    const candidates = Object.values(groups).map(group => {
      let score = 0;
      // --- 1. Speed & Slots (Primary) ---
      const avgSpeed = group.files.reduce((sum, f) => sum + (f.speed || 0), 0) / (group.files.length || 1);
      const hasSlots = group.files.some(f => f.slots);
      if (hasSlots) score += 100;
      score += Math.min(50, Math.floor(avgSpeed / 1000));

      // --- 2. Metadata (Secondary) ---
      if (group.folderName.includes(nArtist)) score += 10;
      if (group.folderName.includes(nAlbum)) score += 10;

      // --- 3. File count accuracy ---
      const audioFiles = group.files.filter(f => ['.mp3', '.flac', '.wav'].includes(path.extname(f.file).toLowerCase()));
      const fileCountDiff = Math.abs(audioFiles.length - trackCount);
      if (fileCountDiff <= 2) score += 20;
      else if (fileCountDiff <= 5) score += 10;

      // --- 4. Format consistency ---
      if (group.fileTypes.size === 1) {
        const type = [...group.fileTypes][0];
        if (nFormat && type === nFormat) score += 10;
        if (!nFormat && type === 'flac') score += 5;
        else if (!nFormat && type === 'wav') score += 3;
      } else if (group.fileTypes.size > 1) {
        score -= 5;
      }

      // --- 5. Penalties ---
      if (!hasSlots) score -= 30;
      if (avgSpeed < 100) score -= 10;
      if (audioFiles.length < trackCount / 2) score = 0; // Disqualify

      // Prepare tracks (sorted by filename)
      const tracksSorted = audioFiles.sort((a, b) => {
        const aName = path.basename(a.file).toLowerCase();
        const bName = path.basename(b.file).toLowerCase();
        return aName.localeCompare(bName);
      });

      return {
        ...group,
        score,
        tracks: tracksSorted,
      };
    });

    // Filter and sort
    return candidates.filter(c => c.score > 0).sort((a, b) => b.score - a.score);
  }

  /**
   * Extract track title from filename.
   */
  extractTrackTitle(fileName, defaultTitle) {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    let cleaned = nameWithoutExt.replace(/^\d+\s*[-–—.)\]]\s*/, '').replace(/^\d+\s+/, '');
    if (cleaned.length < 3 && nameWithoutExt.length > cleaned.length) cleaned = nameWithoutExt;
    return cleaned || defaultTitle || fileName;
  }
}

module.exports = SoulseekSearch;
