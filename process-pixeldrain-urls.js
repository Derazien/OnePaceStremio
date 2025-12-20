const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

/**
 * Process extracted PixelDrain URLs and create episode mapping
 * This script processes the URLs extracted from onepace.net/en/watch
 * and creates a proper mapping structure for the OnePace Streams Integration
 */

// Arc name to episode ID prefix mapping
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
    'Post-Enies Lobby': 'EN', // Continues EN series
    'Thriller Bark': 'TB',
    'Sabaody Archipelago': 'SAB',
    'Amazon Lily': 'AM',
    'Impel Down': 'IM',
    "If You Could Go Anywhere... The Adventures of the Straw Hats": 'COVER_SHSS',
    'Marineford': 'MA',
    'Post-War': 'MA', // Continues MA series
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

/**
 * Fetch PixelDrain folder contents to get individual file IDs
 * @param {string} folderId - PixelDrain folder ID
 * @returns {Promise<Array>} Array of file objects
 */
async function fetchPixeldrainFolder(folderId) {
    try {
        const response = await fetch(`https://pixeldrain.com/api/list/${folderId}`);
        if (!response.ok) {
            console.error(`Failed to fetch folder ${folderId}: ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        return data.files || [];
    } catch (error) {
        console.error(`Error fetching folder ${folderId}:`, error.message);
        return [];
    }
}

/**
 * Get episode IDs for an arc from metadata
 * @param {string} arcName - Arc name
 * @returns {Array} Array of episode IDs
 */
function getEpisodeIdsForArc(arcName) {
    const prefix = arcToPrefix[arcName];
    if (!prefix) {
        console.warn(`Unknown arc: ${arcName}`);
        return [];
    }
    
    // Load metadata to find all episodes for this arc
    const metaPath = path.join(__dirname, 'meta/series/pp_onepace.json');
    if (!fs.existsSync(metaPath)) {
        console.warn(`Metadata file not found: ${metaPath}`);
        return [];
    }
    
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const episodes = meta.meta.videos.filter(video => video.id.startsWith(prefix));
    return episodes.map(ep => ep.id);
}

/**
 * Process extracted URLs and create mapping
 */
async function processPixeldrainUrls() {
    console.log('🔄 Processing PixelDrain URLs...');
    
    // Load extracted URLs
    const extractedPath = path.join(__dirname, 'pixeldrain-urls-extracted.json');
    if (!fs.existsSync(extractedPath)) {
        console.error('❌ Extracted URLs file not found. Please extract URLs first.');
        return;
    }
    
    const extracted = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
    
    // Group links by type and quality
    const mapping = {};
    
    for (const arcData of extracted) {
        const arcName = arcData.arc;
        console.log(`\n📺 Processing arc: ${arcName}`);
        
        // Get episode IDs for this arc
        const episodeIds = getEpisodeIdsForArc(arcName);
        console.log(`  Found ${episodeIds.length} episodes`);
        
        if (episodeIds.length === 0) continue;
        
        // Group links by quality and determine type (sub/dub/cc/extended)
        const variants = {};
        
        for (const link of arcData.links) {
            const quality = link.quality || '720p';
            // Determine type based on position in list (rough heuristic)
            // First 3 are usually sub, next 3 dub, etc.
            const index = arcData.links.indexOf(link);
            let type = 'English Subtitles';
            
            // More sophisticated type detection would need better extraction
            // For now, we'll use a simple heuristic
            if (arcData.links.length > 6) {
                if (index < arcData.links.length / 3) {
                    type = 'English Subtitles';
                } else if (index < (arcData.links.length * 2) / 3) {
                    type = 'English Dub';
                } else {
                    type = 'English Dub with Closed Captions';
                }
            } else if (arcData.links.length > 3) {
                type = index < arcData.links.length / 2 ? 'English Subtitles' : 'English Dub';
            }
            
            const key = `${type}_${quality}`;
            if (!variants[key]) {
                variants[key] = {
                    type: type,
                    qualities: []
                };
            }
            
            // Convert folder URL to direct file URL format
            // PixelDrain folder links use /l/ but we need individual file URLs
            // For now, we'll use the folder link and let the API handle it
            // Or we can fetch folder contents to get individual file IDs
            
            variants[key].qualities.push({
                resolution: quality,
                pixeldrainFolderId: link.folderId,
                pixeldrainUrl: link.url
            });
        }
        
        // Create mapping entry for first episode (we'll need to handle multi-episode arcs)
        const firstEpisodeId = episodeIds[0];
        if (!mapping[firstEpisodeId]) {
            mapping[firstEpisodeId] = {
                title: arcName,
                arcNumber: Object.keys(arcToPrefix).indexOf(arcName) + 1,
                variants: Object.values(variants)
            };
        }
    }
    
    // Save mapping
    const outputPath = path.join(__dirname, 'pixeldrain-episode-mapping.json');
    fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
    console.log(`\n✅ Saved mapping to ${outputPath}`);
    console.log(`📊 Mapped ${Object.keys(mapping).length} episodes`);
    
    return mapping;
}

// Run if called directly
if (require.main === module) {
    processPixeldrainUrls().catch(console.error);
}

module.exports = { processPixeldrainUrls, fetchPixeldrainFolder };

