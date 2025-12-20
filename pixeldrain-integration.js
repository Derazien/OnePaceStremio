const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/**
 * PixelDrain Integration for OnePace
 * 
 * This module handles PixelDrain folder URLs and maps them to episodes.
 * Each PixelDrain folder contains multiple files, one per episode.
 * URLs are routed through TorBox for streaming.
 */

class PixeldrainIntegration {
    constructor(torboxIntegration = null) {
        this.mappingCache = new Map();
        this.folderCache = new Map();
        this.torboxIntegration = torboxIntegration; // Optional TorBox integration
        
        // Load extracted URLs
        this.loadExtractedUrls();
    }

    /**
     * Load extracted PixelDrain URLs from file
     */
    loadExtractedUrls() {
        try {
            // Try loading complete URLs first
            const completePath = path.join(__dirname, 'pixeldrain-urls-complete.json');
            if (fs.existsSync(completePath)) {
                this.extractedUrls = JSON.parse(fs.readFileSync(completePath, 'utf8'));
                console.log(`✅ [PixelDrain] Loaded ${this.extractedUrls.length} arc URLs from complete file`);
                return;
            }
            
            // Fallback to extracted file
            const extractedPath = path.join(__dirname, 'pixeldrain-urls-extracted.json');
            if (fs.existsSync(extractedPath)) {
                this.extractedUrls = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
                console.log(`✅ [PixelDrain] Loaded ${this.extractedUrls.length} arc URLs`);
            } else {
                console.warn(`⚠️ [PixelDrain] Extracted URLs file not found`);
                this.extractedUrls = [];
            }
        } catch (error) {
            console.error(`💥 [PixelDrain] Error loading extracted URLs:`, error);
            this.extractedUrls = [];
        }
    }

    /**
     * Fetch PixelDrain folder contents
     * @param {string} folderId - PixelDrain folder ID
     * @returns {Promise<Array>} Array of file objects
     */
    async fetchFolderContents(folderId) {
        if (this.folderCache.has(folderId)) {
            return this.folderCache.get(folderId);
        }

        try {
            const response = await fetch(`https://pixeldrain.com/api/list/${folderId}`, {
                headers: {
                    'User-Agent': 'OnePaceStremio/1.0'
                }
            });

            if (!response.ok) {
                console.error(`❌ [PixelDrain] Failed to fetch folder ${folderId}: ${response.statusText}`);
                return [];
            }

            const data = await response.json();
            const files = data.files || [];
            
            // Cache the result
            this.folderCache.set(folderId, files);
            
            return files;
        } catch (error) {
            console.error(`💥 [PixelDrain] Error fetching folder ${folderId}:`, error.message);
            return [];
        }
    }

    /**
     * Get PixelDrain file URL for an episode
     * @param {string} folderId - PixelDrain folder ID
     * @param {number} fileIndex - File index (0-based, episode number - 1)
     * @returns {Promise<string|null>} Direct file URL or null
     */
    async getFileUrl(folderId, fileIndex) {
        const files = await this.fetchFolderContents(folderId);
        
        if (fileIndex < 0 || fileIndex >= files.length) {
            console.warn(`⚠️ [PixelDrain] File index ${fileIndex} out of range for folder ${folderId} (${files.length} files)`);
            return null;
        }

        const file = files[fileIndex];
        // Use direct file URL for streaming (browsers/players can handle it)
        return `https://pixeldrain.com/u/${file.id}`;
    }

    /**
     * Get PixelDrain URLs for an episode via TorBox
     * @param {string} episodeId - Episode ID (e.g., "RO_1", "AR_3")
     * @param {Object} episodeInfo - Episode info from metadata
     * @returns {Promise<Array>} Array of stream objects
     */
    async getStreamsForEpisode(episodeId, episodeInfo) {
        const arcPrefix = episodeId.split('_')[0];
        const episodeNumber = parseInt(episodeId.split('_')[1]) - 1; // 0-based file index
        
        // Find arc data from extracted URLs
        const arcData = this.extractedUrls.find(arc => {
            const prefix = this.getArcPrefix(arc.arc);
            return prefix === arcPrefix;
        });

        if (!arcData || !arcData.variants || arcData.variants.length === 0) {
            return [];
        }

        // If no TorBox integration, return empty (must use TorBox for PixelDrain)
        if (!this.torboxIntegration) {
            console.warn(`⚠️ [PixelDrain] TorBox integration required for PixelDrain URLs`);
            return [];
        }

        const streams = [];

        // Process each variant with its qualities
        for (const variant of arcData.variants) {
            for (const quality of variant.qualities) {
                const folderId = quality.folderId;
                const pixeldrainFolderUrl = quality.url; // Use the folder URL directly
                
                // Route through TorBox using the folder URL - TorBox handles the folder and file selection
                console.log(`🌐 [PixelDrain] Creating TorBox web download from PixelDrain folder URL (NORTH STAR)`);
                console.log(`🔗 [PixelDrain] Folder URL: ${pixeldrainFolderUrl}`);
                console.log(`📁 [PixelDrain] File index in folder: ${episodeNumber} (episode ${episodeId})`);
                
                // Use folder URL directly - TorBox will handle folder contents and file selection by index
                const torboxStream = await this.torboxIntegration.getStreamUrlFromPixeldrainUrl(pixeldrainFolderUrl, episodeNumber);
                
                if (!torboxStream) {
                    console.warn(`⚠️ [PixelDrain] Failed to create TorBox stream for ${episodeId}`);
                    continue;
                }

                // Use TorBox data as primary source - it provides ALL metadata (hashes, OpenSubtitles, etc.)
                streams.push({
                    ...torboxStream, // Use ALL data from TorBox (includes hashes, OpenSubtitles info, file metadata, etc.)
                    title: `🎌 One Pace Official - ${quality.quality} (${variant.type})`,
                    name: `${episodeInfo.title || episodeId} - ${variant.type}`,
                    quality: quality.quality,
                    resolution: quality.quality,
                    episode: episodeInfo.episode,
                    season: episodeInfo.season,
                    isOfficial: true,
                    source: 'onepace-official-torbox',
                    streamType: variant.type.toLowerCase().includes('dub') ? 'dub' : 'sub',
                    behaviorHints: {
                        ...torboxStream.behaviorHints, // TorBox provides OpenSubtitles hash, file hash, etc.
                        bingeGroup: "onepace-torbox",
                        priority: 100,
                        contentId: `onepace_torbox_${episodeId}_${variant.type}_${quality.quality}`,
                    },
                });
            }
        }

        // Sort by quality (1080p first) and type (subtitled first)
        streams.sort((a, b) => {
            const qualityOrder = { '1080p': 3, '720p': 2, '480p': 1 };
            const qualityDiff = (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
            if (qualityDiff !== 0) return qualityDiff;
            if (a.streamType === 'sub' && b.streamType === 'dub') return -1;
            if (a.streamType === 'dub' && b.streamType === 'sub') return 1;
            return 0;
        });

        return streams;
    }


    /**
     * Get arc prefix from arc name
     */
    getArcPrefix(arcName) {
        const arcMap = {
            'Romance Dawn': 'RO',
            'Orange Town': 'OR',
            'Syrup Village': 'SY',
            'Gaimon': 'GA',
            'Baratie': 'BA',
            'Arlong Park': 'AR',
            "The Adventures of Buggy's Crew": 'BUGGYS_CREW',
            'Loguetown': 'LO',
            'Reverse Mountain': 'REV',
            'Whisky Peak': 'WH',
            "The Trials of Koby-Meppo": 'COVER_KOBYMEPPO',
            'Little Garden': 'LI',
            'Drum Island': 'DI',
            'Alabasta': 'AL',
            'Jaya': 'JA',
            'Skypiea': 'SK',
            'Long Ring Long Land': 'LR',
            'Water Seven': 'WA',
            'Enies Lobby': 'EN',
            'Post-Enies Lobby': 'EN',
            'Thriller Bark': 'TB',
            'Sabaody Archipelago': 'SAB',
            'Amazon Lily': 'AM',
            'Impel Down': 'IM',
            "If You Could Go Anywhere... The Adventures of the Straw Hats": 'COVER_SHSS',
            'Marineford': 'MA',
            'Post-War': 'PW',
            'Return to Sabaody': 'RM',
            'Fishman Island': 'FI',
            'Punk Hazard': 'PH',
            'Dressrosa': 'DR',
            'Zou': 'ZO',
            'Whole Cake Island': 'WC',
            'Reverie': 'REV_',
            'Wano': 'WS',
            'Egghead': 'EH',
            "Special: One Piece Fan Letter": 'RTS',
            "Special: Warship Island 01 (April Fools 2025)": 'SPECIAL'
        };

        return arcMap[arcName] || arcName.split(' ')[0].toUpperCase();
    }
}

module.exports = PixeldrainIntegration;

