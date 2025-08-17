# 🚀 Deploy to Vercel (FREE) - Complete Guide

Deploy your **One Pace + Torbox Enhanced** addon to Vercel for free and access it from anywhere!

## 💰 Cost: **$0** (Completely Free)

Vercel's free tier includes:
- ✅ **100GB bandwidth/month** (more than enough for personal use)
- ✅ **Unlimited projects**
- ✅ **Custom domains** (optional)
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**

---

## 📋 Prerequisites

1. **GitHub Account** (free) - [github.com](https://github.com)
2. **Vercel Account** (free) - [vercel.com](https://vercel.com)

---

## 🛠️ Method 1: GitHub + Vercel (Recommended)

### Step 1: Upload to GitHub

1. **Create a new repository** on GitHub:
   - Go to [github.com](https://github.com) and click "New repository"
   - Name it: `onepace-torbox-enhanced`
   - Make it **Public** (required for free Vercel)
   - Click "Create repository"

2. **Upload your files**:
   
   **Option A: Using GitHub Web Interface (Easier)**
   - Click "uploading an existing file"
   - Drag and drop ALL files from your OnePaceStremio folder
   - Write commit message: "Initial commit with Torbox integration"
   - Click "Commit changes"

   **Option B: Using Git Commands**
   ```bash
   # In your OnePaceStremio folder
   git init
   git add .
   git commit -m "Initial commit with Torbox integration"
   git remote add origin https://github.com/YOUR_USERNAME/onepace-torbox-enhanced.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Sign up for Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign up" and choose "Continue with GitHub"
   - Authorize Vercel to access your GitHub

2. **Create New Project**:
   - Click "New Project" on your Vercel dashboard
   - Find your `onepace-torbox-enhanced` repository
   - Click "Import"

3. **Configure Deployment**:
   - **Framework Preset**: Select "Other"
   - **Root Directory**: Leave as `./`
   - **Build Command**: Leave as `npm run build` (or empty)
   - **Output Directory**: Leave empty
   - **Install Command**: Leave as `npm install`
   - Click "Deploy"

4. **Wait for Deployment** (usually 1-2 minutes):
   - Vercel will install dependencies and deploy
   - You'll get a URL like: `https://onepace-torbox-enhanced.vercel.app`

### Step 3: Test Your Deployment

1. **Visit your URL**: `https://your-project.vercel.app`
2. **You should see**: The configuration page
3. **Test manifest**: `https://your-project.vercel.app/manifest.json`



---

## 🛠️ Method 2: Direct Upload to Vercel

If you don't want to use GitHub:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy from your folder**:
   ```bash
   # In your OnePaceStremio folder
   vercel
   ```

3. **Follow the prompts**:
   - Login to Vercel
   - Choose settings (defaults are fine)
   - Get your deployment URL

---

## 🔧 Configure Environment Variables (Optional)

If you want to set a default Torbox API key:

1. **In Vercel Dashboard**:
   - Go to your project
   - Click "Settings" → "Environment Variables"
   - Add: `TORBOX_API_KEY` = `your_api_key_here`
   - Redeploy

---

## 📱 Install in Stremio

Once deployed, you have **two installation options**:

### Option 1: Basic Installation (No Torbox)
```
https://your-project.vercel.app/manifest.json
```

### Option 2: With User Configuration
1. Visit: `https://your-project.vercel.app`
2. Enter your Torbox API key on the configuration page
3. Copy the generated installation URL
4. Install in Stremio

---

## 🎯 Complete Installation Steps

1. **Go to your Vercel URL** (e.g., `https://onepace-torbox-enhanced.vercel.app`)
2. **Enter your Torbox API key** (optional - leave empty for free mode)
3. **Click "Generate Install URL"**
4. **Copy the generated URL**
5. **Open Stremio** → Add-ons → Community Add-ons
6. **Paste the URL** and click Install
7. **Find "One Pace + Torbox Enhanced"** in Discover → Series

---

## 🆘 Troubleshooting

### Deployment Failed?
- ✅ Make sure all files are uploaded
- ✅ Check that `package.json` exists
- ✅ Try redeploying from Vercel dashboard

### Addon Not Working?
- ✅ Test the manifest URL directly in browser
- ✅ Check Vercel function logs for errors
- ✅ Make sure the repository is public

### API Key Not Working?
- ✅ Verify your Torbox API key is correct
- ✅ Check your Torbox account is active
- ✅ Try the addon without Torbox first

---

## 💡 Pro Tips

- **Free Forever**: Vercel's free tier is permanent for personal projects
- **Auto-Updates**: Push to GitHub → Vercel automatically redeploys
- **Custom Domain**: You can add your own domain later (optional)
- **Analytics**: Vercel provides usage analytics
- **Multiple Environments**: You can have staging/production versions

---

## 🎉 Benefits of Cloud Deployment

Once deployed to Vercel:
- ✅ **Access from anywhere**: Home, work, travel
- ✅ **All your devices**: Phone, laptop, TV, tablet
- ✅ **Always online**: No need to keep your computer running
- ✅ **Fast loading**: Global CDN for quick access
- ✅ **HTTPS secure**: Encrypted connections
- ✅ **Shareable**: Give the URL to friends

---

## 🚀 Ready to Deploy?

The process is:
1. **5 minutes**: Upload to GitHub
2. **2 minutes**: Deploy to Vercel  
3. **1 minute**: Install in Stremio
4. **🎬 Start watching!**

Would you like me to walk you through any specific step, or do you have questions about the process?
