# React + FastAPI Analyze Button - Debugging & Fix Guide

## ✅ Issues Fixed

### 1. **Missing Console Logging**
- Added detailed console logs at every step
- Can now trace the exact flow: Button Click → File Selection → API Call → Response

### 2. **Improved Button Handler**
- Added click logging to button
- Better error handling in handleUpload
- Added file validation debugging

### 3. **Enhanced API Integration**
- Better FormData debugging
- Timeout configuration (60 seconds)
- Detailed error response handling
- Exception message improvements

### 4. **Better Component Lifecycle**
- Component mount/unmount logging
- Props validation logging
- State change tracking

---

## 🔍 How to Debug - Step by Step

### Step 1: Open Browser Developer Tools
**Windows/Linux:** Press `F12`  
**Mac:** Press `Cmd + Option + I`

### Step 2: Go to Console Tab
Click on the "Console" tab in DevTools

### Step 3: Select Image and Click Analyze

Watch for these logs appearing in console:

```
✅ [UploadCard] Component mounted
✅ [UploadCard] Props - onUpload: function loading: false
📸 Click "Choose File" button
🟢 [UploadCard] handleFileSelect - File selected: image.jpg ...
🖼️ [UploadCard] Image preview ready
🖱️ [UploadCard] Analyze button clicked!
🔵 [UploadCard] handleUpload triggered
✅ [UploadCard] File selected: image.jpg ...
⏳ [UploadCard] Calling onUpload callback...
🔵 [Upload.jsx] handleUpload called with file: image.jpg
📡 [Upload.jsx] Sending prediction request...
📤 [api.js] predictDisease called
📤 [api.js] FormData entries: file, latitude, longitude
📤 [api.js] Sending POST request to /api/predict
✅ [api.js] Response status: 200
✅ [api.js] Disease prediction successful
✅ [Upload.jsx] Response received: {...}
✅ [Upload.jsx] Disease: Tomato Early Blight
🔄 [Upload.jsx] Navigating to results page...
```

---

## 🐛 Troubleshooting by Error Message

### Error: "No file selected!"
```
❌ [UploadCard] No file selected!
```
**Solution:** Click "Choose File" and select an image before clicking "Analyze"

### Error: "Invalid file type"
```
❌ [UploadCard] Invalid file type: application/pdf
```
**Solution:** Upload JPG, PNG, GIF, or BMP image files only

### Error: "File too large"
```
❌ [UploadCard] File too large: 15728640
```
**Solution:** File is > 10MB. Use a smaller image

### Error: "Cannot reach backend"
```
❌ [api.js] Error message: Network Error
❌ [api.js] Error response status: undefined
```
**Solution:** 
- Check if backend is running: `python main.py`
- Verify backend URL in `.env`: `VITE_API_URL=http://localhost:8000`
- Check CORS settings in backend

### Error: "CORS error"
```
❌ Access to XMLHttpRequest at 'http://localhost:8000/api/predict' 
   from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solution:**
- Ensure `http://localhost:5173` is in backend `.env`:
  ```
  ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
  ```
- Restart backend after changing `.env`

### Response is null/empty
```
❌ [Upload.jsx] Response received: null
```
**Solution:** 
- Check backend logs for errors
- Verify model file exists: `ls backend/model/model.h5`
- Check backend returned `success: true`

---

## 📊 Complete Debug Flow

**Expected Console Output (Success Flow):**

```javascript
// Component Load
✅ [UploadCard] Component mounted
✅ [UploadCard] Props - onUpload: function loading: false

// File Selection
🟢 [UploadCard] handleFileSelect - File selected: leaf.jpg ...
✅ [UploadCard] File validation passed
🖼️ [UploadCard] Image preview ready

// Button Click
🖱️ [UploadCard] Analyze button clicked!
🔵 [UploadCard] handleUpload triggered
🔵 [UploadCard] fileInputRef.current: RefObject
✅ [UploadCard] File selected: leaf.jpg
⏳ [UploadCard] Calling onUpload callback...

// Parent Component
🔵 [Upload.jsx] handleUpload called with file: leaf.jpg
📡 [Upload.jsx] Sending prediction request...
📡 [Upload.jsx] File: leaf.jpg Size: 524288
📡 [Upload.jsx] Location: {lat: 28.6139, lng: 77.2090}

// API Call
📤 [api.js] predictDisease called
📤 [api.js] File: leaf.jpg Type: image/jpeg Size: 524288
📤 [api.js] FormData entries:
  - file : File(leaf.jpg)
  - latitude : 28.6139
  - longitude : 77.2090
📤 [API Request]: POST /api/predict
📤 [api.js] Sending POST request to /api/predict

// Response
📥 [API Response]: 200 /api/predict
✅ [api.js] Response status: 200
✅ [api.js] Response data: {success: true, prediction: {...}}
✅ [api.js] Disease prediction successful

// Result Display
✅ [Upload.jsx] Response received: {success: true, ...}
✅ [Upload.jsx] Prediction successful!
✅ [Upload.jsx] Disease: Tomato Early Blight
✅ [Upload.jsx] Confidence: 92.5
🔄 [Upload.jsx] Navigating to results page...
```

---

## 🧪 Testing Checklist

### Frontend Tests
- [ ] Console has no errors
- [ ] UploadCard component mounts
- [ ] File selection works
- [ ] Button has onClick handler
- [ ] API call is sent
- [ ] Response is received
- [ ] Navigation occurs

### Backend Tests
- [ ] Backend starts without errors: `python main.py`
- [ ] Health endpoint works: `curl http://localhost:8000/health`
- [ ] CORS middleware loaded
- [ ] Model loaded successfully
- [ ] Predict endpoint responds

### Integration Tests
- [ ] Select image → preview appears
- [ ] Click Analyze → loading state shows
- [ ] Loading spinner displays
- [ ] Response comes back
- [ ] Results page displays
- [ ] No CORS errors in browser

---

## 🔧 Code Changes Made

### 1. UploadCard.jsx - Enhanced Debugging
```jsx
// Added:
- Component lifecycle logging (mount/unmount)
- File selection logging
- File validation logging  
- handleUpload step-by-step logging
- Drag-drop logging
- Button click logging
- Type="button" attribute
- Better disabled state handling
```

### 2. Upload.jsx - Detailed Flow Logging
```jsx
// Added:
- File parameter logging
- Location data logging
- API call initiation logging
- Response status logging
- Success/error condition logging
- Navigation logging
- Catch block detailed logging
```

### 3. api.js - Complete API Debugging
```jsx
// Added:
- Initial call logging
- File details logging (name, type, size)
- FormData entry logging
- Request initiation logging
- Response status logging
- Full error details logging
- JSON response logging
- Enhanced error message
```

---

## 🚀 Quick Test Command

### Test Backend First
```bash
cd c:\Project CDD\backend
python test_backend.py C:\path\to\test_image.jpg
```

### Test Prediction Directly (cURL)
```bash
curl -X POST http://localhost:8000/api/predict \
  -F "file=@C:\path\to\leaf.jpg" \
  -F "latitude=28.6139" \
  -F "longitude=77.2090"
```

### Test Frontend
1. Open http://localhost:5173 in browser
2. Open DevTools (F12)
3. Go to Console tab
4. Upload image and click Analyze
5. Watch console logs appear

---

## 📋 Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Button not responding | Click does nothing | Check F12 console for errors |
| No logs in console | Can't debug | Refresh page, check console tab |
| Network error | API unreachable | Start backend, check port 8000 |
| CORS error | Cross-origin blocked | Add localhost:5173 to ALLOWED_ORIGINS |
| Response is empty | No prediction | Check backend model file exists |
| File not selected | "No file selected" error | Click "Choose File" first |
| File too large | "Exceeds 10MB" | Use smaller image |
| Loading spinner forever | Hangs indefinitely | Check backend response, network tab |

---

## 🔗 Key Files Modified

1. **frontend/src/components/UploadCard.jsx** - Button & file handling
2. **frontend/src/pages/Upload.jsx** - Upload flow & API call
3. **frontend/src/utils/api.js** - API integration

## ✅ Verification Steps

1. **Start Backend**
   ```bash
   cd backend
   python main.py
   ```

2. **Open Frontend**
   ```
   http://localhost:5173
   ```

3. **Open DevTools**
   - Press F12
   - Click "Console" tab

4. **Test Upload**
   - Click "Choose File"
   - Select an image
   - Watch console logs
   - Click "Analyze" button
   - Observe prediction result

5. **Verify in Console**
   - Look for `✅` (success) logs
   - No `❌` (error) logs
   - Complete flow from button click to results

---

## 💡 Pro Tips

### Enable Detailed Logging
Open DevTools → Settings → Filter out console messages  
(Unchecked for all logs)

### Track Network Requests
DevTools → Network tab  
- Refresh page
- Click Analyze
- Look for `/api/predict` request
- Check response status (should be 200)
- Check response body (should have `success: true`)

### Copy Full Error
In console, right-click error → Copy object  
Paste in text editor for full details

### Check API Response Format
Network → `/api/predict` → Response tab  
Should see:
```json
{
  "success": true,
  "prediction": {
    "disease_name": "...",
    "confidence": ...
  },
  ...
}
```

---

## 🆘 Still Not Working?

### Check This Sequence:
1. ✅ Backend running?  
   `curl http://localhost:8000/health`

2. ✅ Model file exists?  
   `ls backend/model/model.h5`

3. ✅ Frontend running?  
   Browser shows page (not blank)

4. ✅ Console logs appearing?  
   See `✅ [UploadCard] Component mounted`?

5. ✅ Button click triggers logs?  
   See `🖱️ [UploadCard] Analyze button clicked!`?

6. ✅ API call succeeds?  
   See `✅ [api.js] Response status: 200`?

7. ✅ Response has data?  
   See `✅ [Upload.jsx] Disease: ...`?

If any step fails, check that specific component's logs.

---

## 📞 Debug Output Example

**Successful Run:**
```
✅ [UploadCard] Component mounted
🟢 [UploadCard] handleFileSelect - File selected: leaf.jpg
✅ [UploadCard] File validation passed
🖖 [UploadCard] Analyze button clicked!
✅ [UploadCard] File selected: leaf.jpg
⏳ [UploadCard] Calling onUpload callback...
🔵 [Upload.jsx] handleUpload called with file: leaf.jpg
📡 [Upload.jsx] Sending prediction request...
✅ [api.js] Response status: 200
✅ [Upload.jsx] Disease: Tomato Early Blight
✅ [Upload.jsx] Confidence: 92.5
🔄 [Upload.jsx] Navigating to results page...
```

**Failed Run:**
```
✅ [UploadCard] Component mounted
❌ Error: "No file selected!"
(Need to select file first)
```

---

**Last Updated:** March 31, 2026  
**Version:** 1.0.0  
**Status:** ✅ Debug Logging Complete
