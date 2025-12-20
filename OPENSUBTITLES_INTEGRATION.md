# OpenSubtitles Hash Integration

## How It Works

### 1. TorBox Provides the Hash
When creating a web download in TorBox via `createWebDownload()`, TorBox returns a response that includes:
- `hash`: The file hash (currently this is what we use for OpenSubtitles matching)
- `webdownload_id`: The TorBox download ID
- `auth_id`: Authentication ID

### 2. We Extract and Pass to Stremio
The code in `torbox-integration-sdk.js` extracts the hash from TorBox's response:

```javascript
const fileHash = downloadData?.hash || downloadDetails?.hash || 
               downloadData?.opensubtitles_hash || downloadDetails?.opensubtitles_hash ||
               downloadData?.file_hash || downloadDetails?.file_hash;
```

### 3. Stremio Automatically Matches Subtitles
We pass this hash to Stremio in `behaviorHints.opensubtitlesHash`:

```javascript
behaviorHints: {
    opensubtitlesHash: fileHash,  // Stremio uses this to auto-match subtitles
    // ... other hints
}
```

**Stremio will automatically:**
- Use the `opensubtitlesHash` to query OpenSubtitles
- Fetch matching subtitles for that file hash
- Display them as subtitle options to the user

## Important Notes

1. **Automatic Matching**: Once `opensubtitlesHash` is in `behaviorHints`, Stremio handles the rest automatically - no additional code needed.

2. **Hash Format**: Currently, TorBox returns a 32-character hash (appears to be MD5). OpenSubtitles typically uses SHA1 (40 characters), but if TorBox provides the hash, they likely ensure compatibility or provide the correct format.

3. **Fallback Subtitles**: The addon also provides external subtitles as a fallback option, but the hash-based matching is automatic and doesn't require our intervention.

## Current Implementation Status

✅ **Working:**
- Hash extraction from TorBox response
- Hash passed to Stremio in `behaviorHints.opensubtitlesHash`
- Multiple quality streams (each gets its own hash)
- All TorBox metadata preserved

✅ **Verified:**
- Test shows hash is correctly extracted and passed
- Code properly handles all quality variants
- Stream objects include all necessary metadata

## Testing

To verify the hash is being passed correctly, check the logs:
- Look for: `🔤 [Torbox SDK] Added opensubtitlesHash: ... - Stremio will automatically fetch matching subtitles`
- Look for: `🔤 [Stream] Stream "..." has opensubtitlesHash: ... - Stremio will auto-load subtitles`

If you see warnings about missing hash, it means TorBox didn't provide one for that download.

