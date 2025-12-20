const { addonBuilder } = require("stremio-addon-sdk");
const fs = require("fs");
const path = require("path");
const TorboxIntegration = require("./torbox-integration-sdk");
const OpenSubtitlesIntegration = require("./opensubtitles-integration");
const OnePaceSubtitlesIntegration = require("./onepace-subtitles-integration");
const OnePaceStreamsIntegration = require("./onepace-streams-integration");

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

// Helper function to fetch official One Pace video streams
async function fetchOfficialStreams(episodeInfo, torboxIntegration = null) {
    try {
        console.log(`🎌 [Official Streams] Checking for official One Pace streams for ${episodeInfo.id}...`);
        
        const onePaceStreams = new OnePaceStreamsIntegration(torboxIntegration);
        const officialStreams = await onePaceStreams.getOfficialStreams(episodeInfo);
        
        if (officialStreams.length > 0) {
            console.log(`✅ [Official Streams] Found ${officialStreams.length} official stream options`);
        } else {
            console.log(`ℹ️ [Official Streams] No official streams found for ${episodeInfo.id}`);
        }
        
        return officialStreams;
    } catch (error) {
        console.error(`💥 [Official Streams] Error fetching official streams:`, error);
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
        
        // Try to load full episode metadata from meta file for better PixelDrain integration
        const metaData = loadJsonFile("./meta/series/pp_onepace.json");
        if (metaData && metaData.meta && metaData.meta.videos) {
            const foundEpisode = metaData.meta.videos.find(video => video.id === episodeId);
            if (foundEpisode) {
                episodeInfo = foundEpisode;
                console.log(`✅ [Stream Handler] Found full metadata for ${episodeId}: ${episodeInfo.title}`);
            } else {
                episodeInfo = { title: `Episode ${id}`, id: episodeId };
                console.log(`⚠️ [Stream Handler] No metadata found, using basic info for ${episodeId}`);
            }
        } else {
            episodeInfo = { title: `Episode ${id}`, id: episodeId };
            console.log(`⚠️ [Stream Handler] Could not load meta file, using basic info for ${episodeId}`);
        }
    }

    // Now load the stream data for this episode
    const streamFilePath = `./stream/series/${episodeId}.json`;
    console.log(`📥 [Stream Handler] Loading stream data: ${streamFilePath}`);
    const streamData = loadJsonFile(streamFilePath);
    
    if (!streamData || !streamData.streams) {
        // Even if no cached stream data, we can still return PixelDrain streams if TorBox is available
        console.log(`⚠️ [Stream Handler] No cached stream data for ${episodeId}, will try PixelDrain/TorBox only`);
    }

    const streams = [];
    
    // Step 1: Check if Torbox integration is available - TORBOX IS THE NORTH STAR
    console.log(`🔍 [Stream] Checking for Torbox integration (NORTH STAR)...`);
    const torboxIntegration = getTorboxIntegration(args);
    const hasTorbox = !!torboxIntegration;
    
    if (hasTorbox) {
        console.log(`🚀 [Stream] TORBOX MODE (NORTH STAR): All streams via TorBox`);
        console.log(`🚀 [Stream] TorBox provides ALL metadata: hashes, OpenSubtitles, file details, etc.`);
    } else {
        console.log(`📁 [Stream] No TorBox token - torrent mode only`);
        console.log(`⚠️ [Stream] TorBox required for PixelDrain URLs - skipping official streams`);
    }
    
    // Step 2: Get official One Pace streams via PixelDrain/TorBox FIRST (HIGHEST PRIORITY)
    // TorBox is the source of truth - it provides everything
    let officialStreams = [];
    if (hasTorbox) {
        console.log(`🎌 [Stream] Fetching official One Pace streams via TorBox (NORTH STAR)...`);
        console.log(`📋 [Stream] Episode info: id=${episodeInfo.id}, title=${episodeInfo.title || 'N/A'}, season=${episodeInfo.season || 'N/A'}, episode=${episodeInfo.episode || 'N/A'}`);
        officialStreams = await fetchOfficialStreams(episodeInfo, torboxIntegration);
        console.log(`✅ [Stream] Got ${officialStreams.length} official PixelDrain streams from TorBox`);
    }
    
    // Step 3: Fetch external subtitles for this episode
    console.log(`🔍 [Stream] Fetching external subtitles...`);
    const externalSubtitles = await fetchExternalSubtitles(episodeInfo, args);
    
    // Step 4: Add official PixelDrain/TorBox streams first (HIGHEST PRIORITY)
    if (officialStreams.length > 0) {
        console.log(`🎌 [Stream] Adding ${officialStreams.length} official One Pace streams (HIGHEST PRIORITY)`);
        
        // Process each official stream - ensure all TorBox metadata (including opensubtitlesHash) is preserved
        officialStreams.forEach(stream => {
            // TorBox streams already include opensubtitlesHash in behaviorHints from TorBox response
            // Stremio will AUTOMATICALLY use opensubtitlesHash to fetch matching subtitles from OpenSubtitles
            if (stream.behaviorHints?.opensubtitlesHash) {
                console.log(`🔤 [Stream] Stream "${stream.title}" has opensubtitlesHash: ${stream.behaviorHints.opensubtitlesHash.substring(0, 16)}... - Stremio will auto-load subtitles`);
            } else {
                console.log(`⚠️ [Stream] Stream "${stream.title}" missing opensubtitlesHash - subtitles may not auto-match`);
            }
            
            // Add external subtitles as additional options (TorBox hash enables auto-matching via OpenSubtitles)
            if (externalSubtitles.length > 0) {
                stream.subtitles = [
                    ...(stream.subtitles || []), // Keep existing embedded subtitles from TorBox
                    ...externalSubtitles.map(sub => ({
                        url: sub.url,
                        lang: sub.lang,
                        label: sub.label
                    }))
                ];
            }
        });
        
        streams.push(...officialStreams);
    } else if (hasTorbox) {
        console.log(`⚠️ [Stream] No official PixelDrain streams found for ${episodeInfo.id} - TorBox may not have this episode yet`);
    }
    
    // Step 5: Add cached Torbox/Torrent streams as fallback (ONLY if we have cached stream data)
    if (streamData && streamData.streams && streamData.streams.length > 0) {
        console.log(`📁 [Stream] Processing ${streamData.streams.length} cached stream sources...`);
        for (const stream of streamData.streams) {
            if (stream.infoHash) {
                if (hasTorbox) {
                // TORBOX MODE: Provide Torbox streams as secondary option
                const fileIndex = stream.fileIdx || 0;
                console.log(`✅ [Stream] Processing Torbox stream for hash: ${stream.infoHash}, fileIdx: ${fileIndex}`);
                try {
                    const torboxStream = await torboxIntegration.getStreamUrl(stream.infoHash, fileIndex);
                    if (torboxStream) {
                        console.log(`🎉 [Stream] Torbox stream created successfully!`);
                        
                        // Update title to indicate priority (secondary to official)
                        torboxStream.title = `🚀 Torbox Premium - ${episodeInfo.title}`;
                        
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
                        console.log(`⚠️ [Stream] Torbox returned null stream`);
                    }
                } catch (error) {
                    console.error(`💥 [Stream] Error getting Torbox stream for ${stream.infoHash}:`, error);
                }
                
            } else {
                // TORRENT MODE: Provide torrent streams as fallback
                console.log(`📁 [Stream] Adding torrent stream for hash: ${stream.infoHash}`);
                
                const torrentStream = {
                    ...stream,
                    title: `📁 P2P Torrent - ${episodeInfo.title}`,
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
    }

    // Final summary
    const officialCount = officialStreams.length;
    const torboxCount = streams.filter(s => s.title && s.title.includes('Torbox')).length;
    const torrentCount = streams.filter(s => s.title && s.title.includes('Torrent')).length;
    const subtitleCount = externalSubtitles.length;
    
    console.log(`📊 [Stream Summary] Episode ${episodeInfo.id}:`);
    console.log(`  🎌 Official streams: ${officialCount}`);
    console.log(`  🚀 Torbox streams: ${torboxCount}`);
    console.log(`  📁 Torrent streams: ${torrentCount}`);
    console.log(`  🔤 Subtitle options: ${subtitleCount}`);
    console.log(`  📺 Total streams: ${streams.length}`);

    return Promise.resolve({ streams });
});

module.exports = builder.getInterface();
