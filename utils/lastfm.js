const axios = require('axios');

class LastFmAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'http://ws.audioscrobbler.com/2.0/';
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  async searchTrack(query, limit = 15) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          method: 'track.search',
          track: query,
          api_key: this.apiKey,
          format: 'json',
          limit: limit
        }
      });
      
      return response.data?.results?.trackmatches?.track || [];
    } catch (error) {
      console.error('Last.fm search error:', error);
      throw error;
    }
  }

  async getTrackInfo(artist, track) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          method: 'track.getInfo',
          artist: artist,
          track: track,
          api_key: this.apiKey,
          format: 'json'
        }
      });
      
      return response.data?.track || null;
    } catch (error) {
      console.error('Last.fm track info error:', error);
      throw error;
    }
  }
}

module.exports = LastFmAPI;