# Pixeldrain URL Extraction Guide

## Overview

The OnePaceStremio addon now has a complete framework for integrating official One Pace streams from [onepace.net/en/watch](https://onepace.net/en/watch), but the actual Pixeldrain URLs need to be extracted and updated in the code.

## Current Status

### ✅ What's Implemented
- **Complete stream integration framework**
- **Episode ID mapping system** 
- **Priority-based stream ordering**
- **Multi-quality support** (480p, 720p, 1080p)
- **Multi-format support** (Subtitled, Dubbed, Closed Captions)
- **Extended version handling**
- **Integration with existing subtitle system**

### ⚠️ What Needs To Be Done
- **Extract real Pixeldrain URLs** from the One Pace website
- **Update the episode mapping** with actual URLs
- **Add all remaining episodes** (currently only 8 episodes mapped out of 38+ arcs)

## URL Extraction Methods

### Method 1: Manual Extraction (Recommended for Initial Setup)

1. **Visit**: https://onepace.net/en/watch
2. **Right-click** on any Pixeldrain link → "Copy link address"
3. **Extract the file ID** from URLs like: `https://pixeldrain.com/api/file/ABC123XYZ`
4. **Update the mapping** in `onepace-streams-integration.js`

**Example Process:**
```javascript
// From the website, Romance Dawn links might look like:
// 480p Sub: https://pixeldrain.com/api/file/real-ro1-480p-sub-id
// 720p Sub: https://pixeldrain.com/api/file/real-ro1-720p-sub-id
// 1080p Sub: https://pixeldrain.com/api/file/real-ro1-1080p-sub-id

// Update in the code:
'RO_1': {
    title: 'Romance Dawn',
    arcNumber: 1,
    variants: [
        {
            type: 'English Subtitles',
            qualities: [
                { resolution: '480p', pixeldrainUrl: 'https://pixeldrain.com/api/file/real-ro1-480p-sub-id' },
                { resolution: '720p', pixeldrainUrl: 'https://pixeldrain.com/api/file/real-ro1-720p-sub-id' },
                { resolution: '1080p', pixeldrainUrl: 'https://pixeldrain.com/api/file/real-ro1-1080p-sub-id' }
            ]
        }
        // ... add dub variants
    ]
}
```

### Method 2: Automated Scraping (Advanced)

The framework includes a `scrapeOfficialWebsite()` method that can be enhanced:

```javascript
// In onepace-streams-integration.js
async scrapeOfficialWebsite() {
    try {
        const response = await fetch(this.baseUrl);
        const html = await response.text();
        
        // Parse HTML to extract Pixeldrain links
        const cheerio = require('cheerio'); // Would need to install
        const $ = cheerio.load(html);
        
        // Extract links and map to episodes
        // Implementation would parse the website structure
        
    } catch (error) {
        console.error('Scraping failed:', error);
    }
}
```

### Method 3: Browser Automation (Most Comprehensive)

Using tools like Puppeteer to automate the extraction:

```javascript
const puppeteer = require('puppeteer');

async function extractAllPixeldrainUrls() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto('https://onepace.net/en/watch');
    
    // Extract all Pixeldrain links
    const links = await page.evaluate(() => {
        const pixeldrainLinks = [];
        document.querySelectorAll('a[href*="pixeldrain"]').forEach(link => {
            pixeldrainLinks.push({
                url: link.href,
                text: link.textContent,
                // Extract episode and quality info from context
            });
        });
        return pixeldrainLinks;
    });
    
    await browser.close();
    return links;
}
```

## Episode Mapping Structure

Each episode follows this structure:

```javascript
'EPISODE_ID': {
    title: 'Episode Title',
    arcNumber: X,
    variants: [
        {
            type: 'English Subtitles' | 'English Dub' | 'English Dub with Closed Captions' | 'English Subtitles, Extended',
            qualities: [
                { 
                    resolution: '480p' | '720p' | '1080p',
                    pixeldrainUrl: 'https://pixeldrain.com/api/file/ACTUAL_FILE_ID'
                }
            ]
        }
    ]
}
```

## Priority Implementation Tasks

### Phase 1: Core Episodes (High Priority)
Update URLs for the most popular arcs:
- **Romance Dawn** (RO_1)
- **Orange Town** (OR_1) 
- **Syrup Village** (SY_1-7)
- **Baratie** (BA_1-9)
- **Arlong Park** (AP_1-13)
- **Water 7** (WA_1-53)
- **Wano** (WS_1-20)

### Phase 2: Complete Coverage (Medium Priority)
Add all remaining episodes from the website:
- Extract all 38 arcs
- Map every quality and format variation
- Handle extended versions

### Phase 3: Automation (Future Enhancement)
- Implement automated URL updates
- Monitor One Pace website for changes
- Cache URLs with expiration dates
- Add error handling for broken links

## Integration Points

### In the Current Code

**File: `onepace-streams-integration.js`**
- Line ~131: `buildEpisodeMapping()` - Add real URLs here
- Line ~274: `scrapeOfficialWebsite()` - Enhance for automation

**File: `addon.js`**
- Line ~277: Official streams are fetched and prioritized
- Line ~299: Subtitles are automatically added to official streams

### Testing the Integration

1. **Update URLs** in `onepace-streams-integration.js`
2. **Run the test**: `node test-complete-integration.js`
3. **Verify stream generation** in Stremio
4. **Check subtitle integration**

## URL Validation

Before adding URLs to production:

```javascript
// Test URL validity
async function validatePixeldrainUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}
```

## Benefits After Implementation

### For Users:
- **Official One Pace streams** as primary option
- **Multiple quality choices** (480p/720p/1080p)
- **Dubbed and subtitled versions**
- **Instant streaming** (no P2P required)
- **Perfect sync** with official subtitles

### For Developers:
- **Future-proof architecture** ready for URL updates
- **Extensible mapping system** for new episodes
- **Comprehensive logging** for debugging
- **Priority-based stream ordering**

## Implementation Checklist

- [ ] Extract Romance Dawn URLs
- [ ] Extract Orange Town URLs  
- [ ] Extract Syrup Village URLs
- [ ] Extract Baratie URLs
- [ ] Extract Arlong Park URLs
- [ ] Add Water 7 complete mapping
- [ ] Add Wano complete mapping
- [ ] Test with real URLs
- [ ] Implement URL validation
- [ ] Add automated scraping
- [ ] Document episode ID patterns
- [ ] Create update process

## Maintenance

Once implemented, the system will need:

1. **Regular URL checks** (monthly)
2. **New episode additions** when released
3. **Broken link monitoring**
4. **Quality option updates**

The framework is ready - it just needs the real Pixeldrain URLs from the One Pace website to become fully functional!
