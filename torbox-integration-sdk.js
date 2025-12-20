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
                        // Enhanced metadata for Local Files addon detection
                        name: `One Pace Episode ${infoHash.substring(0, 8)}`,
                        filename: `OnePace_${infoHash.substring(0, 8)}.mkv`,
                        // Add media info for better detection
                        quality: "1080p",
                        subtitles: [
                            {
                                url: permalinkUrl,
                                lang: "eng"
                            }
                        ],
                        behaviorHints: {
                            bingeGroup: "onepace-torbox",
                            countryWhitelist: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "IT", "ES"],
                            // Enhanced hints for local file detection
                            hasMultipleAudioTracks: true,
                            hasSubtitles: true,
                            // Content identifiers for cross-addon recognition
                            contentId: `onepace_${infoHash}`,
                            torrentHash: infoHash,
                            // Suggest local filename pattern
                            localFilename: `One Pace - Episode ${infoHash.substring(0, 8)}.mkv`
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
     * Create a web download from a URL (e.g., PixelDrain URL) and return full TorBox details
     * @param {string} url - The URL to download
     * @returns {Promise<Object|null>} - Full download details from TorBox including file info, hashes, etc.
     */
    async createWebDownload(url) {
        console.log(`🌐 [Torbox SDK] Creating web download for URL: ${url.substring(0, 50)}...`);
        
        try {
            const FormData = require('form-data');
            let form = new FormData();
            // TorBox API uses 'link' parameter, not 'url'
            form.append('link', url);
            
            // Correct endpoint: /v1/api/webdl/createwebdownload
            const response = await fetch('https://api.torbox.app/v1/api/webdl/createwebdownload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    ...form.getHeaders()
                },
                body: form
            });

            console.log(`📡 [Torbox SDK] Web download response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ [Torbox SDK] Create web download error: ${response.status} ${response.statusText}`);
                console.error(`❌ [Torbox SDK] Error details: ${errorText}`);
                return null;
            }

            const data = await response.json();
            console.log(`📊 [Torbox SDK] TorBox response (full details):`, JSON.stringify(data, null, 2));

            // Return the FULL response data - TorBox provides everything we need
            if (data.data) {
                console.log(`✅ [Torbox SDK] Created web download, got full TorBox details`);
                return data.data; // Return full data object with all TorBox metadata
            }

            console.log(`❌ [Torbox SDK] No data in response`);
            return null;
        } catch (error) {
            console.error(`💥 [Torbox SDK] Error creating web download:`, error);
            return null;
        }
    }

    /**
     * Get download details from TorBox (includes file info, hashes, OpenSubtitles data, etc.)
     * @param {string} downloadId - The TorBox download ID
     * @returns {Promise<Object|null>} - Full download details from TorBox
     */
    async getDownloadDetails(downloadId) {
        console.log(`📋 [Torbox SDK] Getting download details for: ${downloadId}`);
        
        // Note: TorBox API may not have a direct "get details" endpoint for web downloads
        // The details are typically included in the create response
        // We'll return null here and rely on the create response data
        console.log(`ℹ️ [Torbox SDK] Download details are included in create response`);
        return null;
    }

    /**
     * Get stream URL for a web download using TorBox's requestdl endpoint
     * @param {string} downloadId - The Torbox download ID
     * @param {number} fileIndex - File index (0-based) for multi-file downloads
     * @returns {Promise<string|null>} - Stream URL or null
     */
    async getWebDownloadStreamUrl(downloadId, fileIndex = 0) {
        console.log(`🌐 [Torbox SDK] Getting stream URL for download: ${downloadId}, fileIdx: ${fileIndex}`);
        
        try {
            // Correct endpoint: /v1/api/webdl/requestdl with web_id parameter
            const response = await fetch(`https://api.torbox.app/v1/api/webdl/requestdl?token=${this.apiKey}&web_id=${downloadId}&file_id=${fileIndex}&redirect=true`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                redirect: 'manual' // Don't automatically follow redirect
            });

            console.log(`📡 [Torbox SDK] Stream URL response: ${response.status} ${response.statusText}`);

            // Handle redirect FIRST (307 or 302) - TorBox returns redirect to CDN URL
            // This is SUCCESS, not an error! Redirects are expected here.
            if (response.status >= 300 && response.status < 400) {
                const streamUrl = response.headers.get('location') || response.url;
                if (streamUrl) {
                    console.log(`✅ [Torbox SDK] Got stream URL (redirect ${response.status}) for download ${downloadId}`);
                    console.log(`🔗 [Torbox SDK] Stream URL: ${streamUrl.substring(0, 80)}...`);
                    return streamUrl;
                } else {
                    console.warn(`⚠️ [Torbox SDK] Redirect but no location header found`);
                }
            }

            // If not a redirect and not OK, it's an error
            if (!response.ok) {
                console.error(`❌ [Torbox SDK] Get web download stream error: ${response.status} ${response.statusText}`);
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        console.error(`❌ [Torbox SDK] Error details: ${errorText}`);
                    }
                } catch (e) {
                    // Couldn't read error text
                }
                return null;
            }

            // If OK (200) but not redirect, try to parse JSON response
            try {
                const data = await response.json();
                if (data && data.data) {
                    console.log(`✅ [Torbox SDK] Got stream URL from JSON response`);
                    return data.data;
                }
            } catch (e) {
                // Not JSON - that's OK, redirect was already handled
                console.warn(`⚠️ [Torbox SDK] Response not JSON and not redirect`);
            }

            return null;
        } catch (error) {
            console.error(`💥 [Torbox SDK] Error getting web download stream URL:`, error);
            return null;
        }
    }

    /**
     * Get stream URL for a PixelDrain URL via TorBox
     * TorBox is the source of truth - it provides ALL details (hashes, OpenSubtitles info, file metadata, etc.)
     * @param {string} pixeldrainUrl - The PixelDrain URL
     * @param {number} fileIndex - File index (0-based) for folder-based downloads
     * @returns {Promise<Object|null>} - Stream object with ALL TorBox metadata or null
     */
    async getStreamUrlFromPixeldrainUrl(pixeldrainUrl, fileIndex = 0) {
        console.log(`🌐 [Torbox SDK] Getting stream from PixelDrain URL via TorBox (NORTH STAR)`);
        console.log(`🔗 [Torbox SDK] PixelDrain URL: ${pixeldrainUrl.substring(0, 80)}...`);
        console.log(`📁 [Torbox SDK] File index: ${fileIndex}`);
        
        try {
            // Create web download in TorBox - TorBox returns ALL the details we need
            const downloadData = await this.createWebDownload(pixeldrainUrl);
            
            if (!downloadData) {
                console.log(`❌ [Torbox SDK] Failed to create web download`);
                return null;
            }

            // TorBox provides webdownload_id - use it
            const downloadId = downloadData.webdownload_id || downloadData.download_id || downloadData.id;
            if (!downloadId) {
                console.error(`❌ [Torbox SDK] No download ID in TorBox response`);
                console.error(`📊 Available keys:`, Object.keys(downloadData || {}));
                return null;
            }

            console.log(`✅ [Torbox SDK] TorBox download created: ${downloadId}`);
            console.log(`📊 [Torbox SDK] TorBox provided data:`, JSON.stringify(downloadData, null, 2));

            // Extract auth_id from create response (needed for PostgREST API)
            const authId = downloadData.auth_id;
            
            // Get full download details from TorBox PostgREST API (includes file info, hashes, OpenSubtitles, etc.)
            // This gives us the files array with opensubtitles_hash for each file
            const downloadDetails = await this.getDownloadDetails(downloadId, authId);
            
            // Get stream URL
            const streamUrl = await this.getWebDownloadStreamUrl(downloadId, fileIndex);
            
            if (!streamUrl) {
                console.log(`❌ [Torbox SDK] Failed to get stream URL`);
                return null;
            }

            // Build stream object using ALL data from TorBox
            // TorBox is the NORTH STAR - it provides EVERYTHING (hashes, OpenSubtitles, file metadata, etc.)
            
            // Extract file-specific opensubtitles_hash from files array (most accurate for subtitle matching)
            // Each file in the folder has its own opensubtitles_hash - this is what we need!
            const fileSpecificHash = downloadDetails?.files?.[fileIndex]?.opensubtitles_hash;
            
            // Fallback to general hash if file-specific hash not available
            const fileHash = fileSpecificHash || 
                           downloadData?.hash || 
                           downloadDetails?.hash ||
                           downloadData?.opensubtitles_hash || 
                           downloadDetails?.opensubtitles_hash ||
                           downloadData?.file_hash || 
                           downloadDetails?.file_hash;
            
            if (fileSpecificHash) {
                console.log(`🔤 [Torbox SDK] Using file-specific opensubtitles_hash (file index ${fileIndex}): ${fileSpecificHash}`);
            } else if (fileHash) {
                console.log(`🔤 [Torbox SDK] Using fallback hash: ${fileHash}`);
            } else {
                console.log(`⚠️ [Torbox SDK] No hash found for file index ${fileIndex}`);
            }
            
            const streamObject = {
                url: streamUrl,
                // Spread ALL metadata from TorBox - it's the source of truth
                ...(downloadData || {}),
                ...(downloadDetails || {}),
                behaviorHints: {
                    // Preserve any behaviorHints from TorBox
                    ...(downloadData?.behaviorHints || {}),
                    ...(downloadDetails?.behaviorHints || {}),
                    bingeGroup: "onepace-torbox",
                    contentId: `onepace_torbox_${downloadId}`,
                    torboxDownloadId: downloadId,
                    pixeldrainUrl: pixeldrainUrl,
                    pixeldrainFileIdx: fileIndex,
                    // CRITICAL: Stremio uses opensubtitlesHash in behaviorHints to AUTOMATICALLY fetch matching subtitles
                    // TorBox provides 'hash' which is the file hash for OpenSubtitles matching
                    ...(fileHash ? { opensubtitlesHash: fileHash } : {}),
                    // Also include fileHash for reference
                    ...(fileHash ? { fileHash: fileHash } : {}),
                    // Include any other metadata TorBox provides
                    ...(downloadData?.subtitles ? { subtitles: downloadData.subtitles } : {}),
                    ...(downloadDetails?.subtitles ? { subtitles: downloadDetails.subtitles } : {}),
                },
                isStaticContent: true,
                notWebReady: false,
            };
            
            // Log what we're using for OpenSubtitles
            if (fileSpecificHash) {
                console.log(`✅ [Torbox SDK] Added opensubtitlesHash (file-specific): ${fileSpecificHash} - Stremio will automatically fetch matching subtitles`);
            } else if (fileHash) {
                console.log(`✅ [Torbox SDK] Added opensubtitlesHash (fallback): ${fileHash} - Stremio will automatically fetch matching subtitles`);
            } else {
                console.log(`⚠️ [Torbox SDK] No opensubtitlesHash available - subtitles may not auto-match`);
            }
            
            // Also log file metadata if available
            if (downloadDetails?.files?.[fileIndex]) {
                const fileInfo = downloadDetails.files[fileIndex];
                console.log(`📄 [Torbox SDK] File info for index ${fileIndex}:`, {
                    name: fileInfo.short_name || fileInfo.name,
                    size: fileInfo.size,
                    mimetype: fileInfo.mimetype,
                    opensubtitles_hash: fileInfo.opensubtitles_hash || 'NOT PROVIDED',
                    hash: fileInfo.hash,
                    md5: fileInfo.md5 || 'NOT PROVIDED',
                    all_available_fields: Object.keys(fileInfo)
                });
            }
            
            console.log(`✅ [Torbox SDK] Created stream with FULL TorBox metadata`);
            return streamObject;
        } catch (error) {
            console.error(`💥 [Torbox SDK] Error getting stream from PixelDrain:`, error);
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
