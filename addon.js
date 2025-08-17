const { addonBuilder } = require("stremio-addon-sdk");
const fs = require("fs");
const path = require("path");
const TorboxIntegration = require("./torbox-integration");

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
    // Try to get API key from various sources
    const apiKey = args?.config?.torboxApiKey || 
                   process.env.TEMP_TORBOX_API_KEY ||
                   process.env.TORBOX_API_KEY;
    
    if (apiKey && apiKey.trim() !== '') {
        console.log(`Creating Torbox integration with key: ${apiKey.substring(0, 8)}...`);
        return new TorboxIntegration(apiKey);
    }
    
    return null;
}

// Define catalog handler
builder.defineCatalogHandler(({ type, id }) => {
    console.log(`Catalog request: type=${type}, id=${id}`);
    
    if (type === "series" && id === "seriesCatalog") {
        const catalogData = loadJsonFile("./catalog/series/seriesCatalog.json");
        
        // If file loading failed, provide a hardcoded fallback
        if (!catalogData) {
            console.log("File loading failed, using hardcoded catalog");
            return Promise.resolve({
                metas: [
                    {
                        type: "series",
                        id: "pp_onepace",
                        name: "One Pace + Torbox Enhanced",
                        poster: "https://i.pinimg.com/originals/eb/85/c4/eb85c4376b474030b80afa80ad1cd13a.jpg",
                        genres: ["Adventure", "Fantasy"]
                    }
                ]
            });
        }
        
        console.log(`Returning catalog with ${catalogData.metas?.length || 0} items`);
        return Promise.resolve(catalogData);
    }
    return Promise.resolve({ metas: [] });
});

// Define meta handler
builder.defineMetaHandler(({ type, id }) => {
    console.log(`Meta request: type=${type}, id=${id}`);
    
    if (type === "series" && id === "pp_onepace") {
        const metaData = loadJsonFile("./meta/series/pp_onepace.json");
        
        if (!metaData) {
            console.log("Meta file loading failed, returning empty meta");
            return Promise.resolve({ meta: {} });
        }
        
        console.log(`Returning meta data with ${metaData.meta?.videos?.length || 0} episodes`);
        return Promise.resolve(metaData);
    }
    
    console.log(`Unknown meta request: ${type}:${id}`);
    return Promise.resolve({ meta: {} });
});

// Define stream handler  
builder.defineStreamHandler(async (args) => {
    const { type, id } = args;
    if (type !== "series") {
        return Promise.resolve({ streams: [] });
    }

    // Extract episode ID from the format: pp_onepace:season:episode
    const parts = id.split(":");
    if (parts.length < 3 || parts[0] !== "pp_onepace") {
        return Promise.resolve({ streams: [] });
    }

    const season = parseInt(parts[1]);
    const episode = parseInt(parts[2]);

    // Load the metadata to find the correct episode ID
    const metaData = loadJsonFile("./meta/series/pp_onepace.json");
    if (!metaData || !metaData.meta || !metaData.meta.videos) {
        return Promise.resolve({ streams: [] });
    }

    // Find the episode with matching season and episode number
    const episodeInfo = metaData.meta.videos.find(video => 
        video.season === season && video.episode === episode
    );

    if (!episodeInfo) {
        return Promise.resolve({ streams: [] });
    }

    // Load the stream data for this episode
    const streamFilePath = `./stream/series/${episodeInfo.id}.json`;
    const streamData = loadJsonFile(streamFilePath);
    
    if (!streamData || !streamData.streams) {
        return Promise.resolve({ streams: [] });
    }

    const streams = [];
    
    // Process each stream
    for (const stream of streamData.streams) {
        if (stream.infoHash) {
            // Add original torrent stream
            streams.push({
                ...stream,
                title: `📁 Torrent - ${episodeInfo.title}`,
                behaviorHints: {
                    bingeGroup: "onepace-torrent"
                }
            });

            // Try to add Torbox stream if API key is available
            const torboxIntegration = getTorboxIntegration(args);
            if (torboxIntegration) {
                try {
                    const torboxStream = await torboxIntegration.getStreamUrl(stream.infoHash, stream.fileIdx || 0);
                    if (torboxStream) {
                        streams.push(torboxStream);
                    }
                } catch (error) {
                    console.error(`Error getting Torbox stream for ${stream.infoHash}:`, error);
                }
            }
        }
    }

    return Promise.resolve({ streams });
});

module.exports = builder.getInterface();
