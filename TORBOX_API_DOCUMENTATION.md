# TorBox API Integration Documentation

## APIs We're Using

### 1. Create Web Download
**Endpoint**: `POST /v1/api/webdl/createwebdownload`  
**Base URL**: `https://api.torbox.app`  
**Request Body**: `{ link: "https://pixeldrain.net/l/..." }` (form-data with `link` parameter)  
**Response**:
```json
{
  "success": true,
  "data": {
    "hash": "95a6590efadf839c18b69c729fb831d4",  // Folder-level hash
    "webdownload_id": 386497,
    "auth_id": "9e879b1c-5ff0-4e50-87c4-33e3a2fd86c4"  // Needed for PostgREST API
  }
}
```

### 2. Get Download Details with Files (PostgREST API)
**Endpoint**: `GET /rest/v1/web_downloads?select=*&id=eq.{downloadId}&auth_id=eq.{authId}`  
**Base URL**: `https://db.torbox.app`  
**Headers**: `Authorization: Bearer {apiKey}`  
**Response**: Array with single object containing `files` array
```json
[{
  "id": 386497,
  "hash": "95a6590efadf839c18b69c729fb831d4",
  "name": "[1-7] Romance Dawn [En Dub][720p]",
  "files": [
    {
      "id": 0,  // File index - matches file_id parameter
      "name": "...",
      "short_name": "[One Pace][1] Romance Dawn 01 [720p][En Dub][E9EF16FE].mp4",
      "opensubtitles_hash": "cbf4e4c671fd9958",  // ⭐ THIS IS WHAT WE NEED!
      "hash": "95a6590efadf839c18b69c729fb831d4",
      "md5": null,
      "size": 159657297,
      "mimetype": "video/mp4",
      "zipped": false,
      "infected": false,
      "s3_path": "...",
      "absolute_path": "..."
    },
    {
      "id": 1,
      "opensubtitles_hash": "1e057b68dd40947f",  // Each file has its own hash!
      // ... other fields
    }
  ]
}]
```

### 3. Get Stream URL
**Endpoint**: `GET /v1/api/webdl/requestdl?token={apiKey}&web_id={downloadId}&file_id={fileIndex}&redirect=true`  
**Base URL**: `https://api.torbox.app`  
**Response**: 307 Redirect to CDN URL (the redirect URL is the stream URL)

## Important Notes

### File-Specific OpenSubtitles Hash
- **Each file in the folder has its own `opensubtitles_hash`**
- The file `id` (0, 1, 2, ...) corresponds to the `fileIndex` we pass to get the stream URL
- We use `downloadDetails.files[fileIndex].opensubtitles_hash` to get the correct hash for that specific file
- This is **more accurate** than using the folder-level `hash` field

### Why PostgREST API?
- The PostgREST API (`db.torbox.app`) is what the TorBox dashboard uses internally
- It returns the complete `files` array with all file details including `opensubtitles_hash`
- This is the **only way** to get file-specific OpenSubtitles hashes

### Current Implementation Flow

1. **Create web download** → Get `webdownload_id` and `auth_id`
2. **Get download details via PostgREST** → Get `files` array with `opensubtitles_hash` for each file
3. **Get stream URL** → Use `web_id` and `file_id` to get CDN stream URL
4. **Extract file-specific hash** → Use `files[fileIndex].opensubtitles_hash` for that specific file
5. **Pass to Stremio** → Set `behaviorHints.opensubtitlesHash` so Stremio auto-loads subtitles

## All Available File Fields

From the PostgREST API response, each file object contains:
- `id`: File index (0-based) - matches `file_id` parameter
- `opensubtitles_hash`: **OpenSubtitles hash for this specific file** ⭐
- `hash`: File hash (same as folder hash)
- `md5`: MD5 hash (may be null)
- `name`: Full path/name
- `short_name`: Short filename
- `size`: File size in bytes
- `mimetype`: MIME type (e.g., "video/mp4")
- `zipped`: Boolean - is file zipped
- `infected`: Boolean - virus scan result
- `s3_path`: S3 storage path
- `absolute_path`: Absolute file system path

## Logging

The code now logs:
- All file details including `opensubtitles_hash`
- Which hash is being used (file-specific vs fallback)
- All available fields for each file
- File metadata for debugging

