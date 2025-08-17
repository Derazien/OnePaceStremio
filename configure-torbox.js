#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const TorboxIntegration = require('./torbox-integration');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 One Pace Stremio Addon - Torbox Configuration');
console.log('================================================\n');

console.log('This script will help you configure Torbox integration.');
console.log('Torbox provides instant streaming from cached torrents.\n');

console.log('1. Create an account at https://torbox.app');
console.log('2. Go to Settings → API and copy your API key');
console.log('3. Enter it below\n');

rl.question('Enter your Torbox API key (or press Enter to skip): ', async (apiKey) => {
    if (!apiKey.trim()) {
        console.log('\n⚠️  Skipping Torbox configuration.');
        console.log('The addon will work with regular torrent streams only.');
        rl.close();
        return;
    }

    console.log('\n🔍 Verifying API key...');
    
    try {
        const torbox = new TorboxIntegration(apiKey.trim());
        const userInfo = await torbox.getUserInfo();
        
        if (userInfo) {
            console.log('✅ API key verified successfully!');
            console.log(`👤 Account: ${userInfo.email || 'Unknown'}`);
            console.log(`📊 Plan: ${userInfo.plan || 'Unknown'}`);
            
            // Create .env file
            const envContent = `# Torbox API Key\nTORBOX_API_KEY=${apiKey.trim()}\n\n# Server Port\nPORT=7000\n`;
            
            fs.writeFileSync('.env', envContent);
            console.log('\n📝 Created .env file with your configuration.');
            console.log('\n🎉 Setup complete! You can now start the addon with: npm start');
            console.log('\n💡 Tip: You\'ll now see both torrent and Torbox streams when watching episodes.');
            
        } else {
            console.log('❌ Invalid API key. Please check and try again.');
            console.log('Make sure you copied the full API key from https://torbox.app/settings');
        }
        
    } catch (error) {
        console.log('❌ Error verifying API key:', error.message);
        console.log('Please check your internet connection and API key.');
    }
    
    rl.close();
});

rl.on('close', () => {
    console.log('\n👋 Configuration finished.');
    process.exit(0);
});
