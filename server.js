const { serveHTTP, getRouter } = require("stremio-addon-sdk");
const express = require('express');
const fs = require('fs');
const path = require('path');

// Import the addon interface
const addonInterface = require("./addon");

const app = express();
const port = process.env.PORT || 7000;

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve the beautiful configuration page at root
app.get('/', (req, res) => {
    const configPath = path.join(__dirname, 'configure.html');
    if (fs.existsSync(configPath)) {
        res.sendFile(configPath);
    } else {
        res.send(`
            <h1>🏴‍☠️ One Pace + Torbox Enhanced</h1>
            <p><strong>Addon is running!</strong></p>
            <p>Install: <code>${req.protocol}://${req.get('host')}/manifest.json</code></p>
        `);
    }
});

// Serve static files
app.use(express.static('.'));

// Get the Stremio router
const router = getRouter(addonInterface);

// Handle Torbox configuration URLs (like Torrentio does)
app.use('/torbox=:apiKey', (req, res, next) => {
    const apiKey = req.params.apiKey;
    
    console.log(`🚀 Torbox request with API key: ${apiKey.substring(0, 8)}...`);
    
    // Set the API key for this request
    process.env.TEMP_TORBOX_API_KEY = apiKey;
    
    // Route to the addon
    router(req, res, (err) => {
        // Clean up
        delete process.env.TEMP_TORBOX_API_KEY;
        if (err) next(err);
    });
});

// Handle regular addon routes
app.use('/', router);

app.listen(port, () => {
    console.log(`🚀 One Pace + Torbox Enhanced addon running on port ${port}`);
    console.log(`📝 Configuration page: http://localhost:${port}/`);
    console.log(`🔗 Basic: http://localhost:${port}/manifest.json`);
    console.log(`🔧 Torbox: http://localhost:${port}/torbox=4e5218d6-0908-4c49-abff-818de3e57817/manifest.json`);
});