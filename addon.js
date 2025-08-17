const { addonBuilder } = require("stremio-addon-sdk");
const fs = require("fs");
const path = require("path");
const TorboxIntegration = require("./torbox-integration");

// Load manifest
const manifest = require("./manifest.json");

// Create addon builder
const builder = new addonBuilder(manifest);

// Helper function to load JSON file
function loadJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
        return null;
    }
}

// Helper function to get Torbox integration for a specific request
function getTorboxIntegration(req) {
    // Try to get API key from various sources
    const apiKey = req?.query?.torboxApiKey || 
                   req?.torboxApiKey || 
                   req?.config?.torboxApiKey || 
                   process.env.TORBOX_API_KEY;
    
    if (apiKey) {
        return new TorboxIntegration(apiKey);
    }
    
    return null;
}

// Define catalog handler
builder.defineCatalogHandler(({ type, id }) => {
    if (type === "series" && id === "seriesCatalog") {
        const catalogData = loadJsonFile("./catalog/series/seriesCatalog.json");
        return Promise.resolve(catalogData || { metas: [] });
    }
    return Promise.resolve({ metas: [] });
});

// Define meta handler
builder.defineMetaHandler(({ type, id }) => {
    if (type === "series" && id === "pp_onepace") {
        const metaData = loadJsonFile("./meta/series/pp_onepace.json");
        return Promise.resolve(metaData || { meta: {} });
    }
    return Promise.resolve({ meta: {} });
});

// Define stream handler  
builder.defineStreamHandler(async (args) => {
    const { type, id, req } = args;
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
            const torboxIntegration = getTorboxIntegration(req);
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
