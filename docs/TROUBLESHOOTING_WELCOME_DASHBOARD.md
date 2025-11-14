# Troubleshooting Welcome Dashboard

## Issue: Welcome Dashboard Not Showing

If the welcome dashboard is not appearing when you log in, check the following:

### Quick Fix

Run this in your browser console to reset the welcome dashboard:

```javascript
// Remove the "don't show again" preference
localStorage.removeItem('another_ra_dont_show_welcome')

// Remove any feature flag override
localStorage.removeItem('featureFlag:welcomeDashboard')

// Reload the page
location.reload()
```

### Check Current Status

Run this in your browser console to see the current state:

```javascript
console.log({
  isLoggedIn: localStorage.getItem('another_ra_logged_in'),
  dontShowWelcome: localStorage.getItem('another_ra_dont_show_welcome'),
  welcomeDashboardFlag: localStorage.getItem('featureFlag:welcomeDashboard'),
  allFlags: Object.keys(localStorage).filter(k => k.startsWith('featureFlag:'))
})
```

### Common Causes

1. **"Don't Show Again" was clicked**
   - Solution: Remove `another_ra_dont_show_welcome` from localStorage

2. **Feature flag disabled**
   - Solution: Remove `featureFlag:welcomeDashboard` from localStorage or set it to `'true'`

3. **Timing issue**
   - Solution: Refresh the page

### Enable Welcome Dashboard

To always show the welcome dashboard:

```javascript
localStorage.setItem('featureFlag:welcomeDashboard', 'true')
localStorage.removeItem('another_ra_dont_show_welcome')
location.reload()
```

### Disable Welcome Dashboard

To skip the welcome dashboard:

```javascript
localStorage.setItem('another_ra_dont_show_welcome', 'true')
location.reload()
```

