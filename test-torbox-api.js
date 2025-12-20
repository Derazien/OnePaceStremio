/**
 * Test script for TorBox API web downloads
 * Tests creating web downloads from PixelDrain URLs and retrieving file info
 */

const fetch = require('node-fetch');
const FormData = require('form-data');

// Use the API key from logs for testing
const TORBOX_API_KEY = process.argv[2] || '4e5218d6-0908-4c49-abff-818de3e57817';

console.log(`🔑 Using TorBox API Key: ${TORBOX_API_KEY.substring(0, 8)}...\n`);

// Test PixelDrain folder URL (Impel Down)
const TEST_PIXELDRAIN_FOLDER_URL = 'https://pixeldrain.net/l/B7K3GLhN';
const TEST_FILE_INDEX = 0; // First file in folder

async function testWebDownloadCreation() {
    console.log('🧪 Test 1: Creating web download from PixelDrain folder URL');
    console.log(`📁 Folder URL: ${TEST_PIXELDRAIN_FOLDER_URL}`);
    console.log(`📋 File Index: ${TEST_FILE_INDEX}\n`);

    // Try multiple endpoint patterns based on TorBox API docs
    const endpoints = [
        { path: '/v1/api/webdl/createwebdownload', method: 'POST', bodyType: 'form', paramName: 'link' },
        { path: '/v1/api/webdl/createwebdownload', method: 'POST', bodyType: 'json', paramName: 'link' },
        { path: '/v1/api/webdownloads/create', method: 'POST', bodyType: 'form', paramName: 'url' },
        { path: '/v1/api/downloads/createwebdownload', method: 'POST', bodyType: 'form', paramName: 'url' },
    ];

    let response = null;
    let workingEndpoint = null;

    for (const endpoint of endpoints) {
        try {
            console.log(`📍 Trying: ${endpoint.method} ${endpoint.path} (${endpoint.bodyType})`);
            
            let headers = {
                'Authorization': `Bearer ${TORBOX_API_KEY}`
            };
            
            let body;
            
            const paramName = endpoint.paramName || 'url';
            
            if (endpoint.bodyType === 'form') {
                let form = new FormData();
                form.append(paramName, TEST_PIXELDRAIN_FOLDER_URL);
                headers = { ...headers, ...form.getHeaders() };
                body = form;
            } else {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify({ [paramName]: TEST_PIXELDRAIN_FOLDER_URL });
            }

            response = await fetch(`https://api.torbox.app${endpoint.path}`, {
                method: endpoint.method,
                headers: headers,
                body: body
            });

            console.log(`📡 Response: ${response.status} ${response.statusText}`);

            if (response.ok) {
                workingEndpoint = endpoint;
                console.log(`✅ Success! Working endpoint: ${endpoint.path}\n`);
                break;
            } else {
                const errorText = await response.text();
                if (errorText && errorText.length < 200) {
                    console.log(`   Error: ${errorText}`);
                }
            }
            console.log('');
        } catch (error) {
            console.log(`❌ Exception: ${error.message}\n`);
        }
    }

    if (!response || !response.ok) {
        console.error('❌ All endpoints failed\n');
        return null;
    }

    try {
        const data = await response.json();
        console.log('✅ Web download created successfully!');
        console.log('📊 Response data:', JSON.stringify(data, null, 2));

        const downloadId = data.data?.webdownload_id || data.data?.download_id || data.data?.id || data.webdownload_id || data.download_id || data.id;
        if (downloadId) {
            console.log(`\n📥 Download ID: ${downloadId}`);
            return downloadId;
        } else {
            console.error('❌ No download ID found in response');
            console.error('Available keys:', Object.keys(data.data || {}));
            return null;
        }
    } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        return null;
    }
}

async function testGetDownloadDetails(downloadId) {
    console.log('\n🧪 Test 2: Getting download details');
    console.log(`📥 Download ID: ${downloadId}\n`);

    // Maybe details are returned in the create response, or we need to use a different endpoint
    // Let's try listing downloads to see if we can find it
    const endpoints = [
        `/v1/api/webdl?webdownload_id=${downloadId}`,
        `/v1/api/webdl/${downloadId}`,
        `/v1/api/webdownloads/${downloadId}`,
        `/v1/api/downloads/${downloadId}`,
        `/v1/api/webdl`, // List all - might contain our download
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`📍 Trying: GET ${endpoint}`);
            let response = await fetch(`https://api.torbox.app${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${TORBOX_API_KEY}`
                }
            });

            console.log(`📡 Response: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                console.log('\n✅ Download details retrieved!');
                console.log('📊 Response data:', JSON.stringify(data, null, 2));
                return data.data || data;
            } else if (response.status !== 404) {
                const errorText = await response.text();
                console.log(`   Error: ${errorText}`);
            }
            console.log('');
        } catch (error) {
            console.log(`❌ Exception: ${error.message}\n`);
        }
    }

    console.log('⚠️ Could not get download details');
    return null;
}

async function testGetStreamUrl(downloadId, fileIndex = 0) {
    console.log('\n🧪 Test 3: Getting stream URL');
    console.log(`📥 Download ID: ${downloadId}`);
    console.log(`📋 File Index: ${fileIndex}\n`);

    // Based on error message, it needs 'web_id' parameter
    // Pattern: /v1/api/webdl/requestdl?token=X&web_id=Y&file_id=Z
    const endpoints = [
        `/v1/api/webdl/requestdl?token=${TORBOX_API_KEY}&web_id=${downloadId}&file_id=${fileIndex}&redirect=true`,
        `/v1/api/webdl/requestdl?token=${TORBOX_API_KEY}&webdownload_id=${downloadId}&file_id=${fileIndex}&redirect=true`,
        `/v1/api/webdl/requestdl?token=${TORBOX_API_KEY}&download_id=${downloadId}&file_id=${fileIndex}&redirect=true`,
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`📍 Trying: GET ${endpoint.split('?')[0]}`);
            let response = await fetch(`https://api.torbox.app${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${TORBOX_API_KEY}`
                },
                redirect: 'manual'
            });

            console.log(`📡 Response: ${response.status} ${response.statusText}`);

            if (response.status >= 300 && response.status < 400) {
                const streamUrl = response.headers.get('location') || response.url;
                console.log('\n✅ Stream URL (redirect):', streamUrl);
                return streamUrl;
            }

            if (response.ok) {
                const data = await response.json();
                console.log('\n✅ Stream URL retrieved!');
                console.log('📊 Response data:', JSON.stringify(data, null, 2));
                const streamUrl = data.data || data.url || data;
                return streamUrl;
            } else if (response.status !== 404) {
                const errorText = await response.text();
                console.log(`   Error: ${errorText}`);
            }
            console.log('');
        } catch (error) {
            console.log(`❌ Exception: ${error.message}\n`);
        }
    }

    console.log('⚠️ Could not get stream URL');
    return null;
}

async function runAllTests() {
    console.log('🚀 Starting TorBox API Tests\n');
    console.log('='.repeat(60));
    console.log('');

    // Test 1: Create web download
    const downloadId = await testWebDownloadCreation();
    
    if (!downloadId) {
        console.log('\n❌ Failed to create web download. Stopping tests.');
        return;
    }

    // Wait a bit for TorBox to process
    console.log('\n⏳ Waiting 3 seconds for TorBox to process...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: Get download details
    const downloadDetails = await testGetDownloadDetails(downloadId);

    // Test 3: Get stream URL
    const streamUrl = await testGetStreamUrl(downloadId, TEST_FILE_INDEX);

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log(`  Download ID: ${downloadId || 'FAILED'}`);
    console.log(`  Download Details: ${downloadDetails ? '✅ Retrieved' : '❌ Failed'}`);
    console.log(`  Stream URL: ${streamUrl ? '✅ Retrieved' : '❌ Failed'}`);
    
    if (streamUrl) {
        console.log(`\n🔗 Stream URL: ${streamUrl}`);
    }
    
    return { downloadId, downloadDetails, streamUrl };
}

// Run tests
runAllTests().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
