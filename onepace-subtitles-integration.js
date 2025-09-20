const fetch = require('node-fetch');

class OnePaceSubtitlesIntegration {
    constructor() {
        this.baseUrl = 'https://raw.githubusercontent.com/one-pace/one-pace-public-subtitles/main/main/Release/Final%20Subs';
        this.githubApiUrl = 'https://api.github.com/repos/one-pace/one-pace-public-subtitles/contents/main/Release/Final%20Subs';
        console.log(`🎌 [OnePace Subtitles] Initialized with official One Pace subtitle repository`);
    }

    /**
     * Get official One Pace subtitles for a specific episode
     * @param {Object} episodeInfo - Episode information {title, season, episode, id}
     * @param {Array} languages - Array of language codes (e.g., ['en', 'es', 'fr'])
     * @returns {Promise<Array>} Array of subtitle objects
     */
    async getOfficialSubtitles(episodeInfo, languages = ['en']) {
        console.log(`🔍 [OnePace Subtitles] Searching official subtitles for episode: ${episodeInfo.id}`);
        
        try {
            // First, try to get available subtitle files for this episode from GitHub API
            const availableFiles = await this.getAvailableSubtitleFiles(episodeInfo.id);
            
            if (availableFiles.length === 0) {
                console.log(`❌ [OnePace Subtitles] No official subtitle files found for ${episodeInfo.id}`);
                return [];
            }

            console.log(`📋 [OnePace Subtitles] Found ${availableFiles.length} subtitle files for ${episodeInfo.id}`);
            
            const subtitles = [];
            
            // Process each available subtitle file
            for (const file of availableFiles) {
                const language = this.extractLanguageFromFilename(file.name);
                
                // Only include if language is requested or if we couldn't determine language
                if (languages.includes('all') || languages.includes(language) || language === 'unknown') {
                    subtitles.push({
                        url: file.download_url,
                        lang: language,
                        label: `🎌 One Pace Official - ${this.getLanguageLabel(language)} (${episodeInfo.title})`,
                        format: this.getSubtitleFormat(file.name),
                        rating: 10, // Official subtitles get highest rating
                        downloads: 1000, // High priority
                        source: 'onepace-official',
                        filename: file.name
                    });
                }
            }

            console.log(`✅ [OnePace Subtitles] Returning ${subtitles.length} official subtitle options`);
            return subtitles;
            
        } catch (error) {
            console.error(`💥 [OnePace Subtitles] Error fetching official subtitles:`, error);
            return [];
        }
    }

    /**
     * Get available subtitle files for a specific episode from GitHub API
     * @param {string} episodeId - Episode ID (e.g., "RO_1", "SY_3")
     * @returns {Promise<Array>} Array of file objects
     */
    async getAvailableSubtitleFiles(episodeId) {
        try {
            // Try different possible folder structures and naming conventions
            const possiblePaths = [
                `${episodeId}`, // Direct episode ID folder
                `${episodeId.replace('_', ' ')}`, // With space instead of underscore
                this.getArcNameFromEpisodeId(episodeId), // Arc-based folder
            ];

            let allFiles = [];

            for (const possiblePath of possiblePaths) {
                try {
                    console.log(`🔍 [OnePace Subtitles] Trying path: ${possiblePath}`);
                    
                    const response = await fetch(`${this.githubApiUrl}/${encodeURIComponent(possiblePath)}`, {
                        headers: {
                            'User-Agent': 'OnePaceStremio-SubtitleBot/1.0',
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        
                        if (Array.isArray(data)) {
                            // Filter for subtitle files
                            const subtitleFiles = data.filter(file => 
                                file.type === 'file' && 
                                (file.name.endsWith('.srt') || file.name.endsWith('.vtt') || file.name.endsWith('.ass')) &&
                                (file.name.includes(episodeId) || file.name.toLowerCase().includes('subtitle'))
                            );
                            
                            console.log(`📁 [OnePace Subtitles] Found ${subtitleFiles.length} files in ${possiblePath}`);
                            allFiles.push(...subtitleFiles);
                        }
                    }
                } catch (pathError) {
                    console.log(`⚠️ [OnePace Subtitles] Path ${possiblePath} not found, continuing...`);
                }
            }

            // If no files found in folders, try direct file approach
            if (allFiles.length === 0) {
                allFiles = await this.tryDirectFileApproach(episodeId);
            }

            return allFiles;
            
        } catch (error) {
            console.error(`💥 [OnePace Subtitles] Error getting available files:`, error);
            return [];
        }
    }

    /**
     * Try direct file access approach with common naming patterns
     * @param {string} episodeId - Episode ID
     * @returns {Promise<Array>} Array of file objects
     */
    async tryDirectFileApproach(episodeId) {
        const commonLanguages = ['en', 'es', 'fr', 'pt', 'de', 'it', 'ja'];
        const commonExtensions = ['srt', 'vtt', 'ass'];
        const files = [];

        console.log(`🎯 [OnePace Subtitles] Trying direct file approach for ${episodeId}`);

        for (const lang of commonLanguages) {
            for (const ext of commonExtensions) {
                try {
                    const possibleFilenames = [
                        `${episodeId}.${lang}.${ext}`,
                        `${episodeId}_${lang}.${ext}`,
                        `${episodeId} - ${lang}.${ext}`,
                        `${episodeId}.${ext}`, // Default language file
                    ];

                    for (const filename of possibleFilenames) {
                        const directUrl = `${this.baseUrl}/${encodeURIComponent(filename)}`;
                        
                        // Test if file exists (HEAD request to avoid downloading)
                        const response = await fetch(directUrl, { method: 'HEAD' });
                        
                        if (response.ok) {
                            console.log(`✅ [OnePace Subtitles] Found direct file: ${filename}`);
                            files.push({
                                name: filename,
                                download_url: directUrl,
                                type: 'file'
                            });
                        }
                    }
                } catch (error) {
                    // Ignore errors for individual file checks
                }
            }
        }

        return files;
    }

    /**
     * Extract language code from subtitle filename
     * @param {string} filename - Subtitle filename
     * @returns {string} Language code
     */
    extractLanguageFromFilename(filename) {
        const lowerFilename = filename.toLowerCase();
        
        // Common language patterns in filenames
        const languagePatterns = {
            'english': 'en',
            'eng': 'en',
            'en': 'en',
            'spanish': 'es',
            'esp': 'es',
            'es': 'es',
            'french': 'fr',
            'fra': 'fr',
            'fr': 'fr',
            'portuguese': 'pt',
            'por': 'pt',
            'pt': 'pt',
            'german': 'de',
            'ger': 'de',
            'de': 'de',
            'italian': 'it',
            'ita': 'it',
            'it': 'it',
            'japanese': 'ja',
            'jpn': 'ja',
            'jp': 'ja',
            'ja': 'ja'
        };

        for (const [pattern, code] of Object.entries(languagePatterns)) {
            if (lowerFilename.includes(pattern)) {
                return code;
            }
        }

        // If no language found, assume English (most common)
        return 'en';
    }

    /**
     * Get arc name from episode ID for folder structure
     * @param {string} episodeId - Episode ID (e.g., "RO_1")
     * @returns {string} Arc name
     */
    getArcNameFromEpisodeId(episodeId) {
        const arcMap = {
            'RO': 'Romance Dawn',
            'OR': 'Orange Town',
            'SY': 'Syrup Village',
            'GA': 'Galdino',
            'BA': 'Baratie',
            'AP': 'Arlong Park',
            'REV': 'Reverse Mountain',
            'WP': 'Whisky Peak',
            'LG': 'Little Garden',
            'DR': 'Drum Island',
            'AR': 'Arabasta',
            'JA': 'Jaya',
            'SK': 'Skypeia',
            'LRLL': 'Long Ring Long Land',
            'WA': 'Water 7',
            'EL': 'Enies Lobby',
            'TB': 'Thriller Bark',
            'SAB': 'Sabaody Archipelago',
            'AM': 'Amazon Lily',
            'ID': 'Impel Down',
            'MW': 'Marineford',
            'FI': 'Fish-Man Island',
            'PH': 'Punk Hazard',
            'DR': 'Dressrosa',
            'ZO': 'Zou',
            'WC': 'Whole Cake Island',
            'WS': 'Wano'
        };

        const prefix = episodeId.split('_')[0];
        return arcMap[prefix] || prefix;
    }

    /**
     * Get human-readable language label
     * @param {string} langCode - Language code
     * @returns {string} Human-readable label
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
            'ru': 'Russian',
            'unknown': 'Default'
        };
        return languages[langCode] || langCode.toUpperCase();
    }

    /**
     * Determine subtitle format from filename
     * @param {string} filename - Filename
     * @returns {string} Format (srt, vtt, ass)
     */
    getSubtitleFormat(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        return ['srt', 'vtt', 'ass'].includes(ext) ? ext : 'srt';
    }

    /**
     * Convert subtitle content between formats if needed
     * @param {string} content - Original subtitle content
     * @param {string} fromFormat - Source format
     * @param {string} toFormat - Target format
     * @returns {string} Converted content
     */
    convertSubtitleFormat(content, fromFormat, toFormat) {
        if (fromFormat === toFormat) return content;

        try {
            if (fromFormat === 'srt' && toFormat === 'vtt') {
                // Basic SRT to VTT conversion
                let vttContent = 'WEBVTT\n\n';
                vttContent += content
                    .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4')
                    .replace(/(\d+)\r?\n(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})\r?\n/g, '\n$2\n');
                return vttContent;
            }
            
            // Add more conversions as needed
            return content;
        } catch (error) {
            console.error(`💥 [OnePace Subtitles] Format conversion failed:`, error);
            return content;
        }
    }

    /**
     * Test the connection to the One Pace subtitle repository
     * @returns {Promise<boolean>} Whether the repository is accessible
     */
    async testConnection() {
        try {
            console.log(`🧪 [OnePace Subtitles] Testing connection to repository...`);
            
            const response = await fetch(this.githubApiUrl, {
                headers: {
                    'User-Agent': 'OnePaceStremio-SubtitleBot/1.0',
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const isConnected = response.ok;
            console.log(`${isConnected ? '✅' : '❌'} [OnePace Subtitles] Repository connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
            
            return isConnected;
        } catch (error) {
            console.error(`💥 [OnePace Subtitles] Connection test failed:`, error);
            return false;
        }
    }
}

module.exports = OnePaceSubtitlesIntegration;
