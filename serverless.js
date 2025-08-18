const { getRouter } = require("stremio-addon-sdk");
const fs = require("fs");
const path = require("path");
const addonInterface = require("./addon");

const router = getRouter(addonInterface);

module.exports = function(req, res) {
    console.log(`🌐 [Serverless] Incoming request: ${req.url}`);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Handle root path - serve configuration page
    if (req.url === '/' || req.url === '') {
        try {
            const configPath = path.join(__dirname, 'configure.html');
            const configHtml = fs.readFileSync(configPath, 'utf8');
            res.setHeader('Content-Type', 'text/html');
            res.end(configHtml);
            return;
        } catch (error) {
            console.error('❌ [Serverless] Error loading configure.html:', error);
            res.setHeader('Content-Type', 'text/html');
            res.end(`
                <h1>🏴‍☠️ One Pace + Torbox Enhanced</h1>
                <p><strong>Addon is running successfully!</strong></p>
                <p><strong>Basic installation:</strong></p>
                <code>https://${req.headers.host}/manifest.json</code>
                <p><strong>With Torbox:</strong></p>
                <code>https://${req.headers.host}/torbox=YOUR_API_KEY/manifest.json</code>
                <p><strong>Example with your API key:</strong></p>
                <code>https://${req.headers.host}/torbox=4e5218d6-0908-4c49-abff-818de3e57817/manifest.json</code>
            `);
            return;
        }
    }
    
    // Extract Torbox API key from URL if present
    const torboxMatch = req.url.match(/^\/torbox=([a-f0-9-]{36})(\/.*)?$/i);
    
    if (torboxMatch) {
        const apiKey = torboxMatch[1];
        const cleanPath = torboxMatch[2] || '/manifest.json';
        
        console.log(`🚀 [Serverless] Torbox mode: ${apiKey.substring(0, 8)}... → ${cleanPath}`);
        
        // Set API key for the addon to use
        process.env.TEMP_TORBOX_API_KEY = apiKey;
        
        // Clean the URL
        req.url = cleanPath;
    }
    
    console.log(`🔄 [Serverless] Routing to addon: ${req.url}`);
    
    // Route everything to the addon
    router(req, res, function() {
        // Clean up temp API key
        if (process.env.TEMP_TORBOX_API_KEY) {
            delete process.env.TEMP_TORBOX_API_KEY;
        }
        
        console.log(`❓ [Serverless] Route not handled: ${req.url}`);
        res.statusCode = 404;
        res.end('Not found');
    });
};
