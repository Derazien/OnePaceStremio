const fetch = require('node-fetch');
const crypto = require('crypto');

class OpenSubtitlesIntegration {
    constructor(apiKey = null) {
        this.apiKey = apiKey; // OpenSubtitles v3 API key (optional, falls back to v1)
        this.baseUrl = apiKey ? 'https://api.opensubtitles.com/api/v1' : 'https://rest.opensubtitles.org/search';
        this.userAgent = 'OnePaceStremio v4.0';
        console.log(`🔤 [OpenSubtitles] Initialized with ${apiKey ? 'API v3' : 'API v1'} mode`);
    }

    /**
     * Search for subtitles using episode metadata
     * @param {Object} episodeInfo - Episode information {title, season, episode, id}
     * @param {Array} languages - Array of language codes (e.g., ['en', 'es', 'fr'])
     * @returns {Promise<Array>} Array of subtitle objects
     */
    async searchSubtitles(episodeInfo, languages = ['en']) {
        console.log(`🔍 [OpenSubtitles] Searching subtitles for: ${episodeInfo.title}`);
        
        if (this.apiKey) {
            return await this.searchWithApiV3(episodeInfo, languages);
        } else {
            return await this.searchWithApiV1(episodeInfo, languages);
        }
    }

    /**
     * Search using OpenSubtitles API v3 (requires API key)
     */
    async searchWithApiV3(episodeInfo, languages) {
        try {
            const searchParams = {
                query: this.buildSearchQuery(episodeInfo),
                languages: languages.join(','),
                type: 'episode'
            };

            console.log(`🔍 [OpenSubtitles v3] Search params:`, searchParams);

            const response = await fetch(`${this.baseUrl}/subtitles?${new URLSearchParams(searchParams)}`, {
                headers: {
                    'Api-Key': this.apiKey,
                    'User-Agent': this.userAgent,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`❌ [OpenSubtitles v3] Search failed: ${response.status}`);
                return [];
            }

            const data = await response.json();
            console.log(`📊 [OpenSubtitles v3] Found ${data.data?.length || 0} subtitles`);
            
            return this.parseApiV3Response(data);
        } catch (error) {
            console.error(`💥 [OpenSubtitles v3] Search error:`, error);
            return [];
        }
    }

    /**
     * Search using OpenSubtitles API v1 (legacy, no API key required)
     */
    async searchWithApiV1(episodeInfo, languages) {
        try {
            // Build search parameters for the legacy API
            const searchQuery = this.buildSearchQuery(episodeInfo);
            const languageCodes = languages.join(',');
            
            // Try multiple search strategies for better coverage
            const searchStrategies = [
                // Strategy 1: Series + episode info
                `sublanguageid-${languageCodes}/query-${encodeURIComponent(searchQuery)}`,
                // Strategy 2: Just the anime name
                `sublanguageid-${languageCodes}/query-${encodeURIComponent('One Piece')}/season-${episodeInfo.season}/episode-${episodeInfo.episode}`,
                // Strategy 3: One Pace specific
                `sublanguageid-${languageCodes}/query-${encodeURIComponent('One Pace')}`
            ];

            let allSubtitles = [];

            for (const strategy of searchStrategies) {
                try {
                    console.log(`🔍 [OpenSubtitles v1] Trying strategy: ${strategy}`);
                    
                    const response = await fetch(`${this.baseUrl}/${strategy}`, {
                        headers: {
                            'User-Agent': this.userAgent,
                            'Accept': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`📊 [OpenSubtitles v1] Strategy found ${data.length || 0} subtitles`);
                        
                        if (Array.isArray(data) && data.length > 0) {
                            const parsed = this.parseApiV1Response(data, episodeInfo);
                            allSubtitles.push(...parsed);
                        }
                    }
                } catch (strategyError) {
                    console.log(`⚠️ [OpenSubtitles v1] Strategy failed, continuing...`);
                }
            }

            // Remove duplicates and limit results
            const uniqueSubtitles = this.removeDuplicateSubtitles(allSubtitles);
            console.log(`✅ [OpenSubtitles v1] Total unique subtitles found: ${uniqueSubtitles.length}`);
            
            return uniqueSubtitles.slice(0, 10); // Limit to 10 best matches
            
        } catch (error) {
            console.error(`💥 [OpenSubtitles v1] Search error:`, error);
            return [];
        }
    }

    /**
     * Build search query from episode information
     */
    buildSearchQuery(episodeInfo) {
        // Create variations for better search coverage
        const queries = [
            `One Pace ${episodeInfo.title}`,
            `One Piece ${episodeInfo.title}`,
            episodeInfo.title,
        ];
        
        // Return the most specific query first
        return queries[0];
    }

    /**
     * Parse API v3 response format
     */
    parseApiV3Response(data) {
        if (!data.data || !Array.isArray(data.data)) return [];
        
        return data.data.map(item => ({
            url: item.attributes.download_url || item.attributes.url,
            lang: item.attributes.language,
            label: `${this.getLanguageLabel(item.attributes.language)} - ${item.attributes.filename || 'OpenSubtitles'}`,
            format: this.getSubtitleFormat(item.attributes.filename || ''),
            rating: item.attributes.rating || 0,
            downloads: item.attributes.download_count || 0
        })).filter(sub => sub.url); // Only return subtitles with valid URLs
    }

    /**
     * Parse API v1 response format  
     */
    parseApiV1Response(data, episodeInfo) {
        if (!Array.isArray(data)) return [];
        
        return data.map(item => {
            const downloadUrl = item.SubDownloadLink;
            if (!downloadUrl) return null;

            return {
                url: downloadUrl,
                lang: item.SubLanguageID || item.ISO639 || 'en',
                label: `${this.getLanguageLabel(item.SubLanguageID)} - ${item.SubFileName || 'OpenSubtitles'}`,
                format: this.getSubtitleFormat(item.SubFileName || ''),
                rating: parseFloat(item.SubRating) || 0,
                downloads: parseInt(item.SubDownloadsCnt) || 0,
                // Add matching score for relevance
                matchScore: this.calculateMatchScore(item, episodeInfo)
            };
        })
        .filter(sub => sub !== null && sub.url)
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)); // Sort by relevance
    }

    /**
     * Calculate how well a subtitle matches our episode
     */
    calculateMatchScore(subtitle, episodeInfo) {
        let score = 0;
        const filename = (subtitle.SubFileName || '').toLowerCase();
        const episodeTitle = episodeInfo.title.toLowerCase();
        
        // Exact title match
        if (filename.includes(episodeTitle)) score += 50;
        
        // One Pace specific
        if (filename.includes('one pace')) score += 30;
        else if (filename.includes('one piece')) score += 20;
        
        // Episode/season info
        if (filename.includes(`s${episodeInfo.season}`)) score += 15;
        if (filename.includes(`e${episodeInfo.episode}`)) score += 15;
        
        // Quality indicators
        if (subtitle.SubRating > 0) score += subtitle.SubRating * 2;
        if (subtitle.SubDownloadsCnt > 100) score += 10;
        
        return score;
    }

    /**
     * Remove duplicate subtitles based on URL and language
     */
    removeDuplicateSubtitles(subtitles) {
        const seen = new Set();
        return subtitles.filter(sub => {
            const key = `${sub.lang}-${sub.url}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Get human-readable language label
     */
    getLanguageLabel(langCode) {
        const languages = {
            'en': 'English',
            'es': 'Spanish', 
            'fr': 'French',
            'pt': 'Portuguese',
            'it': 'Italian',
            'de': 'German',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'ru': 'Russian'
        };
        return languages[langCode] || langCode.toUpperCase();
    }

    /**
     * Determine subtitle format from filename
     */
    getSubtitleFormat(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        return ext === 'vtt' ? 'vtt' : 'srt'; // Default to SRT
    }

    /**
     * Convert SRT content to VTT format if needed
     */
    async convertSrtToVtt(srtContent) {
        try {
            // Basic SRT to VTT conversion
            let vttContent = 'WEBVTT\n\n';
            
            // Replace SRT timing format with VTT format
            vttContent += srtContent
                .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4')
                .replace(/(\d+)\r?\n(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})\r?\n/g, '\n$2\n');
            
            return vttContent;
        } catch (error) {
            console.error(`💥 [OpenSubtitles] SRT to VTT conversion failed:`, error);
            return null;
        }
    }
}

module.exports = OpenSubtitlesIntegration;
