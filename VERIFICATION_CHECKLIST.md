# VERIFICATION CHECKLIST

## ✅ Changes Applied Successfully:

### 1. Demo Limit = 10
**File**: `public/demo-manager.js`
- Line 2: `const DEMO_LIMIT = 10;` ✅

**File**: `index.js`
- All `/api/demo/*` endpoints return `limit: 10` ✅

### 2. Logo Added
**File**: `public/images/logo.svg` ✅ EXISTS
**File**: `views/Welcomepage.ejs`
- Line 529: `<img src="/images/logo.svg" alt="Paperify Logo" class="h-10">` ✅

### 3. Book Selection (1 Book for Monthly Specific)
**File**: `views/Welcomepage.ejs`
- Line 682: Enforces 1 book limit ✅
**File**: `index.js`
- Line 257: Validates exactly 1 book for monthly_specific ✅

---

## 🔍 TO SEE CHANGES:

### Step 1: RESTART SERVER
```bash
# Stop current server (Ctrl+C)
# Then run:
cd "d:\Real web"
node index.js
```

### Step 2: CLEAR BROWSER CACHE
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

### Step 3: HARD REFRESH
- Press `Ctrl + F5` (Windows)
- Or `Cmd + Shift + R` (Mac)

---

## 🧪 TEST EACH FEATURE:

### Test 1: Demo Limit
1. Open browser console (F12)
2. Type: `localStorage.clear()`
3. Refresh page
4. Try to generate 11 papers
5. After 10th paper, you should see limit message

### Test 2: Logo
1. Visit http://localhost:8000
2. Look at top-left navbar
3. You should see "Paperify" logo

### Test 3: Book Selection
1. Login to your account
2. Click "Monthly Specific" plan
3. Try to select 2 books - should show error
4. Select exactly 1 book - should proceed to payment

### Test 4: Paper Generator Data
**If paper-generator.ejs shows no data:**

1. Open browser console (F12)
2. Check for errors (red text)
3. Common issues:
   - Selections parameter missing in URL
   - Board/class/subject not found in syllabus JSON
   - JavaScript error in page

**Debug Steps:**
```javascript
// In browser console, check URL parameters:
const params = new URLSearchParams(window.location.search);
console.log('Board:', params.get('board'));
console.log('Class:', params.get('class'));
console.log('Selections:', params.get('selections'));
```

---

## 🐛 If Paper Generator Shows No Data:

The issue is likely:
1. **Missing URL parameters** - Go back to /books and select chapters again
2. **Empty syllabus** - Check if syllabus JSON files have data
3. **JavaScript error** - Check browser console for errors

**Quick Fix:**
1. Go to http://localhost:8000/paper
2. Select board, class, group
3. Select subject and chapters
4. Click "Proceed to Questions"
5. Configure questions
6. Click "Generate Paper"

---

## 📞 Still Not Working?

Share these details:
1. Browser console errors (F12 → Console tab)
2. Network tab errors (F12 → Network tab)
3. Which page shows the issue
4. Screenshot of the problem

---

**All code changes are SAVED and READY. You just need to restart the server!**
