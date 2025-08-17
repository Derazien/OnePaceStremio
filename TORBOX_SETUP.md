# Torbox Integration Setup

This addon now supports **Torbox integration** for enhanced streaming experience! Torbox converts torrent files into direct HTTP streams, providing instant playback without P2P downloading.

## What is Torbox?

Torbox is a premium debrid service that:
- ✅ Provides instant streaming from cached torrents
- ✅ Offers high-speed direct downloads
- ✅ Eliminates the need for P2P downloading
- ✅ Works great with Stremio

## Setup Instructions

### 1. Get a Torbox Account
1. Visit [torbox.app](https://torbox.app)
2. Create an account and choose a subscription plan
3. Go to Settings → API and copy your API key

### 2. Configure the Addon

#### For Local Development:
1. Create a `.env` file in the project root:
```bash
TORBOX_API_KEY=your_api_key_here
```

#### For Production (Vercel/Netlify):
Add the environment variable `TORBOX_API_KEY` with your API key value.

#### For Docker:
```bash
docker run -e TORBOX_API_KEY=your_api_key_here -p 7000:7000 your-addon-image
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Addon
```bash
npm start
```

## How It Works

When you request a stream:

1. **Without Torbox**: Only torrent magnet links are provided (requires P2P downloading)
2. **With Torbox**: 
   - Original torrent stream (📁 Torrent)
   - Enhanced Torbox stream (🚀 Torbox - Instant/Cached)

The addon will automatically:
- Check if the torrent is cached on Torbox
- Create a download if needed
- Provide direct HTTP streaming URLs
- Fall back to regular torrents if Torbox fails

## Features

- **Instant Playback**: Cached torrents play immediately
- **High Quality**: Direct downloads maintain original quality  
- **Reliability**: Multiple stream sources for redundancy
- **No P2P**: No need to seed or download torrents locally

## Troubleshooting

### No Torbox streams appearing?
- Verify your API key is correct
- Check your Torbox account is active
- Ensure the torrent exists on Torbox's network

### Streams not playing?
- Some torrents may not be cached yet
- Try the regular torrent stream as fallback
- Check your Torbox account limits

## Cost

Torbox is a paid service. Check [torbox.app/pricing](https://torbox.app/pricing) for current rates.

## Support

- Torbox Support: [support.torbox.app](https://support.torbox.app)
- Addon Issues: Create an issue on this repository
