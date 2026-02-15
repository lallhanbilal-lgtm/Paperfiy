# Quick Start Guide - Paperify Payment System

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Installation

1. **Install Dependencies**
```bash
cd "d:\Real web"
npm install
```

2. **Verify Required Packages**
Make sure these are installed:
- express
- ejs
- multer
- express-session
- sqlite3
- bcrypt

If missing, install:
```bash
npm install express ejs multer express-session sqlite3 bcrypt
```

3. **Create Required Folders**
```bash
mkdir uploads
mkdir uploads\payments
```

4. **Start the Server**
```bash
node index.js
```

You should see:
```
🚀 Server running at http://localhost:3000
```

---

## 🧪 Quick Test

### Test 1: Basic Flow (2 minutes)

1. Open http://localhost:3000
2. Click "Get Started Now"
3. Select any board, class, group
4. Select a subject and chapters
5. Go to questions page
6. **Check**: Do you see MCQs? ✅

### Test 2: Payment Flow (5 minutes)

1. Go to http://localhost:3000
2. Click cart icon (top right)
3. Click "Select Plan" on Monthly
4. **Check**: Does it ask you to login? ✅
5. Login with test account
6. Click "Select Plan" again
7. **Check**: Does book selection modal appear? ✅
8. Select 2 books
9. Click "Continue to Payment"
10. **Check**: Does payment modal appear? ✅
11. Fill form:
    - Transaction ID: 12345678901
    - Upload a screenshot
12. Click "Submit Payment"
13. **Check**: Success message? ✅
14. Open `payments.json`
15. **Check**: Is your payment there? ✅

---

## 📁 Important Files

### Configuration Files
- `index.js` - Main server file
- `package.json` - Dependencies
- `database.js` - Database setup

### Data Files
- `payments.json` - Payment records
- `demo-usage.json` - Demo usage tracking
- `paperify.db` - User database (SQLite)

### View Files
- `views/Welcomepage.ejs` - Home page with payment
- `views/questions.ejs` - Questions page with MCQs
- `views/books.ejs` - Books page with filtering
- `views/pricing.ejs` - Pricing page

### Public Files
- `public/demo-manager.js` - Demo tracking script

---

## 🔧 Common Issues & Solutions

### Issue 1: Server won't start
**Error**: `Cannot find module 'express'`

**Solution**:
```bash
npm install
```

### Issue 2: Multer not working
**Error**: `Multer not installed`

**Solution**:
```bash
npm install multer
```

### Issue 3: Database error
**Error**: `Database modules not available`

**Solution**:
```bash
npm install sqlite3 bcrypt express-session
```

### Issue 4: Port already in use
**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in index.js:
const PORT = process.env.PORT || 3001;
```

### Issue 5: Payments not saving
**Check**:
1. Does `payments.json` exist?
2. Does `uploads/payments/` folder exist?
3. Check console for errors

**Solution**:
```bash
# Create files/folders
echo [] > payments.json
mkdir uploads\payments
```

### Issue 6: MCQs not showing
**Check**:
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check if demo MCQs are in questions.ejs

**Solution**: Demo MCQs should automatically appear

---

## 📊 Monitoring

### Check Payment Records
```bash
# View payments.json
type payments.json

# Or open in text editor
notepad payments.json
```

### Check Demo Usage
```bash
# View demo-usage.json
type demo-usage.json
```

### Check Uploaded Screenshots
```bash
# List uploaded files
dir uploads\payments
```

---

## 🎯 Feature Checklist

### Implemented Features ✅
- [x] MCQs display (minimum 10)
- [x] Demo usage tracking (unique per browser)
- [x] Login required for plan selection
- [x] Book selection modal (2 books)
- [x] Payment modal with validation
- [x] Screenshot date validation
- [x] Transaction ID validation (11 digits)
- [x] Duplicate transaction prevention
- [x] Payment saved to JSON
- [x] Book filtering based on subscription

### Pending Features ⏳
- [ ] Admin panel for payment approval
- [ ] Email notifications
- [ ] Automatic expiry checking
- [ ] Payment history page
- [ ] Analytics dashboard
- [ ] EXIF data validation

---

## 🔐 Test Accounts

### Create Test User
1. Go to http://localhost:3000
2. Click login icon
3. Sign up with:
   - Email: test@example.com
   - Password: test123
   - Name: Test User

### Test Payment
Use these test values:
- Transaction ID: 12345678901
- Amount: 900 (for monthly)
- Books: Biology, Chemistry
- Screenshot: Any recent image

---

## 📝 Admin Tasks

### Approve a Payment

1. Open `payments.json`
2. Find the pending payment
3. Update it:
```json
{
  "plan": "monthly",
  "amount": "900",
  "transactionId": "12345678901",
  "screenshot": "1234567890-screenshot.jpg",
  "books": ["Biology", "Chemistry"],
  "paymentNumber": "03448007154",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "status": "approved",
  "userId": 1,
  "expiresAt": "2024-02-20T10:30:00.000Z"
}
```
4. Save the file
5. User can now access their books

### Calculate Expiry Date
- Short Term: +14 days
- Monthly: +30 days
- Ultimate: +30 days

Use this tool: https://www.timeanddate.com/date/dateadd.html

---

## 🐛 Debugging

### Enable Debug Mode
Add to `index.js`:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

### Check Browser Console
1. Press F12
2. Go to Console tab
3. Look for errors (red text)

### Check Server Console
Look at terminal where server is running for errors

### Common Error Messages

**"Please login first"**
- User is not logged in
- Solution: Login first

**"You can only select 2 books"**
- User tried to select more than 2 books
- Solution: Select exactly 2

**"Transaction ID must be 11 digits"**
- Transaction ID is wrong length
- Solution: Enter 11 digits

**"Screenshot must be from today"**
- Screenshot file is old
- Solution: Take fresh screenshot

**"Transaction ID already used"**
- Duplicate transaction
- Solution: Use different transaction ID

---

## 📞 Support

### Documentation
- `IMPLEMENTATION_SUMMARY.md` - Feature overview
- `PAYMENT_ADMIN_GUIDE.md` - Admin guide
- `TESTING_CHECKLIST.md` - Testing guide

### Logs
- Server console - Real-time logs
- Browser console - Frontend errors
- `payments.json` - Payment records

---

## 🎉 Success!

If you can:
1. ✅ See MCQs in questions page
2. ✅ Select a plan (after login)
3. ✅ Choose 2 books
4. ✅ Submit payment
5. ✅ See payment in payments.json

Then everything is working! 🎊

---

## 🚦 Next Steps

1. **Test thoroughly** using TESTING_CHECKLIST.md
2. **Approve test payments** manually
3. **Test book filtering** with approved payments
4. **Deploy to production** (if ready)
5. **Monitor payments** regularly
6. **Add admin panel** (future enhancement)

---

## 💡 Tips

- Keep `payments.json` backed up
- Check screenshots regularly
- Verify transactions in JazzCash/EasyPaisa
- Monitor demo usage to prevent abuse
- Test on multiple browsers
- Test on mobile devices

---

## 🔄 Updates

To update the code:
1. Pull latest changes
2. Run `npm install` (if package.json changed)
3. Restart server
4. Test critical features

---

## 📧 Contact

For issues or questions:
- Check documentation first
- Review error messages
- Check browser/server console
- Test in incognito mode
- Clear browser cache

---

**Happy Testing! 🚀**
