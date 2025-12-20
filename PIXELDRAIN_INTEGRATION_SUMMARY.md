# PixelDrain Integration Summary

## What Was Done

1. **Extracted PixelDrain URLs** from https://onepace.net/en/watch using Chrome DevTools
   - All PixelDrain folder URLs were extracted for each arc/season
   - Data saved to `pixeldrain-urls-extracted.json`

2. **Created PixelDrain Integration Module** (`pixeldrain-integration.js`)
   - Fetches PixelDrain folder contents via API
   - Maps folder files to episode indices
   - Constructs direct file URLs for streaming
   - Groups links by quality (480p, 720p, 1080p) and type (Subtitles, Dub, etc.)

3. **Updated OnePace Streams Integration** (`onepace-streams-integration.js`)
   - Integrated PixelDrain Integration
   - Uses PixelDrain URLs as primary source for official streams
   - Falls back to static mapping if PixelDrain doesn't have the episode

## How It Works

1. When a stream is requested for an episode (e.g., `RO_1`, `AR_3`):
   - The system identifies the arc prefix (RO, AR, etc.)
   - Finds the corresponding PixelDrain folder URLs from extracted data
   - Fetches the folder contents to get individual file IDs
   - Constructs direct file URLs using the episode index (file 0 = episode 1, etc.)
   - Returns stream objects with proper metadata

2. **File Index Mapping**:
   - Each PixelDrain folder contains multiple files (one per episode)
   - Episode number - 1 = file index (e.g., RO_1 = file index 0, RO_2 = file index 1)
   - Direct file URLs: `https://pixeldrain.com/u/{fileId}`

## Current Status

✅ PixelDrain Integration module created
✅ OnePace Streams Integration updated to use PixelDrain
✅ URL extraction completed (partial data saved)
✅ Episode mapping logic implemented

## Next Steps

1. **Complete URL Extraction**:
   - The `pixeldrain-urls-extracted.json` file currently has partial data
   - Need to save the complete extracted data from all arcs
   - All arcs were extracted via browser but need to be saved to the file

2. **Testing**:
   - Test with a few episodes to ensure folder contents are fetched correctly
   - Verify file URLs are constructed properly
   - Check that streams are returned with correct metadata

3. **TorBox Integration** (Optional):
   - Currently PixelDrain URLs are used directly as streams
   - If you want to check TorBox first:
     - TorBox primarily works with torrent hashes, not direct URLs
     - Could check if a torrent hash exists in TorBox before using PixelDrain
     - Or use PixelDrain as primary source (it's already direct download/streaming)

4. **OpenSubtitles Integration**:
   - Already integrated in the addon via `fetchExternalSubtitles()`
   - Uses file hashes when available
   - PixelDrain files should work with OpenSubtitles hash lookup

## File Structure

```
pixeldrain-integration.js          - PixelDrain API integration
pixeldrain-urls-extracted.json     - Extracted folder URLs (needs completion)
onepace-streams-integration.js     - Updated to use PixelDrain Integration
```

## Notes

- PixelDrain folder URLs format: `https://pixeldrain.net/l/{folderId}`
- Direct file URLs format: `https://pixeldrain.com/u/{fileId}`
- Each arc has multiple folder URLs (different qualities and types)
- Folder contents are cached to avoid repeated API calls

## Example Usage

```javascript
const pixeldrain = new PixeldrainIntegration();
const streams = await pixeldrain.getStreamsForEpisode('RO_1', {
    title: 'Romance Dawn, the Dawn of an Adventure',
    season: 1,
    episode: 1
});
// Returns array of stream objects with PixelDrain URLs
```

