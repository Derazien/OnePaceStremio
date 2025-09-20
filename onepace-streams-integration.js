const fetch = require('node-fetch');

class OnePaceStreamsIntegration {
    constructor() {
        this.baseUrl = 'https://onepace.net/en/watch';
        console.log(`🎌 [OnePace Streams] Initialized with official One Pace video streams`);
        
        // Static mapping of episode IDs to One Pace website entries
        // This provides a fallback and faster lookup
        this.episodeMapping = this.buildEpisodeMapping();
    }

    /**
     * Get official One Pace video streams for a specific episode
     * @param {Object} episodeInfo - Episode information {title, season, episode, id}
     * @returns {Promise<Array>} Array of stream objects
     */
    async getOfficialStreams(episodeInfo) {
        console.log(`🔍 [OnePace Streams] Searching official streams for episode: ${episodeInfo.id}`);
        
        try {
            // Get the One Pace entry for this episode
            const onePaceEntry = this.getOnePaceEntry(episodeInfo.id);
            
            if (!onePaceEntry) {
                console.log(`❌ [OnePace Streams] No official stream entry found for ${episodeInfo.id}`);
                return [];
            }

            console.log(`✅ [OnePace Streams] Found official entry: ${onePaceEntry.title}`);
            
            const streams = [];
            
            // Process each stream variant (subtitled, dubbed, etc.)
            for (const variant of onePaceEntry.variants) {
                for (const quality of variant.qualities) {
                    const streamObj = {
                        url: quality.pixeldrainUrl,
                        title: `🎌 One Pace Official - ${quality.resolution} (${variant.type})`,
                        name: `${episodeInfo.title} - ${variant.type}`,
                        
                        // Quality and format information
                        quality: quality.resolution,
                        resolution: quality.resolution,
                        
                        // Enhanced metadata
                        episode: episodeInfo.episode,
                        season: episodeInfo.season,
                        
                        // Stream-specific properties
                        isOfficial: true,
                        source: 'onepace-official',
                        streamType: variant.type.toLowerCase().includes('dub') ? 'dub' : 'sub',
                        
                        // Behavior hints for Stremio
                        behaviorHints: {
                            bingeGroup: "onepace-official",
                            countryWhitelist: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "IT", "ES", "JP"],
                            // High priority for official streams
                            priority: 100,
                            // Content identifiers
                            contentId: `onepace_official_${episodeInfo.id}_${variant.type}_${quality.resolution}`,
                            localFilename: `One Pace - ${episodeInfo.title} [${quality.resolution}] [${variant.type}].mkv`
                        },
                        
                        // Additional metadata for better organization
                        subtitles: variant.type.includes('Subtitles') ? [
                            {
                                url: quality.pixeldrainUrl, // Same URL, embedded subs
                                lang: 'eng',
                                label: 'English (Embedded)'
                            }
                        ] : [],
                        
                        // Technical details
                        isWebReady: true,
                        notWebReady: false
                    };
                    
                    streams.push(streamObj);
                }
            }
            
            console.log(`📊 [OnePace Streams] Generated ${streams.length} official stream options`);
            
            // Sort by quality (1080p first) and type (subtitled first)
            streams.sort((a, b) => {
                // Priority: 1080p > 720p > 480p
                const qualityOrder = { '1080p': 3, '720p': 2, '480p': 1 };
                const qualityDiff = (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
                
                if (qualityDiff !== 0) return qualityDiff;
                
                // Priority: Subtitled > Dubbed
                if (a.streamType === 'sub' && b.streamType === 'dub') return -1;
                if (a.streamType === 'dub' && b.streamType === 'sub') return 1;
                
                return 0;
            });
            
            return streams;
            
        } catch (error) {
            console.error(`💥 [OnePace Streams] Error fetching official streams:`, error);
            return [];
        }
    }

    /**
     * Get One Pace entry for a specific episode ID
     * @param {string} episodeId - Episode ID (e.g., "RO_1", "SY_3")
     * @returns {Object|null} One Pace entry or null
     */
    getOnePaceEntry(episodeId) {
        return this.episodeMapping[episodeId] || null;
    }

    /**
     * Build static mapping of episode IDs to One Pace website data
     * Based on https://onepace.net/en/watch
     * NOTE: The actual Pixeldrain URLs need to be extracted from the website
     * These are placeholder structures showing the available formats
     * @returns {Object} Mapping object
     */
    buildEpisodeMapping() {
        // NOTE: These URLs are placeholders. The real implementation should:
        // 1. Extract actual Pixeldrain URLs from https://onepace.net/en/watch
        // 2. Update these mappings with real URLs
        // 3. Implement automated scraping to keep URLs current
        
        return {
            // Romance Dawn (Arc #1)
            'RO_1': {
                title: 'Romance Dawn',
                arcNumber: 1,
                variants: [
                    {
                        type: 'English Subtitles',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ro1-480p-sub' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ro1-720p-sub' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ro1-1080p-sub' }
                        ]
                    },
                    {
                        type: 'English Dub',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ro1-480p-dub' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ro1-720p-dub' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ro1-1080p-dub' }
                        ]
                    },
                    {
                        type: 'English Dub with Closed Captions',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ro1-480p-dub-cc' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ro1-720p-dub-cc' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ro1-1080p-dub-cc' }
                        ]
                    }
                ]
            },
            
            // Orange Town (Arc #2)
            'OR_1': {
                title: 'Orange Town',
                arcNumber: 2,
                variants: [
                    {
                        type: 'English Subtitles',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-or1-480p-sub' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-or1-720p-sub' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-or1-1080p-sub' }
                        ]
                    },
                    {
                        type: 'English Dub',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-or1-480p-dub' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-or1-720p-dub' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-or1-1080p-dub' }
                        ]
                    }
                ]
            },
            
            // Syrup Village (Arc #3) - Multi-episode
            'SY_1': { title: 'Syrup Village', arcNumber: 3, variants: [{ type: 'English Subtitles', qualities: [{ resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-sy1-480p-sub' }, { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-sy1-720p-sub' }, { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-sy1-1080p-sub' }] }, { type: 'English Dub', qualities: [{ resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-sy1-480p-dub' }, { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-sy1-720p-dub' }, { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-sy1-1080p-dub' }] }] },
            
            // Gaimon (Arc #4) 
            'GA_1': { title: 'Gaimon', arcNumber: 4, variants: [{ type: 'English Subtitles', qualities: [{ resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ga1-480p-sub' }, { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ga1-720p-sub' }, { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ga1-1080p-sub' }] }, { type: 'English Dub', qualities: [{ resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ga1-480p-dub' }, { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ga1-720p-dub' }, { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ga1-1080p-dub' }] }] },
            
            // Baratie (Arc #5)
            'BA_1': { title: 'Baratie', arcNumber: 5, variants: [{ type: 'English Subtitles', qualities: [{ resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ba1-480p-sub' }, { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ba1-720p-sub' }, { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ba1-1080p-sub' }] }, { type: 'English Dub', qualities: [{ resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ba1-480p-dub' }, { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ba1-720p-dub' }, { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ba1-1080p-dub' }] }] },
            
            // Arlong Park (Arc #6) - Has extended versions
            'AP_1': {
                title: 'Arlong Park',
                arcNumber: 6,
                variants: [
                    {
                        type: 'English Subtitles',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ap1-480p-sub' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ap1-720p-sub' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ap1-1080p-sub' }
                        ]
                    },
                    {
                        type: 'English Subtitles, Extended',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ap1-480p-sub-ext' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ap1-720p-sub-ext' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ap1-1080p-sub-ext' }
                        ]
                    },
                    {
                        type: 'English Dub',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ap1-480p-dub' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ap1-720p-dub' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ap1-1080p-dub' }
                        ]
                    }
                ]
            },
            
            // Water 7 (Arc #17) - Major arc with many episodes
            'WA_1': { title: 'Water 7', arcNumber: 17, variants: [{ type: 'English Subtitles', qualities: [{ resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-wa1-720p-sub' }] }] },
            
            // Wano (Arc #35) - Latest major arc with extended versions
            'WS_1': {
                title: 'Wano',
                arcNumber: 35,
                variants: [
                    {
                        type: 'English Subtitles',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ws1-480p-sub' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ws1-720p-sub' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ws1-1080p-sub' }
                        ]
                    },
                    {
                        type: 'English Subtitles, Extended',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ws1-480p-sub-ext' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ws1-720p-sub-ext' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ws1-1080p-sub-ext' }
                        ]
                    },
                    {
                        type: 'English Dub',
                        qualities: [
                            { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ws1-480p-dub' },
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ws1-720p-dub' },
                            { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/placeholder-ws1-1080p-dub' }
                        ]
                    }
                ]
            },
            
            // Enies Lobby (Arc #17) - Season 17, Episode 1 - REAL URLs FOR TESTING
            'EN_1': {
                title: 'The Superhumans of Enies Lobby',
                arcNumber: 17,
                variants: [
                    {
                        type: 'English Subtitles',
                        qualities: [
                            { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.net/api/file/X5BqDuJy' }
                        ]
                    }
                ]
            }
            
            // TODO: Add all remaining episodes from https://onepace.net/en/watch
            // Total of 38 arcs with multiple episodes each
            // Each with multiple quality and language options
            // Implementation should extract real Pixeldrain URLs from the website
        };
    }

    /**
     * Dynamically scrape One Pace website for latest stream links (advanced feature)
     * @returns {Promise<Object>} Updated episode mapping
     */
    async scrapeOfficialWebsite() {
        try {
            console.log(`🌐 [OnePace Streams] Attempting to scrape official website for latest links...`);
            
            const response = await fetch(this.baseUrl, {
                headers: {
                    'User-Agent': 'OnePaceStremio-StreamBot/1.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            if (!response.ok) {
                console.log(`⚠️ [OnePace Streams] Website scraping failed, using static mapping`);
                return this.episodeMapping;
            }

            const html = await response.text();
            
            // Parse HTML to extract Pixeldrain links
            // This is a simplified parser - could be enhanced with a proper HTML parser
            const pixeldrainRegex = /pixeldrain\.com\/api\/file\/([a-zA-Z0-9_-]+)/g;
            const matches = [...html.matchAll(pixeldrainRegex)];
            
            if (matches.length > 0) {
                console.log(`✅ [OnePace Streams] Found ${matches.length} Pixeldrain links on website`);
                // Could update the static mapping with fresh links here
                // For now, we'll stick with static mapping for reliability
            }
            
            return this.episodeMapping;
            
        } catch (error) {
            console.error(`💥 [OnePace Streams] Website scraping error:`, error);
            return this.episodeMapping;
        }
    }

    /**
     * Test connection to One Pace website
     * @returns {Promise<boolean>} Whether the website is accessible
     */
    async testConnection() {
        try {
            console.log(`🧪 [OnePace Streams] Testing connection to One Pace website...`);
            
            const response = await fetch(this.baseUrl, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'OnePaceStremio-StreamBot/1.0'
                }
            });

            const isConnected = response.ok;
            console.log(`${isConnected ? '✅' : '❌'} [OnePace Streams] Website connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
            
            return isConnected;
        } catch (error) {
            console.error(`💥 [OnePace Streams] Connection test failed:`, error);
            return false;
        }
    }

    /**
     * Get all available episode IDs
     * @returns {Array} Array of available episode IDs
     */
    getAvailableEpisodes() {
        return Object.keys(this.episodeMapping);
    }

    /**
     * Get stream count for an episode
     * @param {string} episodeId - Episode ID
     * @returns {number} Number of available streams
     */
    getStreamCount(episodeId) {
        const entry = this.getOnePaceEntry(episodeId);
        if (!entry) return 0;
        
        return entry.variants.reduce((total, variant) => total + variant.qualities.length, 0);
    }
}

module.exports = OnePaceStreamsIntegration;
