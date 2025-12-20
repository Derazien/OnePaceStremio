# TorBox + PixelDrain Integration

## Overview

PixelDrain URLs are now routed through TorBox for streaming. This provides better reliability and caching.

## How It Works

1. **PixelDrain Folder Structure**: Each season/arc has PixelDrain folder URLs containing multiple files (one per episode)

2. **File Index Mapping**: 
   - Episode number - 1 = file index in folder
   - Example: `AR_3` (episode 3) = file index 2 in the Arlong Park folder

3. **Flow**:
   - Extract PixelDrain folder URL for the arc
   - Fetch folder contents via PixelDrain API
   - Get direct file URL using file index: `https://pixeldrain.com/u/{fileId}`
   - Add direct file URL to TorBox as web download
   - Get TorBox stream URL
   - Return stream object with TorBox URL

## API Endpoints

### TorBox Web Download Creation
- **Endpoint**: `POST /v1/api/downloads/createwebdownload`
- **Method**: Form data with `url` parameter
- **Returns**: Download ID

### TorBox Stream URL
- **Endpoint**: `GET /v1/api/downloads/requestdl?token={apiKey}&download_id={downloadId}&file_id={fileIdx}&redirect=true`
- **Returns**: Direct stream URL

## Integration Points

### TorboxIntegrationSDK Methods

1. **`createWebDownload(url)`**: Creates a web download in TorBox from a URL
2. **`getWebDownloadStreamUrl(downloadId, fileIndex)`**: Gets stream URL for a web download
3. **`getStreamUrlFromPixeldrainUrl(pixeldrainUrl, fileIndex)`**: Complete flow for PixelDrain URL via TorBox

### PixelDrainIntegration

- Requires TorBox integration instance
- Routes all PixelDrain URLs through TorBox
- Maps episodes to PixelDrain folders using file indices

## Example Usage

```javascript
// Episode AR_3 (Arlong Park, episode 3)
// 1. Find Arlong Park folder URL
// 2. Get file index: 3 - 1 = 2
// 3. Fetch folder contents, get file ID at index 2
// 4. Construct: https://pixeldrain.com/u/{fileId}
// 5. Add to TorBox: createWebDownload(fileUrl)
// 6. Get stream: getWebDownloadStreamUrl(downloadId, 0)
// 7. Return TorBox stream URL
```

## Benefits

- ✅ All streams go through TorBox (consistent interface)
- ✅ TorBox caching and CDN benefits
- ✅ Works with existing TorBox infrastructure
- ✅ Same pattern as torrents (download ID + file index)

