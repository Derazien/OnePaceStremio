/**
 * Full integration test - tests the complete flow with multiple quality options
 */

const TorboxIntegrationSDK = require('./torbox-integration-sdk');
const PixeldrainIntegration = require('./pixeldrain-integration');

const TORBOX_API_KEY = process.argv[2] || '4e5218d6-0908-4c49-abff-818de3e57817';
// Test with Romance Dawn which has multiple qualities
const TEST_EPISODE_ID = 'RO_1'; // Romance Dawn episode 1 - has 480p, 720p, 1080p
const TEST_EPISODE_INFO = {
    id: 'RO_1',
    title: 'Romance Dawn, the Dawn of an Adventure',
    season: 1,
    episode: 1
};

async function testFullIntegration() {
    console.log('🚀 Testing Full Integration: PixelDrain → TorBox → Streams\n');
    console.log('='.repeat(60));
    console.log(`Episode: ${TEST_EPISODE_ID}`);
    console.log(`Title: ${TEST_EPISODE_INFO.title}\n`);

    try {
        // 1. Initialize TorBox SDK
        console.log('📦 Step 1: Initializing TorBox SDK...');
        const torboxIntegration = new TorboxIntegrationSDK(TORBOX_API_KEY);
        console.log('✅ TorBox SDK initialized\n');

        // 2. Initialize PixelDrain Integration with TorBox
        console.log('📦 Step 2: Initializing PixelDrain Integration...');
        const pixeldrainIntegration = new PixeldrainIntegration(torboxIntegration);
        console.log('✅ PixelDrain Integration initialized\n');

        // 3. Get streams for episode (should return multiple quality options)
        console.log('📦 Step 3: Getting streams for episode...');
        console.log('   (This should create web downloads for each quality/variant)\n');
        
        const streams = await pixeldrainIntegration.getStreamsForEpisode(TEST_EPISODE_ID, TEST_EPISODE_INFO);

        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Results:');
        console.log(`  Total streams found: ${streams.length}`);
        
        if (streams.length === 0) {
            console.log('\n❌ No streams found!');
            return;
        }

        console.log('\n📺 Stream Details:');
        streams.forEach((stream, index) => {
            console.log(`\n  Stream ${index + 1}:`);
            console.log(`    Title: ${stream.title}`);
            console.log(`    Quality: ${stream.quality}`);
            console.log(`    Type: ${stream.streamType}`);
            console.log(`    URL: ${stream.url ? stream.url.substring(0, 80) + '...' : 'MISSING'}`);
            if (stream.behaviorHints?.torboxDownloadId) {
                console.log(`    TorBox ID: ${stream.behaviorHints.torboxDownloadId}`);
            }
        });

        // 4. Verify all streams have valid URLs
        const validStreams = streams.filter(s => s.url && s.url.startsWith('http'));
        console.log(`\n✅ Valid streams with URLs: ${validStreams.length}/${streams.length}`);

        if (validStreams.length === streams.length) {
            console.log('\n🎉 SUCCESS! All streams have valid URLs!');
        } else {
            console.log('\n⚠️ WARNING: Some streams are missing URLs');
        }

    } catch (error) {
        console.error('\n💥 Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testFullIntegration();

