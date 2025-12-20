const fs = require('fs');
const path = require('path');

/**
 * Create episode mapping from PixelDrain URLs
 * Maps each episode to its PixelDrain folder URLs with file indices
 */

// Arc name to episode prefix mapping
const arcToPrefix = {
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
    'Post-War': 'MA',
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

function createEpisodeMapping() {
    console.log('🔄 Creating episode mapping from PixelDrain URLs...');
    
    // Load complete PixelDrain URLs
    const urlsPath = path.join(__dirname, 'pixeldrain-urls-complete.json');
    const pixeldrainData = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));
    
    // Load metadata to get all episode IDs
    const metaPath = path.join(__dirname, 'meta/series/pp_onepace.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const episodes = meta.meta.videos;
    
    // Create mapping
    const mapping = {};
    
    // Group episodes by arc prefix
    const episodesByArc = {};
    episodes.forEach(ep => {
        const prefix = ep.id.split('_')[0];
        if (!episodesByArc[prefix]) {
            episodesByArc[prefix] = [];
        }
        episodesByArc[prefix].push(ep);
    });
    
    // Process each arc from PixelDrain data
    pixeldrainData.forEach(arcData => {
        const arcName = arcData.arc;
        const prefix = arcToPrefix[arcName];
        
        if (!prefix) {
            console.warn(`⚠️ Unknown arc: ${arcName}`);
            return;
        }
        
        const arcEpisodes = episodesByArc[prefix] || [];
        if (arcEpisodes.length === 0) {
            console.warn(`⚠️ No episodes found for arc: ${arcName} (${prefix})`);
            return;
        }
        
        console.log(`📺 Processing ${arcName}: ${arcEpisodes.length} episodes`);
        
        // For each episode in this arc
        arcEpisodes.forEach(episode => {
            const episodeId = episode.id;
            const episodeNumber = parseInt(episodeId.split('_')[1]) - 1; // 0-based file index
            
            // Create streams array for this episode
            const streams = [];
            
            // Process each variant
            arcData.variants.forEach(variant => {
                variant.qualities.forEach(quality => {
                    streams.push({
                        source: 'pixeldrain',
                        folderId: quality.folderId,
                        url: quality.url,
                        fileIdx: episodeNumber,
                        quality: quality.quality,
                        variant: variant.type,
                        label: quality.label
                    });
                });
            });
            
            if (streams.length > 0) {
                mapping[episodeId] = {
                    episodeId: episodeId,
                    title: episode.title,
                    season: episode.season,
                    episode: episode.episode,
                    arc: arcName,
                    streams: streams
                };
            }
        });
    });
    
    // Save mapping
    const outputPath = path.join(__dirname, 'pixeldrain-episode-mapping.json');
    fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
    
    console.log(`\n✅ Saved mapping to ${outputPath}`);
    console.log(`📊 Mapped ${Object.keys(mapping).length} episodes`);
    console.log(`📁 Total stream sources: ${Object.values(mapping).reduce((sum, ep) => sum + ep.streams.length, 0)}`);
    
    return mapping;
}

if (require.main === module) {
    createEpisodeMapping();
}

module.exports = { createEpisodeMapping };

