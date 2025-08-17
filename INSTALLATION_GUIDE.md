# 📺 One Pace + Torbox Enhanced - Installation Guide

This guide will walk you through installing the **One Pace + Torbox Enhanced** addon on Stremio step by step.

## 🎯 What You'll Get

After installation, you'll have access to:
- ✅ **All One Pace episodes** in proper viewing order
- ✅ **Dual streaming options**: Regular torrents + Premium Torbox streams
- ✅ **Instant playback** (with Torbox configuration)
- ✅ **High-quality video** in multiple resolutions
- ✅ **No conflicts** with the original One Pace addon

---

## 🚀 Installation Methods

Choose the method that works best for you:

### Method 1: Deploy to Vercel (Recommended - Free & Easy)

This is the easiest way to get your addon online and accessible from anywhere.

#### Step 1: Prepare Your Code
1. **Download/Clone** this repository to your computer
2. **Optional**: Configure Torbox by running `npm run configure` if you have a Torbox account

#### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up for a free account
2. Click **"New Project"**
3. Import your repository (upload the folder or connect from GitHub)
4. **Important**: Set the following build settings:
   - **Framework Preset**: `Other`
   - **Build Command**: `npm install`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

#### Step 3: Add Environment Variables (Optional - For Torbox)
If you have a Torbox account:
1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add: `TORBOX_API_KEY` with your API key value
3. Redeploy the project

#### Step 4: Get Your Addon URL
1. After deployment, Vercel will give you a URL like: `https://your-project.vercel.app`
2. Your addon manifest URL will be: `https://your-project.vercel.app/manifest.json`

---

### Method 2: Run Locally

Perfect for testing or if you prefer to run it on your own computer.

#### Step 1: Setup
```bash
# Navigate to the project folder
cd OnePaceStremio

# Install dependencies
npm install

# (Optional) Configure Torbox
npm run configure

# Start the server
npm start
```

#### Step 2: Get Your Local URL
- Your addon will be available at: `http://localhost:7000`
- Manifest URL: `http://localhost:7000/manifest.json`

---

### Method 3: Deploy to Other Platforms

You can also deploy to:
- **Netlify**: Similar to Vercel, supports serverless functions
- **Railway**: Good for persistent hosting
- **Heroku**: Classic platform (has free tier limitations)

---

## 📱 Installing in Stremio

Once your addon is deployed/running, follow these steps:

### Step 1: Open Stremio
1. Launch **Stremio** on your device
2. Make sure you're **logged in** to your Stremio account

### Step 2: Access Add-ons Section
1. Click on the **puzzle piece icon** (🧩) in the top navigation
2. This opens the **Add-ons** page

### Step 3: Install Community Add-on
1. Click **"Community Add-ons"** at the top
2. You'll see an input field asking for an add-on URL

### Step 4: Enter Your Addon URL
Paste your addon manifest URL:

**For Vercel deployment:**
```
https://your-project-name.vercel.app/manifest.json
```

**For local installation:**
```
http://localhost:7000/manifest.json
```

### Step 5: Install the Add-on
1. Click **"Install"** button
2. You should see: **"One Pace + Torbox Enhanced"** in your installed add-ons
3. The addon will show version **4.0.0** (different from the original)

### Step 6: Verify Installation
1. Go to **Discover** → **Series**
2. Look for **"One Pace + Torbox Enhanced"**
3. Click on it to see all available episodes

---

## 🎬 How to Watch

### Finding Content
1. **Discover** → **Series** → **"One Pace + Torbox Enhanced"**
2. Browse episodes organized by story arcs
3. Click any episode to start watching

### Stream Options
You'll see different stream types:

#### 📁 Torrent Streams
- **Title**: "📁 Torrent - Episode Name"
- **Type**: Traditional P2P torrents
- **Speed**: Depends on seeders
- **Cost**: Free

#### 🚀 Torbox Streams (If Configured)
- **Title**: "🚀 Torbox (Instant) - Episode Name" or "🚀 Torbox (Cached)"
- **Type**: Direct HTTP streaming
- **Speed**: Instant playback
- **Cost**: Requires Torbox subscription

### Choosing Streams
- **For best experience**: Choose Torbox streams (🚀)
- **For free option**: Choose Torrent streams (📁)
- **If one doesn't work**: Try the other option

---

## 🔧 Troubleshooting

### "Add-on not found" Error
- ✅ Check your URL is correct and accessible
- ✅ Make sure the `/manifest.json` part is included
- ✅ If local, ensure the server is running (`npm start`)

### No Episodes Showing
- ✅ Wait a few seconds for the addon to load
- ✅ Check your internet connection
- ✅ Try refreshing Stremio

### Streams Not Playing
- ✅ Try different stream options (Torrent vs Torbox)
- ✅ Check if you have a VPN enabled (some regions may be blocked)
- ✅ Ensure your Torbox account is active (for Torbox streams)

### Torbox Streams Missing
- ✅ Verify your `TORBOX_API_KEY` is set correctly
- ✅ Check your Torbox account is active and has remaining quota
- ✅ Some torrents may not be cached yet

---

## 🎉 Success!

You should now have:
- ✅ **One Pace + Torbox Enhanced** installed in Stremio
- ✅ Access to all One Pace episodes
- ✅ Multiple streaming options for each episode
- ✅ No conflicts with other One Piece addons

### Next Steps:
1. **Explore the catalog** - Browse different story arcs
2. **Test both stream types** - Compare torrent vs Torbox quality
3. **Bookmark favorites** - Save episodes you want to rewatch
4. **Share with friends** - Give them your addon URL

---

## 💡 Pro Tips

- **Torbox Worth It?**: If you watch a lot of anime/content, Torbox provides much better streaming experience
- **Multiple Devices**: Once installed, the addon works on all your Stremio devices
- **Updates**: The addon updates automatically when new One Pace episodes are released
- **Quality**: Choose the highest quality stream available for best experience

---

## 🆘 Need Help?

- **Addon Issues**: Create an issue on this repository
- **Torbox Support**: [support.torbox.app](https://support.torbox.app)
- **Stremio Help**: [stremio.com/support](https://stremio.com/support)
- **One Pace Info**: [onepace.net](https://onepace.net)

Enjoy watching One Pace with enhanced streaming! 🎬✨
