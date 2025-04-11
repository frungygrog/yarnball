const fetch = require('node-fetch');
const logger = require('../lib/logger');

class LastFmAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ws.audioscrobbler.com/2.0/';
    logger.info(`LastFmAPI initialized with key: ${apiKey.substring(0, 5)}...`);
  }

  async searchTrack(query) {
    logger.debug(`Searching for track: "${query}"`);
    try {
      const response = await fetch(`${this.baseUrl}?method=track.search&track=${encodeURIComponent(query)}&api_key=${this.apiKey}&format=json&limit=15`);
      const data = await response.json();
      
      if (data.error) {
        logger.error(`Last.fm API error: ${data.message}`);
        throw new Error(data.message);
      }
      
      logger.debug(`Found ${data.results.trackmatches.track.length} tracks on Last.fm`);
      return data.results.trackmatches.track;
    } catch (error) {
      logger.error(`Error searching track: ${error.message}`);
      throw error;
    }
  }

  async getTrackInfo(artist, track) {
    logger.debug(`Getting track info for: "${artist}" - "${track}"`);
    try {
      const response = await fetch(`${this.baseUrl}?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${this.apiKey}&format=json`);
      const data = await response.json();
      
      if (data.error) {
        logger.error(`Last.fm API error: ${data.message}`);
        throw new Error(data.message);
      }
      
      logger.debug(`Retrieved track info successfully`);
      return data.track;
    } catch (error) {
      logger.error(`Error getting track info: ${error.message}`);
      throw error;
    }
  }

  async getAlbumInfo(artist, album) {
    logger.debug(`Getting album info for: "${artist}" - "${album}"`);
    try {
      const response = await fetch(`${this.baseUrl}?method=album.getInfo&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&api_key=${this.apiKey}&format=json`);
      const data = await response.json();
      
      if (data.error) {
        logger.error(`Last.fm API error: ${data.message}`);
        throw new Error(data.message);
      }
      
      logger.debug(`Retrieved album info successfully`);
      return data.album;
    } catch (error) {
      logger.error(`Error getting album info: ${error.message}`);
      throw error;
    }
  }

  async searchAlbum(query) {
    logger.debug(`Searching for album: "${query}"`);
    try {
      const response = await fetch(`${this.baseUrl}?method=album.search&album=${encodeURIComponent(query)}&api_key=${this.apiKey}&format=json&limit=15`);
      const data = await response.json();
      
      if (data.error) {
        logger.error(`Last.fm API error: ${data.message}`);
        throw new Error(data.message);
      }
      
      logger.debug(`Found ${data.results.albummatches.album.length} albums on Last.fm`);
      return data.results.albummatches.album;
    } catch (error) {
      logger.error(`Error searching album: ${error.message}`);
      throw error;
    }
  }

  async searchArtist(query) {
    logger.debug(`Searching for artist: "${query}"`);
    try {
      const response = await fetch(`${this.baseUrl}?method=artist.search&artist=${encodeURIComponent(query)}&api_key=${this.apiKey}&format=json&limit=15`);
      const data = await response.json();
      
      if (data.error) {
        logger.error(`Last.fm API error: ${data.message}`);
        throw new Error(data.message);
      }
      
      logger.debug(`Found ${data.results.artistmatches.artist.length} artists on Last.fm`);
      return data.results.artistmatches.artist;
    } catch (error) {
      logger.error(`Error searching artist: ${error.message}`);
      throw error;
    }
  }

  async getArtistTopTracks(artist) {
    logger.debug(`Getting top tracks for artist: "${artist}"`);
    try {
      const response = await fetch(`${this.baseUrl}?method=artist.gettoptracks&artist=${encodeURIComponent(artist)}&api_key=${this.apiKey}&format=json&limit=10`);
      const data = await response.json();

      if (data.error) {
        logger.error(`Last.fm API error: ${data.message}`);
        throw new Error(data.message);
      }

      logger.debug(`Found ${data.toptracks.track.length} top tracks for artist "${artist}"`);
      return data.toptracks.track;
    } catch (error) {
      logger.error(`Error getting artist top tracks: ${error.message}`);
      throw error;
    }
  }

  async getArtistAlbums(artist) {
    logger.debug(`Getting albums for artist: "${artist}"`);
    try {
      const response = await fetch(`${this.baseUrl}?method=artist.gettopalbums&artist=${encodeURIComponent(artist)}&api_key=${this.apiKey}&format=json&limit=10`);
      const data = await response.json();

      if (data.error) {
        logger.error(`Last.fm API error: ${data.message}`);
        throw new Error(data.message);
      }

      logger.debug(`Found ${data.topalbums.album.length} albums for artist "${artist}"`);
      return data.topalbums.album;
    } catch (error) {
      logger.error(`Error getting artist albums: ${error.message}`);
      throw error;
    }
  }
}

module.exports = LastFmAPI;
