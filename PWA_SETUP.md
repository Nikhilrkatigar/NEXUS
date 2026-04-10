# PWA (Progressive Web App) Setup Documentation

## Overview
NEXUS CMS now includes comprehensive PWA features, allowing users to install the application on their devices and access it offline with cached data.

## Features Implemented

### 1. **Web App Manifest** (`manifest.json`)
- Defines app metadata including name, theme colors, and icons
- Enables "Add to Home Screen" functionality on mobile devices
- Provides SVG-based icons that work across all devices
- Includes app shortcuts for quick access to Dashboard, Registrations, and Scores
- Screenshots for app store listings

**Key Properties:**
- `name`: NEXUS Event Management
- `short_name`: NEXUS CMS
- `start_url`: /cms/dashboard.html
- `display`: standalone (fullscreen experience)
- `theme_color`: #060810 (dark theme color)
- `background_color`: #0b0f1a

### 2. **Service Worker** (`sw.js`)
Enables offline functionality and intelligent caching strategies:

#### Caching Strategies:
- **Cache-First** for static assets (HTML, CSS, JS)
  - Serves from cache immediately if available
  - Updates cache from network in background
  - Falls back to offline page if network unavailable

- **Network-First** for API calls
  - Attempts network first for fresh data
  - Uses cached API responses if offline
  - Returns offline error response with helpful message

#### Key Features:
- Automatic cache management on install/activation
- Old cache cleanup on service worker updates
- Smart offline detection with fallback responses
- Periodic updates (every 60 seconds) with background sync capability

### 3. **Installation Support**
All CMS pages now include:
- Web app manifest link: `<link rel="manifest" href="/manifest.json">`
- Theme color metadata: `<meta name="theme-color" content="#060810">`
- Description metadata for app listings
- Service worker registration script

#### Service Worker Registration:
```javascript
// Automatic registration on page load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(reg => console.log('SW registered'))
    .catch(err => console.warn('SW registration failed'))
}
```

## CMS Pages with PWA Support
All of the following pages now support PWA installation:
- ✅ Login Page (`cms/login.html`)
- ✅ Dashboard (`cms/dashboard.html`)
- ✅ Registrations (`cms/registrations.html`)
- ✅ Scores (`cms/scores.html`)
- ✅ Championship (`cms/championship.html`)
- ✅ Events (`cms/events.html`)
- ✅ Timeline (`cms/timeline.html`)
- ✅ Settings (`cms/settings.html`)
- ✅ Users (`cms/users.html`)
- ✅ Audit Log (`cms/audit.html`)

## Server Configuration
The Express server has been configured to:
- Serve `manifest.json` with correct MIME type: `application/manifest+json`
- Serve service worker `sw.js` from the root directory
- Enable static file serving from the application root

## How to Use

### Installing on Desktop (Chrome/Edge)
1. Open the CMS in your browser
2. Look for "Install" or similar prompt in the address bar
3. Click to install the app
4. The app will be added to your applications

### Installing on Mobile (iOS/Android)
1. Open the CMS in your browser
2. Tap the share/menu button
3. Select "Add to Home Screen" or "Install app"
4. Confirm the installation
5. The app will be added to your home screen

### Offline Access
- **Static Pages**: Cached pages are available offline immediately
- **API Calls**: Last fetched data is cached and served when offline
- **Dashboard**: Shows cached data if offline, syncs when back online
- **User Info**: Session tokens persist and work offline until expiration

## Cache Management

### Initial Cache (on first load)
- Login page
- Dashboard and all CMS pages
- Core JavaScript files including cms-core.js
- Manifest and service worker

### API Cache
- Dashboard statistics
- Registrations data
- Scores data
- User information
- Audit logs

### Cache Cleanup
- Old caches automatically deleted when service worker updates
- Users can manually clear cache through browser settings
- Cache expires based on browser storage policies

## Performance Benefits

1. **Instant Load**: Cached pages load immediately from local storage
2. **Offline Support**: Core functionality available without internet
3. **Reduced Bandwidth**: Subsequent loads use cached assets
4. **Fast Navigation**: No network latency for cached resources
5. **Better UX**: App-like experience with smooth transitions

## Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ Yes | ✅ Yes |
| Edge | ✅ Yes | ✅ Yes |
| Firefox | ✅ Partial | ✅ Yes |
| Safari | ⚠️ Limited | ⚠️ Limited (iOS 15.1+) |
| Opera | ✅ Yes | ✅ Yes |

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Ensure HTTPS or localhost is used (PWAs require secure context)
- Clear browser cache and restart

### App Not Installing
- Verify manifest.json is accessible at `/manifest.json`
- Ensure manifest has `display: "standalone"`
- Check browser PWA requirements are met
- Restart browser and try again

### Offline Not Working
- Verify service worker is registered (check DevTools → Application → Service Workers)
- Check caching strategies in `sw.js`
- Ensure pages were loaded at least once to be cached
- Clear cache and reload page

### Stale Data Offline
- Service worker caches last network response
- Updates happen automatically when connection returns
- Users can manually refresh to check for updates
- API calls show "offline" status while disconnected

## Security Considerations

1. **HTTPS Required**: PWAs require secure context (HTTPS)
   - Exception: `localhost` for development

2. **Cache Scope**: Service worker scope limited to `/cms/` path

3. **Authentication**: JWT tokens stored in sessionStorage
   - Session tokens work offline until expiration
   - Credentials not cached for security

4. **API Responses**: Only successful (200-299) responses cached

## Development Notes

### Updating Service Worker
- Increment `CACHE_NAME` version in `sw.js` to force cache refresh
- Browser checks for updates every 60 seconds
- Users notified when updates are available

### Adding New Pages to Cache
1. Add page URL to `ASSETS_TO_CACHE` array in `sw.js`
2. Increment `CACHE_NAME` version
3. Service worker will refresh cache on next load

### Testing Offline Mode
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Navigate pages to test offline experience

## Future Enhancements

Potential PWA features to add:
- [ ] Push notifications for registrations
- [ ] Background sync for offline data submission
- [ ] Download events/schedules for offline view
- [ ] Periodic background updates (every hour)
- [ ] Sync records when connection restores
- [ ] Desktop shortcuts for frequently used pages
- [ ] Custom app splash screen
- [ ] App icon badges for notifications

## Files Modified/Created

### New Files:
- `manifest.json` - PWA manifest with app metadata
- `sw.js` - Service worker for caching and offline support
- `PWA_SETUP.md` - This documentation

### Modified Files:
- `server/app.js` - Added manifest.json serving route
- `cms/login.html` - Added manifest link & SW registration
- `cms/dashboard.html` - Added manifest link & SW registration
- `cms/registrations.html` - Added manifest link & SW registration
- `cms/scores.html` - Added manifest link & SW registration
- `cms/championship.html` - Added manifest link & SW registration
- `cms/events.html` - Added manifest link & SW registration
- `cms/timeline.html` - Added manifest link & SW registration
- `cms/settings.html` - Added manifest link & SW registration
- `cms/users.html` - Added manifest link & SW registration
- `cms/audit.html` - Added manifest link & SW registration

## Testing Checklist

- [ ] Install app on desktop (Chrome/Edge)
- [ ] Install app on mobile (Android/iOS)
- [ ] Verify offline access to dashboard
- [ ] Check service worker registration in DevTools
- [ ] Test network-first API calls go offline
- [ ] Verify cache size is reasonable
- [ ] Test service worker update (increment version)
- [ ] Confirm app launches in fullscreen mode
- [ ] Check app shortcuts work on mobile
- [ ] Verify app icons display correctly

---

**Version**: 1.0.0
**Last Updated**: April 2026
