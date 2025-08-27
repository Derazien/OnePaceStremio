const { TorboxApi } = require('@torbox/torbox-api');
const fetch = require('node-fetch');

class TorboxIntegrationSDK {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.sdk = new TorboxApi({
            token: apiKey,
            baseUrl: 'https://api.torbox.app'
        });
        console.log(`🚀 [Torbox SDK] Initialized with API key: ${apiKey.substring(0, 8)}...`);
    }

    /**
     * Check if a torrent is instantly available on Torbox
     * @param {string} infoHash - The torrent info hash
     * @returns {Promise<boolean>} - Whether the torrent is available
     */
    async checkInstantAvailability(infoHash) {
        console.log(`🔍 [Torbox SDK] Checking instant availability for: ${infoHash}`);
        
        try {
            // Use correct SDK format from documentation
            const response = await this.sdk.torrents.getTorrentCachedAvailability('v1', {
                hash: infoHash,
                format: 'object'
            });

            console.log(`📊 [Torbox SDK] Availability response:`, response);
            
            // Check if the response indicates availability
            const isAvailable = response.data && Object.keys(response.data).length > 0;
            console.log(`📊 [Torbox SDK] Hash ${infoHash} availability: ${isAvailable}`);
            
            return isAvailable;
        } catch (error) {
            console.error(`💥 [Torbox SDK] Error checking availability:`, error);
            return false;
        }
    }

    /**
     * Create a torrent download on Torbox
     * @param {string} infoHash - The torrent info hash
     * @returns {Promise<string|null>} - The torrent ID if successful
     */
    async createTorrent(infoHash) {
        console.log(`🔄 [Torbox SDK] Creating torrent for hash: ${infoHash}`);
        
        try {
            const magnetLink = `magnet:?xt=urn:btih:${infoHash}`;
            console.log(`🧲 [Torbox SDK] Using magnet: ${magnetLink}`);
            
            // Use direct API call with proper form-data to avoid SDK multipart issues
            console.log(`📤 [Torbox SDK] Using direct API call with form-data`);
            
            const FormData = require('form-data');
            const form = new FormData();
            form.append('magnet', magnetLink);
            form.append('seed', '3');          // 3 = don't seed (download only)
            form.append('asQueued', 'true');
            
            const response = await fetch('https://api.torbox.app/v1/api/torrents/createtorrent', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    ...form.getHeaders()
                },
                body: form
            });

            console.log(`📡 [Torbox SDK] Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ [Torbox SDK] Create torrent error: ${response.status} ${response.statusText}`);
                console.error(`❌ [Torbox SDK] Error details: ${errorText}`);
                return null;
            }

            const data = await response.json();
            console.log(`📊 [Torbox SDK] Create response data:`, data);

            if (data.data && data.data.torrent_id) {
                console.log(`✅ [Torbox SDK] Created torrent with ID: ${data.data.torrent_id}`);
                return data.data.torrent_id.toString();
            }

            console.log(`❌ [Torbox SDK] No torrent ID in response`);
            return null;
        } catch (error) {
            console.error(`💥 [Torbox SDK] Error creating torrent:`, error);
            return null;
        }
    }

    /**
     * Find existing torrent in user's list by hash
     * @param {string} infoHash - The torrent info hash
     * @returns {Promise<string|null>} - The torrent ID if found
     */
    async findExistingTorrent(infoHash) {
        console.log(`🔍 [Torbox SDK] Looking for existing torrent with hash: ${infoHash}`);
        
        try {
            // Skip the torrent list check for now due to ZodError validation issues
            // The SDK has strict validation that fails with null values in the response
            console.log(`⏭️ [Torbox SDK] Skipping torrent list check due to SDK validation issues`);
            return null;
        } catch (error) {
            console.error(`💥 [Torbox SDK] Error finding existing torrent:`, error);
            return null;
        }
    }

    /**
     * Get download links for a torrent
     * @param {string} torrentId - The Torbox torrent ID
     * @returns {Promise<Array>} - Array of download links
     */
    async getTorrentLinks(torrentId) {
        console.log(`📥 [Torbox SDK] Getting download links for torrent: ${torrentId}`);
        
        try {
            // Use exact format from TorrentsService.md documentation
            // First try to get individual files
            const response = await this.sdk.torrents.requestDownloadLink('v1', {
                token: this.apiKey,
                torrentId: torrentId.toString()
                // Don't specify fileId to get all files
            });

            console.log(`📊 [Torbox SDK] Download links response:`, response);

            if (response.data) {
                // Handle single download link response
                const links = [{
                    url: response.data,
                    name: `One Pace Episode.mkv`,
                    size: 0
                }];
                
                console.log(`📋 [Torbox SDK] Got download link: ${response.data.substring(0, 50)}...`);
                return links;
            }

            return [];
        } catch (error) {
            console.error(`💥 [Torbox SDK] Error getting download links:`, error);
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
        console.log(`🚀 [Torbox SDK] Starting stream URL generation for hash: ${infoHash}`);

        try {
            // First check if instantly available
            const isAvailable = await this.checkInstantAvailability(infoHash);
            console.log(`📊 [Torbox SDK] Instant availability: ${isAvailable ? 'YES' : 'NO'}`);
            
            if (isAvailable) {
                // Since torrent is cached, try using the permalink approach from documentation
                console.log(`⚡ [Torbox SDK] Torrent is cached, using permalink approach...`);
                
                // Create a permalink URL as mentioned in the documentation
                // "https://api.torbox.app/v1/api/torrents/requestdl?token=APIKEY&torrent_id=NUMBER&file_id=NUMBER&redirect=true"
                
                // First we need to create the torrent to get an ID, but use minimal params
                console.log(`🔄 [Torbox SDK] Creating torrent for cached content...`);
                const torrentId = await this.createTorrent(infoHash);
                
                if (torrentId) {
                    // Use permalink approach instead of SDK method
                    const permalinkUrl = `https://api.torbox.app/v1/api/torrents/requestdl?token=${this.apiKey}&torrent_id=${torrentId}&file_id=${fileIndex}&redirect=true`;
                    
                    console.log(`🔗 [Torbox SDK] Created permalink: ${permalinkUrl.substring(0, 80)}...`);
                    
                    const streamObject = {
                        url: permalinkUrl,
                        title: `🚀 Torbox (Instant) - One Pace Episode`,
                        behaviorHints: {
                            bingeGroup: "onepace-torbox",
                            countryWhitelist: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "IT", "ES"]
                        },
                        isStaticContent: true,
                        notWebReady: false,
                    };
                    
                    console.log(`✅ [Torbox SDK] Successfully created permalink stream`);
                    return streamObject;
                }
            }
            
            console.log(`❌ [Torbox SDK] Could not create stream (not cached or creation failed)`);
            return null;

        } catch (error) {
            console.error(`💥 [Torbox SDK] Error getting stream URL for ${infoHash}:`, error);
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
}

module.exports = TorboxIntegrationSDK;
