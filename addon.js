const { addonBuilder } = require("stremio-addon-sdk");
const fs = require("fs");
const path = require("path");
const TorboxIntegration = require("./torbox-integration-sdk");
const OpenSubtitlesIntegration = require("./opensubtitles-integration");
const OnePaceSubtitlesIntegration = require("./onepace-subtitles-integration");

// Load manifest
const manifest = require("./manifest.json");

// Create addon builder
const builder = new addonBuilder(manifest);



// Helper function to load JSON file with Vercel compatibility
function loadJsonFile(filePath) {
    try {
        // First try the normal path
        const absolutePath = path.resolve(__dirname, filePath);
        console.log(`Trying to load: ${absolutePath}`);
        
        const data = fs.readFileSync(absolutePath, 'utf8');
        const parsed = JSON.parse(data);
        
        console.log(`Successfully loaded ${filePath}`);
        return parsed;
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
        
        // For Vercel, try to load using require() as fallback
        try {
            console.log(`Trying require() fallback for ${filePath}`);
            const requirePath = filePath.startsWith('./') ? filePath : `./${filePath}`;
            const data = require(requirePath);
            console.log(`Successfully loaded via require: ${filePath}`);
            return data;
        } catch (requireError) {
            console.error(`Require fallback also failed:`, requireError.message);
            return null;
        }
    }
}

// Helper function to get Torbox integration for a specific request
function getTorboxIntegration(args) {
    console.log(`🔑 [API Key] Checking for Torbox API key...`);
    console.log(`🔑 [API Key] args.config:`, args?.config);
    console.log(`🔑 [API Key] TEMP_TORBOX_API_KEY:`, process.env.TEMP_TORBOX_API_KEY ? `${process.env.TEMP_TORBOX_API_KEY.substring(0, 8)}...` : 'not set');
    console.log(`🔑 [API Key] TORBOX_API_KEY:`, process.env.TORBOX_API_KEY ? `${process.env.TORBOX_API_KEY.substring(0, 8)}...` : 'not set');
    
    // Try to get API key from various sources
    const apiKey = args?.config?.torboxApiKey || 
                   process.env.TEMP_TORBOX_API_KEY ||
                   process.env.TORBOX_API_KEY;
    
    if (apiKey && apiKey.trim() !== '') {
        console.log(`✅ [API Key] Found API key: ${apiKey.substring(0, 8)}... - Creating Torbox integration`);
        return new TorboxIntegration(apiKey);
    }
    
    console.log(`❌ [API Key] No valid API key found`);
    return null;
}

// Helper function to get OpenSubtitles integration
function getOpenSubtitlesIntegration(args) {
    const apiKey = args?.config?.openSubtitlesApiKey || process.env.OPENSUBTITLES_API_KEY;
    console.log(`🔤 [OpenSubtitles] ${apiKey ? 'Using API v3' : 'Using free API v1'}`);
    return new OpenSubtitlesIntegration(apiKey);
}

// Helper function to get preferred subtitle languages
function getSubtitleLanguages(args) {
    const config = args?.config?.subtitleLanguages || 'en';
    console.log(`🌐 [Subtitles] Language config: ${config}`);
    
    if (config === 'all') {
        return ['en', 'es', 'fr', 'pt', 'de', 'it', 'ja', 'ko', 'zh'];
    }
    
    return config.split(',').map(lang => lang.trim());
}

// Helper function to fetch external subtitles for an episode
async function fetchExternalSubtitles(episodeInfo, args) {
    try {
        const languages = getSubtitleLanguages(args);
        console.log(`🔍 [Subtitles] Searching for: ${episodeInfo.title} in languages: ${languages.join(', ')}`);
        
        let allSubtitles = [];
        
        // 1. PRIORITY: Get official One Pace subtitles first
        console.log(`🎌 [Subtitles] Checking for official One Pace subtitles...`);
        const onePaceSubtitles = new OnePaceSubtitlesIntegration();
        const officialSubtitles = await onePaceSubtitles.getOfficialSubtitles(episodeInfo, languages);
        
        if (officialSubtitles.length > 0) {
            console.log(`✅ [Subtitles] Found ${officialSubtitles.length} official One Pace subtitles`);
            allSubtitles.push(...officialSubtitles);
        } else {
            console.log(`ℹ️ [Subtitles] No official One Pace subtitles found for ${episodeInfo.id}`);
        }
        
        // 2. FALLBACK: Get OpenSubtitles as additional options
        console.log(`🔍 [Subtitles] Searching OpenSubtitles for additional options...`);
        const openSubtitles = getOpenSubtitlesIntegration(args);
        const communitySubtitles = await openSubtitles.searchSubtitles(episodeInfo, languages);
        
        if (communitySubtitles.length > 0) {
            console.log(`✅ [Subtitles] Found ${communitySubtitles.length} community subtitles from OpenSubtitles`);
            // Mark community subtitles with lower priority
            const markedCommunitySubtitles = communitySubtitles.map(sub => ({
                ...sub,
                label: sub.label.replace('OpenSubtitles', 'Community'),
                rating: (sub.rating || 0) * 0.8, // Slightly lower priority than official
            }));
            allSubtitles.push(...markedCommunitySubtitles);
        }
        
        // Sort by priority (official One Pace first, then by rating)
        allSubtitles.sort((a, b) => {
            // Official One Pace subtitles always come first
            if (a.source === 'onepace-official' && b.source !== 'onepace-official') return -1;
            if (b.source === 'onepace-official' && a.source !== 'onepace-official') return 1;
            
            // Within same source type, sort by rating
            return (b.rating || 0) - (a.rating || 0);
        });
        
        // Limit total results to avoid overwhelming users
        const limitedSubtitles = allSubtitles.slice(0, 15);
        
        console.log(`📊 [Subtitles] Total subtitle options: ${limitedSubtitles.length} (${officialSubtitles.length} official, ${communitySubtitles.length} community)`);
        
        return limitedSubtitles;
    } catch (error) {
        console.error(`💥 [Subtitles] Error fetching external subtitles:`, error);
        return [];
    }
}

// Define catalog handler
builder.defineCatalogHandler(({ type, id }) => {
    console.log(`📋 [Catalog] Request: type=${type}, id=${id}`);
    
    if (type === "series" && id === "seriesCatalog") {
        const catalogData = loadJsonFile("./catalog/series/seriesCatalog.json");
        
        if (!catalogData) {
            console.log(`❌ [Catalog] Failed to load catalog file`);
            return Promise.resolve({ metas: [] });
        }
        
        console.log(`✅ [Catalog] Loaded catalog with ${catalogData.metas?.length || 0} items`);
        return Promise.resolve(catalogData);
    }
    
    console.log(`❌ [Catalog] Unknown catalog request: ${type}:${id}`);
    return Promise.resolve({ metas: [] });
});

// Define meta handler
builder.defineMetaHandler(({ type, id }) => {
    console.log(`📖 [Meta] Request: type=${type}, id=${id}`);
    
    if (type === "series" && id === "pp_onepace") {
        const metaData = loadJsonFile("./meta/series/pp_onepace.json");
        
        if (!metaData) {
            console.log(`❌ [Meta] Failed to load meta file`);
            return Promise.resolve({ meta: {} });
        }
        
        console.log(`✅ [Meta] Loaded meta data with ${metaData.meta?.videos?.length || 0} episodes`);
        return Promise.resolve(metaData);
    }
    
    console.log(`❌ [Meta] Unknown meta request: ${type}:${id}`);
    return Promise.resolve({ meta: {} });
});

// Define stream handler  
builder.defineStreamHandler(async (args) => {
    const { type, id } = args;
    console.log(`🎬 [Stream Handler] Request: type=${type}, id=${id}`);
    
    if (type !== "series") {
        console.log(`❌ [Stream Handler] Wrong type: ${type}`);
        return Promise.resolve({ streams: [] });
    }

    let episodeId = null;
    let episodeInfo = null;
    
    // Handle BOTH scenarios:
    // 1. Direct file requests: "WS_3" 
    // 2. Dynamic requests: "pp_onepace:16:3"
    
    if (id.includes(":")) {
        // Scenario 2: Dynamic format pp_onepace:season:episode
        console.log(`🔍 [Stream Handler] Dynamic format detected: ${id}`);
        
        const parts = id.split(":");
        if (parts.length < 3 || parts[0] !== "pp_onepace") {
            console.log(`❌ [Stream Handler] Invalid dynamic ID format: ${id}`);
            return Promise.resolve({ streams: [] });
        }

        const season = parseInt(parts[1]);
        const episode = parseInt(parts[2]);
        console.log(`📺 [Stream Handler] Looking for Season ${season}, Episode ${episode}`);
        
        // Load metadata to find episode ID
        const metaData = loadJsonFile("./meta/series/pp_onepace.json");
        if (!metaData || !metaData.meta || !metaData.meta.videos) {
            console.log(`❌ [Stream Handler] No metadata available`);
            return Promise.resolve({ streams: [] });
        }

        // Find the episode with matching season and episode number
        episodeInfo = metaData.meta.videos.find(video => 
            video.season === season && video.episode === episode
        );

        if (!episodeInfo) {
            console.log(`❌ [Stream Handler] Episode not found: Season ${season}, Episode ${episode}`);
            return Promise.resolve({ streams: [] });
        }
        
        episodeId = episodeInfo.id;
        console.log(`✅ [Stream Handler] Found episode: ${episodeId} - ${episodeInfo.title}`);
        
    } else {
        // Scenario 1: Direct file format "WS_3"
        console.log(`🔍 [Stream Handler] Static file format detected: ${id}`);
        episodeId = id;
        episodeInfo = { title: `Episode ${id}`, id: episodeId };
        console.log(`✅ [Stream Handler] Using direct episode ID: ${episodeId}`);
    }

    // Now load the stream data for this episode
    const streamFilePath = `./stream/series/${episodeId}.json`;
    console.log(`📥 [Stream Handler] Loading stream data: ${streamFilePath}`);
    const streamData = loadJsonFile(streamFilePath);
    
    if (!streamData || !streamData.streams) {
        return Promise.resolve({ streams: [] });
    }

    const streams = [];
    
    // Check if Torbox integration is available first
    console.log(`🔍 [Stream] Checking for Torbox integration...`);
    const torboxIntegration = getTorboxIntegration(args);
    const hasTorbox = !!torboxIntegration;
    
    if (hasTorbox) {
        console.log(`🚀 [Stream] Torbox mode: Will only provide Torbox streams (no torrents)`);
    } else {
        console.log(`📁 [Stream] Torrent mode: Will provide torrent streams only`);
    }
    
    // Fetch external subtitles for this episode
    console.log(`🔍 [Stream] Fetching external subtitles...`);
    const externalSubtitles = await fetchExternalSubtitles(episodeInfo, args);
    
    // Process each stream
    for (const stream of streamData.streams) {
        if (stream.infoHash) {
            
            if (hasTorbox) {
                // TORBOX MODE: Only provide Torbox streams
                const fileIndex = stream.fileIdx || 0;
                console.log(`✅ [Stream] Processing Torbox stream for hash: ${stream.infoHash}, fileIdx: ${fileIndex}`);
                try {
                    const torboxStream = await torboxIntegration.getStreamUrl(stream.infoHash, fileIndex);
                    if (torboxStream) {
                        console.log(`🎉 [Stream] Torbox stream created successfully!`);
                        
                        // Enhance stream with episode-specific metadata for Local Files detection
                        torboxStream.name = episodeInfo.title || `One Pace Episode ${stream.infoHash.substring(0, 8)}`;
                        torboxStream.episode = episodeInfo.episode;
                        torboxStream.season = episodeInfo.season;
                        
                        // Add external subtitles to Torbox stream
                        if (externalSubtitles.length > 0) {
                            console.log(`🔤 [Stream] Adding ${externalSubtitles.length} external subtitles to Torbox stream`);
                            torboxStream.subtitles = [
                                ...(torboxStream.subtitles || []), // Keep existing embedded subtitles
                                ...externalSubtitles.map(sub => ({
                                    url: sub.url,
                                    lang: sub.lang,
                                    label: sub.label
                                }))
                            ];
                        }
                        
                        streams.push(torboxStream);
                    } else {
                        console.log(`⚠️ [Stream] Torbox returned null stream - no fallback torrent provided`);
                    }
                } catch (error) {
                    console.error(`💥 [Stream] Error getting Torbox stream for ${stream.infoHash}:`, error);
                    // Don't add torrent fallback - user has Torbox, they expect premium experience
                }
                
            } else {
                // TORRENT MODE: Only provide torrent streams  
                console.log(`📁 [Stream] Adding torrent stream for hash: ${stream.infoHash}`);
                
                const torrentStream = {
                    ...stream,
                    title: `📁 Torrent - ${episodeInfo.title}`,
                    // Enhanced metadata for Local Files addon detection
                    name: episodeInfo.title || `One Pace Episode ${stream.infoHash.substring(0, 8)}`,
                    filename: `OnePace_${stream.infoHash.substring(0, 8)}.mkv`,
                    episode: episodeInfo.episode,
                    season: episodeInfo.season,
                    behaviorHints: {
                        bingeGroup: "onepace-torrent",
                        // Content identifiers for cross-addon recognition
                        contentId: `onepace_${stream.infoHash}`,
                        torrentHash: stream.infoHash,
                        localFilename: `One Pace - ${episodeInfo.title || 'Episode'}.mkv`
                    }
                };
                
                // Add external subtitles to torrent stream
                if (externalSubtitles.length > 0) {
                    console.log(`🔤 [Stream] Adding ${externalSubtitles.length} external subtitles to torrent stream`);
                    torrentStream.subtitles = externalSubtitles.map(sub => ({
                        url: sub.url,
                        lang: sub.lang,
                        label: sub.label
                    }));
                }
                
                streams.push(torrentStream);
            }
        }
    }

    return Promise.resolve({ streams });
});

module.exports = builder.getInterface();
