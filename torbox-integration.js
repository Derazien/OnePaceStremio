const fetch = require('node-fetch');

class TorboxIntegration {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.torbox.app/v1/api';
    }

    /**
     * Check if a torrent is instantly available on Torbox
     * @param {string} infoHash - The torrent info hash
     * @returns {Promise<boolean>} - Whether the torrent is available
     */
    async checkInstantAvailability(infoHash) {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/torrents/instantavailability?hash=${infoHash}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`Torbox API error: ${response.status} ${response.statusText}`);
                return false;
            }

            const data = await response.json();
            
            // Check if the hash exists and has available files
            if (data.data && data.data[infoHash] && data.data[infoHash].length > 0) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking Torbox instant availability:', error);
            return false;
        }
    }

    /**
     * Create a torrent download on Torbox
     * @param {string} infoHash - The torrent info hash
     * @returns {Promise<string|null>} - The torrent ID if successful
     */
    async createTorrent(infoHash) {
        if (!this.apiKey) {
            return null;
        }

        try {
            const magnetLink = `magnet:?xt=urn:btih:${infoHash}`;
            
            const response = await fetch(`${this.baseUrl}/torrents/createtorrent`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    magnet: magnetLink,
                    seed: 1 // Enable seeding
                })
            });

            if (!response.ok) {
                console.error(`Torbox create torrent error: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            
            if (data.data && data.data.torrent_id) {
                return data.data.torrent_id.toString();
            }

            return null;
        } catch (error) {
            console.error('Error creating Torbox torrent:', error);
            return null;
        }
    }

    /**
     * Get download links for a torrent
     * @param {string} torrentId - The Torbox torrent ID
     * @returns {Promise<Array>} - Array of download links
     */
    async getTorrentLinks(torrentId) {
        if (!this.apiKey || !torrentId) {
            return [];
        }

        try {
            const response = await fetch(`${this.baseUrl}/torrents/requestdl?token=${this.apiKey}&torrent_id=${torrentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`Torbox get links error: ${response.status} ${response.statusText}`);
                return [];
            }

            const data = await response.json();
            
            if (data.data && Array.isArray(data.data)) {
                return data.data.map(file => ({
                    url: file.download,
                    name: file.name,
                    size: file.size
                }));
            }

            return [];
        } catch (error) {
            console.error('Error getting Torbox torrent links:', error);
            return [];
        }
    }

    /**
     * Get a stream URL for a torrent hash
     * @param {string} infoHash - The torrent info hash
     * @param {number} fileIndex - Optional file index for multi-file torrents
     * @returns {Promise<Object|null>} - Stream object or null
     */
    async getStreamUrl(infoHash, fileIndex = 0) {
        if (!this.apiKey) {
            return null;
        }

        try {
            // First check if instantly available
            const isAvailable = await this.checkInstantAvailability(infoHash);
            
            let torrentId;
            
            if (isAvailable) {
                // If available, we can try to get existing torrent ID or create one
                torrentId = await this.createTorrent(infoHash);
            } else {
                // If not available, create the torrent anyway (it will be queued)
                torrentId = await this.createTorrent(infoHash);
            }

            if (!torrentId) {
                return null;
            }

            // Get download links
            const links = await this.getTorrentLinks(torrentId);
            
            if (links.length === 0) {
                return null;
            }

            // Find the largest video file (assuming it's the main content)
            const videoFile = links
                .filter(file => this.isVideoFile(file.name))
                .sort((a, b) => (b.size || 0) - (a.size || 0))[fileIndex] || links[fileIndex];

            if (!videoFile) {
                return null;
            }

            return {
                url: videoFile.url,
                title: `🚀 Torbox${isAvailable ? ' (Instant)' : ' (Cached)'} - ${videoFile.name}`,
                behaviorHints: {
                    bingeGroup: "onepace-torbox",
                    countryWhitelist: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "IT", "ES"] // Common Torbox supported countries
                }
            };

        } catch (error) {
            console.error('Error getting Torbox stream URL:', error);
            return null;
        }
    }

    /**
     * Check if a file is a video file based on extension
     * @param {string} filename - The filename to check
     * @returns {boolean} - Whether it's a video file
     */
    isVideoFile(filename) {
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.ts', '.m2ts'];
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return videoExtensions.includes(ext);
    }

    /**
     * Get user info to verify API key
     * @returns {Promise<Object|null>} - User info or null
     */
    async getUserInfo() {
        if (!this.apiKey) {
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/user/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.data || null;
        } catch (error) {
            console.error('Error getting Torbox user info:', error);
            return null;
        }
    }
}

module.exports = TorboxIntegration;
