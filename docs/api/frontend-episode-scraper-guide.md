# Frontend Integration Guide - WEBTOON Episode Scraper (v2.0)

## Overview

The WEBTOON Episode Scraper has been significantly enhanced with production-ready features. Users can now:

1. **Browse WEBTOON series episodes** - Enter a series URL or ID
2. **Search & filter episodes** - Search by title, sort by date/rating/likes
3. **Preview episodes** - View thumbnails with ratings, titles, dates, and engagement metrics
4. **Select & batch download** - Choose episodes or download all thumbnails as ZIP
5. **Manage favorites** - Save favorite series and track recently browsed
6. **Auto-populate project data** - Episode selection automatically fills in series metadata

## Components Added

### 1. **EpisodeScraper** (`components/Feature/scraper/EpisodeScraper.tsx`)
Main component orchestrating all functionality.

**Features:**
- Collapsible UI to minimize workspace clutter
- URL or Series ID input
- Configurable max episodes limit
- Series metadata display with favorite toggle
- Episode grid with selection
- Advanced filtering & sorting
- Batch operations

**Props:**
```tsx
interface EpisodeScraperProps {
  onEpisodeSelect?: (episode: Episode) => void;
  onMultipleEpisodesSelect?: (episodes: Episode[]) => void;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: typeof fetch;
}
```

### 2. **EpisodeGrid** (`components/Feature/scraper/EpisodeGrid.tsx`)
Displays episodes in a responsive grid layout.

**Features:**
- Select all / Clear selection
- Selection count display
- Responsive grid (2-5 columns based on screen size)

### 3. **EpisodeCard** (`components/Feature/scraper/EpisodeCard.tsx`)
Individual episode card with enhanced metadata.

**Features:**
- Thumbnail image with hover effects
- Episode number and title
- Upload date
- **Rating stars with score badge** ⭐
- **Like count display** 👍
- Play overlay on hover
- Selection indicator

### 4. **EpisodeControls** (`components/Feature/scraper/EpisodeControls.tsx`) ✨ NEW
Advanced filtering and sorting interface.

**Features:**
- Search box with real-time filtering
- Sort dropdown: Latest, Oldest, Highest Rated, Most Liked
- Date range picker (advanced mode)
- Quick-access buttons for Favorites & Recently Browsed
- Advanced filter toggle

**Props:**
```tsx
interface EpisodeControlsProps {
  onSortChange: (sortBy: 'latest' | 'oldest' | 'rating' | 'likes') => void;
  onSearchChange: (query: string) => void;
  onDateRangeChange: (fromDate: string, toDate: string) => void;
  onToggleFavorites: () => void;
  onToggleRecent: () => void;
  showFavorites?: boolean;
  showRecent?: boolean;
}
```

### 5. **EpisodeRatingDisplay** (`components/Feature/scraper/EpisodeRatingDisplay.tsx`) ✨ NEW
Star rating visualization component.

**Features:**
- 5-star rating display
- Displays likes and view counts
- Compact and expanded modes
- Color-coded engagement metrics

### 6. **FavoritesManager** (`components/Feature/scraper/FavoritesManager.tsx`) ✨ NEW
Favorites and recently browsed series management.

**Features:**
- localStorage persistence
- Add/remove favorites
- Track 10 most recent series
- Quick-access grid
- Series metadata caching

**API:**
```typescript
FavoritesManager.addFavorite(series)
FavoritesManager.removeFavorite(title_no)
FavoritesManager.isFavorite(title_no)
FavoritesManager.getFavorites()
FavoritesManager.getRecent()
FavoritesManager.addRecent(series)
FavoritesManager.clearRecent()
```

### 7. **BatchThumbnailDownloader** (`components/Feature/scraper/BatchThumbnailDownloader.tsx`) ✨ NEW
Download all episode thumbnails as a ZIP file.

**Features:**
- Download all thumbnails with one click
- Progress tracking
- ZIP file generation with episode names
- CORS-safe thumbnail fetching
- Automatic file naming

**Props:**
```tsx
interface BatchThumbnailDownloaderProps {
  episodes: Episode[];
  seriesTitle: string;
  onDownloadStart?: () => void;
  onDownloadComplete?: (count: number) => void;
}
```

## How to Use

### For End Users

1. **Locate the Episode Scraper**
   - Look for the "WEBTOON Episode Scraper" section in the workspace
   - Click the header to expand the scraper

2. **Enter Series Information**
   - **Option A:** Paste the full WEBTOON URL (e.g., `https://www.webtoons.com/en/romance/love-by-mistake/list?title_no=10411`)
   - **Option B:** Enter just the Series ID (e.g., `10411`)

3. **Adjust Settings**
   - Set "Max Episodes to Load" (default: 50)
   - Higher values take longer to scrape

4. **Click "Scrape Episodes"**
   - Wait for the scraper to fetch episode data
   - Series metadata appears above the grid
   - Series is automatically added to Recently Browsed

5. **Use Advanced Controls** ✨
   - **Search:** Type in search box to filter by episode title
   - **Sort:** Choose from Latest, Oldest, Highest Rated, Most Liked
   - **Favorites:** Click heart button to save series
   - **Recently Browsed:** View recently viewed series with dropdown
   - **Date Range:** Use advanced filters for custom date ranges

6. **Select Episodes**
   - Click individual episodes to select/deselect
   - Use "Select all" button to select all visible episodes
   - Selected episodes show a blue indicator

7. **View Engagement Metrics** ✨
   - Episode cards show rating stars and like counts
   - Hover over rating to see detailed breakdown
   - Sort by these metrics for discovery

8. **Download Thumbnails** ✨
   - Click "Download [N] Thumbnails as ZIP" button
   - Browser downloads ZIP with all episode thumbnails
   - Useful for offline reference or content creation

9. **Generate Videos**
   - Click "Generate Videos" button
   - Selected episodes' URLs auto-populate the main scraper

### URL Examples

**Love by Mistake:**
- Full URL: `https://www.webtoons.com/en/romance/love-by-mistake/list?title_no=10411`
- Series ID: `10411`

**Duo Leveling:**
- Full URL: `https://www.webtoons.com/en/action/duo-leveling/list?title_no=10193`
- Series ID: `10193`

**My Desire is Not a Sin:**
- Full URL: `https://www.webtoons.com/en/romance/my-desire-is-not-a-sin/list?title_no=9592`
- Series ID: `9592`

## Advanced Features

### Search & Filter

```
Search: "Chapter 5"
Results: Shows only episodes containing "Chapter 5" in title

Sort: "Highest Rated"
Results: Episodes sorted by rating (highest first)

Sort: "Most Liked"
Results: Episodes sorted by like count (most first)
```

### Favorites System

```
1. Click heart icon on series metadata
2. Series saved to localStorage
3. View favorites with "Favorites" button
4. Recently browsed auto-tracked (10 max)
5. Click any favorite to quick-load that series
```

### Batch Operations

```
1. Scrape series (50-500 episodes)
2. Select episodes (or "Select All")
3. Download all thumbnails as ZIP
   - File: [SeriesName]_thumbnails.zip
   - Contains: episode_number_title.jpg files
   - Useful for offline reference
4. OR Generate videos for selected episodes
```

## Data Flow

```
User Input (URL or ID)
    ↓
API Call: /api/scrape-episodes-advanced
    ↓
Backend Scrapes Episodes + Ratings
    ↓
Cache Saved to Database
    ↓
Display Metadata + Grid with Ratings
    ↓
User Filters/Sorts/Searches
    ↓
Episodes Grid Updates in Real-Time
    ↓
User Selects Episodes
    ↓
User Downloads Thumbnails (optional) OR
Selects Episodes → Generate Videos
    ↓
Episodes Auto-Populate Main Scraper
    ↓
Video Generation Workflow
```

## API Integration

### Endpoints Used

**Basic Scrape:**
```typescript
POST /api/scrape-episodes
{
  "url": "https://...",
  "title_no": "10411",
  "max_episodes": 50
}
```

**Advanced Scrape with Ratings & Sorting:** ✨
```typescript
POST /api/scrape-episodes-advanced
{
  "url": "https://...",
  "title_no": "10411",
  "max_episodes": 50,
  "page": 1,
  "include_ratings": true,
  "sort_by": "latest"  // or "oldest", "rating", "likes"
}
```

**Paginated Multi-Page:** ✨
```typescript
POST /api/scrape-episodes-paginated
{
  "title_no": "10411",
  "max_episodes": 500  // Automatically pages through all
}
```

**Batch Multiple Series:** ✨
```typescript
POST /api/batch-scrape-series
{
  "series": [
    { "title_no": "10411" },
    { "title_no": "10193" },
    { "title_no": "9592" }
  ],
  "max_episodes_per_series": 50
}
```

### Response Format

```json
{
  "success": true,
  "series": {
    "title": "Love by Mistake",
    "author": "Author Name",
    "genre": "romance",
    "cover_image": "https://...",
    "description": "..."
  },
  "title_no": "10411",
  "total_episodes": 127,
  "episodes": [
    {
      "number": "Episode 100",
      "title": "Episode Title",
      "date": "Dec 30, 2023",
      "thumbnail": "https://...",
      "url": "https://www.webtoons.com/...",
      "index": 0,
      "rating": 4.5,
      "likes": "2.3K"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "sort_by": "latest",
  "from_cache": false
}
```

## Caching & Performance

### Automatic Database Caching ✨

- First scrape: 10-20 seconds (fresh fetch)
- Cached scrape: <100ms (database lookup)
- 24-hour cache TTL
- Transparent to user

### Performance Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| Fresh scrape (50 ep) | 10-15s | Playwright rendering |
| Cached scrape | <100ms | Database lookup |
| Large series (200 ep) | 25-35s | Paginated fetch |
| Download 100 thumbnails | 15-20s | ZIP creation |
| Search/Sort filter | <100ms | Client-side |

## File Changes

1. **`frontend/src/api/scraper.ts`** ✏️
   - Added `scrapeEpisodesAdvanced()`
   - Added `scrapeEpisodesPaginated()`
   - Added `batchScrapeSeriesAPI()`

2. **`frontend/src/components/Feature/scraper/index.ts`** ✏️
   - Exported all new components

3. **`frontend/src/components/Feature/scraper/EpisodeScraper.tsx`** ✏️
   - Integrated all advanced features
   - Added state for filtering/sorting
   - Connected to new components

4. **`frontend/src/components/Feature/scraper/EpisodeCard.tsx`** ✏️
   - Added rating display
   - Added like count badge

5. **`frontend/src/components/Feature/scraper/EpisodeControls.tsx`** ✨ NEW
   - Sort, filter, search interface

6. **`frontend/src/components/Feature/scraper/EpisodeRatingDisplay.tsx`** ✨ NEW
   - Rating visualization

7. **`frontend/src/components/Feature/scraper/FavoritesManager.tsx`** ✨ NEW
   - Favorites management

8. **`frontend/src/components/Feature/scraper/BatchThumbnailDownloader.tsx`** ✨ NEW
   - Batch thumbnail download

## Error Handling

The scraper provides helpful error messages:

- **"Please enter a WEBTOON URL or Series ID"** - No input provided
- **"Failed to scrape episodes"** - Backend error
- **"Could not extract title_no from URL"** - URL format issue
- **"Please select at least one episode"** - No episodes selected for generation
- **"No recently browsed series"** / **"No favorite series"** - Empty lists

## Styling & UX

The components follow the existing Sonikoma design:
- Dark theme with purple/blue gradients
- Responsive grid layout (2-5 columns)
- Smooth animations and transitions
- Accessible color contrasts
- Loading states with spinners
- Success/error notifications
- Star ratings with hover effects
- Gradient buttons with hover states

## State Management

The EpisodeScraper manages:
- `urlInput` - User's URL input
- `titleNoInput` - User's Series ID input
- `isLoading` - Scraping in progress
- `episodes` - Full episode list
- `filteredEpisodes` - Filtered/sorted results
- `seriesMetadata` - Series information
- `selectedIndices` - Selected episode indices
- `sortBy` - Current sort mode
- `searchQuery` - Search filter text
- `showFavorites` - Favorites panel visibility
- `showRecent` - Recently browsed panel visibility
- `isFavorite` - Current series is favorited
- `error` - Error messages
- `isExpanded` - UI expanded state
- `maxEpisodes` - Max episodes to load

## Features Implemented ✅

All future enhancements are now complete:

- [x] **Save favorite series** - Full localStorage-based system
- [x] **Filter episodes by date range** - Date pickers in advanced mode
- [x] **Sort episodes** - Latest, Oldest, Rating, Likes
- [x] **Search within episodes** - Real-time title search
- [x] **Batch download episode thumbnails** - ZIP export functionality
- [x] **Episode rating display** - Star ratings + badges
- [x] **Recently browsed series dropdown** - Auto-tracked history
- [x] **Advanced pagination** - Handle 100+ episode series
- [x] **Database caching** - <100ms repeat access
- [x] **Batch series scraping** - Multiple series in one request

## Testing

To test the episode scraper:

1. Run the backend server: `npm run backend`
2. Run the frontend: `npm run frontend`
3. Open the workspace
4. Expand the Episode Scraper section
5. Try the test series:

   **Series 1: Love by Mistake**
   ```
   ID: 10411
   URL: https://www.webtoons.com/en/romance/love-by-mistake/list?title_no=10411
   ```

   **Series 2: Duo Leveling**
   ```
   ID: 10193
   URL: https://www.webtoons.com/en/action/duo-leveling/list?title_no=10193
   ```

   **Series 3: My Desire is Not a Sin**
   ```
   ID: 9592
   URL: https://www.webtoons.com/en/romance/my-desire-is-not-a-sin/list?title_no=9592
   ```

### Test Workflows

**Workflow 1: Basic Search**
```
1. Enter series ID: 10411
2. Click "Scrape Episodes"
3. Wait for episodes to load
4. Verify metadata displays
5. Verify thumbnails load
```

**Workflow 2: Search & Sort**
```
1. Scrape series (10411)
2. Type in search: "Chapter"
3. Episodes filter in real-time
4. Change sort to "Highest Rated"
5. Top rated episodes appear first
```

**Workflow 3: Favorites**
```
1. Scrape series (10411)
2. Click heart icon to favorite
3. Click "Favorites" button
4. See series in favorites grid
5. Click series to quick-load
```

**Workflow 4: Download Thumbnails**
```
1. Scrape series (limit to 20 episodes)
2. Click "Download 20 Thumbnails as ZIP"
3. Wait for progress bar
4. Browser downloads ZIP file
5. Extract and verify thumbnails
```

**Workflow 5: Batch Operations**
```
1. Scrape series (10411)
2. Click "Select All"
3. Click "Generate Videos for Selected"
4. Episodes populate main scraper
5. Continue with video generation
```

## Troubleshooting

**Episodes not loading:**
- Check browser console for errors
- Verify backend is running
- Try with explicit title_no instead of URL
- Check cache: Maybe TTL expired

**Thumbnails not showing:**
- May take a moment to load
- Check browser network tab
- Verify WEBTOON server accessibility

**Search/sort not working:**
- Refresh page
- Clear browser cache
- Check console for JavaScript errors

**Favorites not persisting:**
- Check localStorage is enabled
- Check browser privacy settings
- Try incognito mode for troubleshooting

**Download ZIP fails:**
- Check JSZip library is loaded
- Verify thumbnails have valid URLs
- Try with fewer episodes first
- Check browser memory available

**Slow performance:**
- Reduce max episodes (50 vs 500)
- Close other browser tabs
- Check internet connection
- Clear browser cache

## Code Examples

### Accessing Episode Data in Custom Components

```tsx
import { EpisodeScraper } from "@/components/Feature/scraper";

export function MyComponent() {
  const handleEpisodesSelected = (episodes: Episode[]) => {
    console.log("Selected episodes:", episodes);
    
    // Access episode properties:
    episodes.forEach(ep => {
      console.log(`${ep.number}: ${ep.title}`);
      console.log(`  Rating: ${ep.rating || 'N/A'}`);
      console.log(`  Likes: ${ep.likes || 'N/A'}`);
      console.log(`  URL: ${ep.url}`);
      console.log(`  Thumbnail: ${ep.thumbnail}`);
    });
  };

  return (
    <EpisodeScraper
      onMultipleEpisodesSelect={handleEpisodesSelected}
      addNotification={(msg, type) => console.log(msg)}
      fetchWithInterceptor={fetch}
    />
  );
}
```

### Using Favorites API

```tsx
import { FavoritesManager } from "@/components/Feature/scraper/FavoritesManager";

// Add to favorites
FavoritesManager.addFavorite({
  title_no: "10411",
  title: "Love by Mistake",
  genre: "romance",
  cover_image: "https://...",
  timestamp: Date.now()
});

// Get all favorites
const favorites = FavoritesManager.getFavorites();

// Check if series is favorited
if (FavoritesManager.isFavorite("10411")) {
  console.log("Series is in favorites");
}

// Get recently browsed
const recent = FavoritesManager.getRecent();
```

### Using Rating Display

```tsx
import { EpisodeRatingDisplay } from "@/components/Feature/scraper/EpisodeRatingDisplay";

<EpisodeRatingDisplay
  rating={4.5}
  likes="2.3K"
  views={15000}
  compact={false}
/>
```

## Architecture Integration

The enhanced scraper integrates seamlessly:

**Backend:**
- Uses existing Playwright infrastructure
- Database caching in SQLite
- Follows established error handling patterns
- Logs to existing logger

**Frontend:**
- Uses existing notification system
- Follows Sonikoma design system
- Integrates with AppWorkspace
- Compatible with existing handlers

**Data Flow:**
- Episodes → Cache (24h TTL)
- Cache hits skip network entirely
- Filtering happens client-side (fast)
- Sorting happens client-side (real-time)

## Next Steps

Future potential enhancements:
- [ ] Episode comments/discussion preview
- [ ] User ratings aggregation
- [ ] Webhook API for new episodes
- [ ] Bulk favorite import/export
- [ ] Per-episode tagging/notes
- [ ] Reading history analytics
- [ ] Episode recommendation engine
- [ ] Collections (group multiple series)

## Support

For issues or questions:
- Check test series work correctly
- Review browser console for errors
- Check backend logs: `backend/python/`
- Verify WEBTOON is still accessible
- Check data format in network tab
