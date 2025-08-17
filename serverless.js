const { getRouter } = require("stremio-addon-sdk");
const addonInterface = require("./addon");

// Get the Stremio router for serverless deployment
const router = getRouter(addonInterface);

// Serverless function handler for Vercel
module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    console.log(`Serverless request: ${req.url}`);
    
    // Handle Torbox configuration URLs
    const url = req.url || '';
    const torboxMatch = url.match(/^\/torbox=([a-f0-9-]{36})(\/.*)?$/i);
    
    if (torboxMatch) {
        const apiKey = torboxMatch[1];
        const cleanPath = torboxMatch[2] || '/manifest.json';
        
        console.log(`🚀 Torbox serverless request: ${apiKey.substring(0, 8)}... → ${cleanPath}`);
        
        // Set API key for this request BEFORE calling the router
        process.env.TEMP_TORBOX_API_KEY = apiKey;
        
        // Modify the request URL to the clean path
        req.url = cleanPath;
        
        console.log(`Modified request URL to: ${req.url}`);
    }
    
    // Route the request
    router(req, res, (err) => {
        // Clean up temp API key
        if (process.env.TEMP_TORBOX_API_KEY) {
            delete process.env.TEMP_TORBOX_API_KEY;
        }
        
        if (err) {
            console.error('Router error:', err);
            res.statusCode = 500;
            res.end('Internal server error');
        } else {
            // 404 fallback
            res.statusCode = 404;
            res.end('Not found');
        }
    });
};