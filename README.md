# One Pace Stremio Addon

An **unofficial** Stremio addon for watching [One Pace](https://onepace.net/) episodes - a fan project that recuts the One Piece anime to match the manga pacing.

## ✨ Features

- 📺 **Complete One Pace Collection**: Access all available One Pace episodes
- 🚀 **Torbox Integration**: Optional premium streaming with instant playback
- 📱 **Cross-Platform**: Works on all Stremio-supported devices
- 🎯 **No Filler**: Only the essential story content from One Piece
- 🔄 **Auto-Updates**: Episodes are added as One Pace releases them

## 🆕 New: Torbox Integration

This addon now supports **Torbox** - a premium debrid service that provides instant streaming from cached torrents!

### Benefits of Torbox:
- ⚡ **Instant Playback**: No waiting for torrent downloads
- 🎬 **High Quality**: Direct HTTP streams in original quality  
- 🛡️ **Reliability**: Multiple stream sources for redundancy
- 🚫 **No P2P**: No need to seed or download torrents

### Setup Torbox (Optional):
```bash
npm run configure
```

Or manually set your API key:
```bash
TORBOX_API_KEY=your_api_key_here npm start
```

Get your API key from [torbox.app/settings](https://torbox.app/settings)

## 🚀 Installation

### Method 1: Install from URL (Recommended)
1. Open Stremio
2. Go to **Addons** → **Community Addons**  
3. Paste this URL: `https://your-deployment-url.vercel.app/manifest.json`
4. Click **Install**

### Method 2: Run Locally
```bash
# Clone the repository
git clone https://github.com/fedew04/OnePaceStremio.git
cd OnePaceStremio

# Install dependencies
npm install

# (Optional) Configure Torbox for enhanced streaming
npm run configure

# Start the addon
npm start
```

Then install from: `http://localhost:7000/manifest.json`

## 📺 How to Watch

1. **Install the addon** (see above)
2. **Open Stremio** and go to **Discover** → **Series**
3. **Find "One Pace"** in the series catalog
4. **Select an episode** and choose your preferred stream:
   - 📁 **Torrent Stream**: Traditional P2P streaming
   - 🚀 **Torbox Stream**: Instant premium streaming (if configured)

## 🗂️ Episode Organization

Episodes are organized by story arcs:

- **East Blue Saga**: Romance Dawn, Orange Town, Syrup Village, Baratie, Arlong Park
- **Arabasta Saga**: Reverse Mountain, Whisky Peak, Little Garden, Drum Island, Arabasta
- **Sky Island Saga**: Jaya, Skypeia
- **Water 7 Saga**: Long Ring Long Land, Water 7, Enies Lobby
- **And many more...**

Each episode includes:
- ✅ Proper episode titles
- ✅ Season/episode numbering
- ✅ High-quality video sources
- ✅ Multiple streaming options

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TORBOX_API_KEY` | Your Torbox API key for premium streaming | No |
| `PORT` | Server port (default: 7000) | No |

### Example `.env` file:
```env
TORBOX_API_KEY=your_torbox_api_key_here
PORT=7000
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Configure Torbox integration
npm run configure
```

The addon will be available at `http://localhost:7000`

## 📋 API Endpoints

- **Manifest**: `/manifest.json`
- **Catalog**: `/catalog/series/seriesCatalog.json`
- **Meta**: `/meta/series/pp_onepace.json`
- **Streams**: `/stream/series/{episode_id}.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## ⚖️ Legal

This addon provides access to fan-edited content from the One Pace project. All content is sourced from publicly available torrents. Users are responsible for complying with their local laws regarding torrenting and streaming.

## 📞 Support

- **One Pace Official**: [onepace.net](https://onepace.net/)
- **Torbox Support**: [support.torbox.app](https://support.torbox.app)
- **Issues**: [GitHub Issues](https://github.com/fedew04/OnePaceStremio/issues)

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Disclaimer**: This is an unofficial addon created by fans for fans. It is not affiliated with One Pace, Toei Animation, or Stremio.
