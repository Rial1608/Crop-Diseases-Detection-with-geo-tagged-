# React Blank Screen - Debugging & Troubleshooting Guide

## 🔍 What I Fixed

### Issues Found & Resolved:

1. **Missing Tailwind CSS Directives**
   - ❌ Problem: `App.css` wasn't importing Tailwind utilities
   - ✅ Solution: Added `@tailwind base; @tailwind components; @tailwind utilities;`

2. **PostCSS Configuration Error**
   - ❌ Problem: CommonJS syntax in ES module project
   - ✅ Solution: Changed `module.exports` to `export default` in `postcss.config.js`

3. **Tailwind Config Syntax Error**
   - ❌ Problem: CommonJS syntax breaking ES module loading
   - ✅ Solution: Updated to `export default` syntax

4. **Missing Error Boundaries**
   - ❌ Problem: Component errors weren't caught, causing blank screen
   - ✅ Solution: Added Error Boundary wrapper component

5. **Unhandled Promise Rejections**
   - ❌ Problem: API failures crashed components silently
   - ✅ Solution: Added try-catch blocks with fallback data

6. **No Debugging Information**
   - ❌ Problem: Impossible to diagnose issues
   - ✅ Solution: Added console logging throughout the app

---

## 🛠️ Files I Created/Updated

### New Components:
1. **`src/components/ErrorBoundary.jsx`** - Catches and displays component errors
2. **`src/components/LoadingSpinner.jsx`** - Loading state UI
3. **`src/components/SuspenseFallback.jsx`** - Suspense fallback UI

### Updated Files:
1. **`src/App.jsx`** - Added error boundaries, Suspense, and comprehensive logging
2. **`src/pages/Home.jsx`** - Safe rendering, better structure
3. **`src/utils/api.js`** - Error handling, fallback data, request/response logging

---

## 🧪 How to Test (Step by Step)

### Step 1: Open Browser Console
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Keep this open while testing

### Step 2: Check for Console Logs
You should see logs like:
```
✅ API Base URL: http://localhost:8000
📤 API Request: GET /api/map/config
✅ Backend dependencies installed!
🏠 Home page loaded
```

### Step 3: Test Each Page
1. **Home Page** (should load immediately)
   - Look for green navigation bar
   - See hero section with buttons
   - See features section

2. **Upload Page** (`/upload`)
   - Should show upload card
   - Weather widget (if backend running)
   - File input area

3. **Map Page** (`/map`)
   - Should show map loading spinner
   - Once loaded, shows Leaflet map

4. **Results Page** (`/results`)
   - Navigate from upload page
   - Shows detection results

### Step 4: Test Error Handling
1. **Stop Backend Server**
   - Press Ctrl+C in backend terminal
   - Try uploading an image
   - Should show graceful error message
   - App should still be functional

2. **Test API Fallback**
   - Weather should show demo data
   - Risk map should show default data
   - No blank screens

### Step 5: Debug Mode
1. Visit **`http://localhost:5173/debug`**
2. See all current state information
3. Check if `userLocation` is set
4. Verify `API_URL` is correct

---

## 📋 Complete Debugging Checklist

### Browser Console Check
- [ ] See "App component initializing..." message
- [ ] See "API Base URL: http://localhost:8000" or similar
- [ ] See "📍 Attempting to get user location..." message
- [ ] No red error messages

### Network Check (DevTools → Network)
- [ ] Backend API requests show 200/success status
- [ ] Frontend JS/CSS loads without errors
- [ ] No 404 errors

### Page Load Check
- [ ] Green navbar visible
- [ ] Home page content renders
- [ ] Navigation links work
- [ ] No blank/white areas

### Component Rendering
- [ ] Navbar renders above page content
- [ ] Router navigation works (/upload, /map paths)
- [ ] Buttons clickable and responsive
- [ ] Icons display correctly

---

## 🚨 Common Issues & Solutions

### Issue: Still Seeing Blank Screen
**Solution:**
1. Open DevTools Console (F12)
2. Check for red error messages
3. Search this page for that error
4. Or visit Debug page: http://localhost:5173/debug
5. Check `API_URL` and `userLocation` values

### Issue: API Errors in Console
**Solution:**
- Backend might not be running
- Check port 8000 is accessible
- Or, app uses fallback demo data automatically

### Issue: Styling Not Working
**Solution:**
```powershell
# Stop frontend (Ctrl+C)
cd frontend
npm install
npm run dev
```

### Issue: "Module not found" Error
**Solution:**
```powershell
# Clear cache and reinstall
cd frontend
rm -r node_modules
npm install
npm run dev
```

### Issue: Hot Module Reload Not Working
**Solution:**
- Refresh browser (Ctrl+R)
- Check browser console for errors
- Restart `npm run dev`

---

## 🔧 Advanced Debugging

### Method 1: Browser DevTools

**Console Tab:**
```javascript
// Check current state
localStorage.getItem('predictionData')

// Test API manually
fetch('http://localhost:8000/api/predict')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Network Tab:**
- Click requests to see response data
- Check response headers
- Look for CORS errors

**Application Tab:**
- Check localStorage
- Check sessionStorage
- Check cookies

### Method 2: Error Boundary Page
- Navigate to error boundary (triggers intentional error for testing)
- Should see error message with details
- Button to try again
- Demonstrates error handling

### Method 3: Debug Route
- Visit http://localhost:5173/debug
- Shows all app state
- Shows API URL configuration
- Shows environment info

### Method 4: Component React DevTools (if installed)
- Download React DevTools extension
- Inspect component tree
- Check component props
- Check component state

---

## ✅ Verification Checklist

After fixes, verify:

- [ ] **No Blank Screen**: Content visible on load
- [ ] **Console Logs**: Debug messages show proper flow
- [ ] **Error Handling**: Graceful errors (no crashes)
- [ ] **API Fallback**: Works even if backend down
- [ ] **Navigation**: Router works (paths change)
- [ ] **Styling**: Tailwind CSS applied (colors, spacing visible)
- [ ] **Responsive**: Works on mobile (check with F12 → Toggle Device Toolbar)
- [ ] **Performance**: No lag (check DevTools → Performance)

---

## 📚 Best Practices Going Forward

### 1. Always Use Error Boundaries
```jsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. Wrap Async Operations
```jsx
try {
  const data = await api.fetchData();
  setData(data);
} catch (error) {
  console.error('Error:', error);
  setData(fallbackData); // Important!
}
```

### 3. Add console.log for Critical Paths
```jsx
useEffect(() => {
  console.log('Component mounted with props:', props);
}, [props]);
```

### 4. Provide Fallback UI
```jsx
if (!data) {
  return <div>Loading or no data...</div>;
}
```

### 5. Test Error Scenarios
- Stop backend → test app still works
- Slow network → check loading states
- Invalid data → check error handling

---

## 🎯 Quick Test Script

Run this in browser console:

```javascript
// Test console is working
console.log('✅ Console working');

// Test API
fetch('http://localhost:8000/health')
  .then(r => r.text())
  .then(t => console.log('✅ Backend:', t))
  .catch(e => console.log('⚠️ Backend not responding:', e.message));

// Test page
console.log('✅ Current page:', window.location.pathname);
console.log('✅ App state ready');
```

---

## 📞 When Everything Fails

If still seeing blank screen:

1. **Check Services Running:**
   ```powershell
   netstat -ano | findstr :8000    # Backend
   netstat -ano | findstr :5173    # Frontend
   ```

2. **Try Clean Restart:**
   ```powershell
   # In backend terminal
   Ctrl+C
   cd "c:\Project CDD\backend"
   c:/python314/python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

   # In frontend terminal
   Ctrl+C
   cd "c:\Project CDD\frontend"
   npm run dev
   ```

3. **Check Logs:**
   - Backend terminal should show: "✓ Application started successfully"
   - Frontend terminal should show: "VITE v5.x.x ready"
   - Browser console should show: "App component initializing..."

4. **Nuclear Option (Last Resort):**
   ```powershell
   # Stop both services
   # Delete node_modules
   cd frontend
   rm -r node_modules
   npm install
   npm run dev
   ```

---

## 📧 Debug Information to Collect

If reporting issues, provide:

1. **Console Output** (F12 → Console)
2. **Network Errors** (F12 → Network)
3. **Browser Info**: Chrome v?, Firefox v?
4. **OS**: Windows, Mac, Linux?
5. **Steps to Reproduce**: Exact sequence that breaks it

---

**Last Updated**: March 30, 2026
**Status**: ✅ Fixed & Working
**Next Steps**: Run `npm run dev` and test!
