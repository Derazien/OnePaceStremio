const { serveHTTP, getRouter } = require("stremio-addon-sdk");
const express = require('express');
const fs = require("fs");
const path = require("path");

const addonInterface = require("./addon");

const app = express();
const port = process.env.PORT || 7000;

// Serve the configuration page at root
app.get('/', (req, res) => {
    const configPath = path.join(__dirname, 'configure.html');
    if (fs.existsSync(configPath)) {
        res.sendFile(configPath);
    } else {
        res.send(`
            <h1>One Pace + Torbox Enhanced</h1>
            <p>Addon is running! Install it in Stremio using:</p>
            <code>${req.protocol}://${req.get('host')}/manifest.json</code>
            <br><br>
            <a href="/configure.html">Configure Torbox</a>
        `);
    }
});

// Serve static files
app.use(express.static('.'));

// Get the Stremio addon router
const router = getRouter(addonInterface);

// Handle addon routes with configuration support
app.use((req, res, next) => {
    // Add query parameters to the request for the addon to use
    if (req.query.torboxApiKey) {
        req.torboxApiKey = req.query.torboxApiKey;
    }
    
    router(req, res, next);
});

app.listen(port, () => {
    console.log(`🚀 One Pace + Torbox Enhanced addon running on port ${port}`);
    console.log(`📝 Configuration page: http://localhost:${port}`);
    console.log(`🔗 Manifest URL: http://localhost:${port}/manifest.json`);
    console.log(`🔧 With Torbox: http://localhost:${port}/manifest.json?torboxApiKey=YOUR_API_KEY`);
});