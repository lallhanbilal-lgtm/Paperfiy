# Testing Checklist for Paperify Payment System

## Pre-Testing Setup
- [ ] Server is running on http://localhost:3000
- [ ] All dependencies installed (npm install)
- [ ] Database initialized (if using SQLite)
- [ ] payments.json file exists
- [ ] uploads/payments/ folder exists

## Test 1: MCQs Display
**URL**: Navigate through paper generation flow to questions page

- [ ] Open http://localhost:3000
- [ ] Click "Get Started Now" or navigate to /paper
- [ ] Select board, class, group
- [ ] Select subject and chapters
- [ ] Go to questions page
- [ ] **VERIFY**: At least 10 MCQs are visible in the picker
- [ ] **VERIFY**: MCQs have both English and Urdu text
- [ ] **VERIFY**: MCQs have 4 options each

**Expected Result**: Demo MCQs appear even if no real MCQs in database

---

## Test 2: Demo Usage Tracking (First Time User)
**URL**: http://localhost:3000

- [ ] Open browser in Incognito/Private mode
- [ ] Navigate to /paper
- [ ] Generate a paper (complete flow)
- [ ] Check browser localStorage for 'paperify_guest_id'
- [ ] **VERIFY**: Unique guest ID is created
- [ ] Generate another paper
- [ ] **VERIFY**: Same guest ID is used
- [ ] Check demo-usage.json file
- [ ] **VERIFY**: Guest ID has count of 2

**Expected Result**: Each browser gets unique guest ID, usage tracked correctly

---

## Test 3: Demo Usage Tracking (Second Browser)
**URL**: http://localhost:3000

- [ ] Open different browser or new incognito window
- [ ] Navigate to /paper
- [ ] Generate a paper
- [ ] Check localStorage
- [ ] **VERIFY**: Different guest ID than first browser
- [ ] Check demo-usage.json
- [ ] **VERIFY**: New guest ID with count of 1

**Expected Result**: Different browsers get different guest IDs

---

## Test 4: Login Required for Plan Selection
**URL**: http://localhost:3000

- [ ] Make sure you're logged out
- [ ] Click cart icon or "Get Started Now"
- [ ] Pricing modal opens
- [ ] Click "Select Plan" on any plan
- [ ] **VERIFY**: Alert says "Please login first to select a plan"
- [ ] **VERIFY**: Login modal opens automatically

**Expected Result**: Cannot select plan without login

---

## Test 5: Book Selection Modal (Monthly Plan)
**URL**: http://localhost:3000

- [ ] Login with test account
- [ ] Open pricing modal
- [ ] Click "Select Plan" on Monthly plan (PKR 900)
- [ ] **VERIFY**: Book selection modal opens
- [ ] **VERIFY**: 5 books are listed (Biology, Chemistry, Physics, Math, CS)
- [ ] Try to select 3 books
- [ ] **VERIFY**: Alert says "You can only select 2 books"
- [ ] Select exactly 2 books
- [ ] Click "Continue to Payment"
- [ ] **VERIFY**: Payment modal opens

**Expected Result**: Book selection enforced, only 2 books allowed

---

## Test 6: Book Selection Modal (Short Term Plan)
**URL**: http://localhost:3000

- [ ] Login with test account
- [ ] Open pricing modal
- [ ] Click "Select Plan" on Short Term plan (PKR 650)
- [ ] **VERIFY**: Book selection modal opens
- [ ] Select 2 books
- [ ] Click "Continue to Payment"
- [ ] **VERIFY**: Payment modal opens with correct plan and books

**Expected Result**: Short term also requires book selection

---

## Test 7: Ultimate Plan (No Book Selection)
**URL**: http://localhost:3000

- [ ] Login with test account
- [ ] Open pricing modal
- [ ] Click "Select Plan" on Ultimate plan (PKR 1300)
- [ ] **VERIFY**: Payment modal opens directly (no book selection)
- [ ] **VERIFY**: No books shown in payment details

**Expected Result**: Ultimate plan skips book selection

---

## Test 8: Payment Form Validation
**URL**: http://localhost:3000 (in payment modal)

- [ ] Open payment modal (any plan)
- [ ] **VERIFY**: Payment number shows 03448007154
- [ ] Leave transaction ID empty, click submit
- [ ] **VERIFY**: Alert says "Please fill all fields"
- [ ] Enter 10 digits in transaction ID
- [ ] **VERIFY**: Alert says "Transaction ID must be 11 digits"
- [ ] Enter 11 digits
- [ ] Don't upload screenshot, click submit
- [ ] **VERIFY**: Alert says "Please fill all fields"

**Expected Result**: All validations work correctly

---

## Test 9: Screenshot Date Validation
**URL**: http://localhost:3000 (in payment modal)

- [ ] Open payment modal
- [ ] Try to upload an old image file
- [ ] **VERIFY**: Error message "Screenshot must be from today"
- [ ] **VERIFY**: File input is cleared
- [ ] Take a fresh screenshot (today)
- [ ] Upload the fresh screenshot
- [ ] **VERIFY**: No error message
- [ ] **VERIFY**: File is accepted

**Expected Result**: Only today's screenshots accepted

---

## Test 10: Payment Submission
**URL**: http://localhost:3000

- [ ] Complete payment form with valid data:
  - Transaction ID: 12345678901 (11 digits)
  - Screenshot: Fresh screenshot from today
- [ ] Click "Submit Payment"
- [ ] **VERIFY**: Success alert appears
- [ ] **VERIFY**: Message says "verify within 24 hours"
- [ ] Check payments.json file
- [ ] **VERIFY**: New entry exists with:
  - Correct plan
  - Correct amount
  - Correct transaction ID
  - Screenshot filename
  - Selected books (if applicable)
  - paymentNumber: "03448007154"
  - status: "pending"

**Expected Result**: Payment saved to payments.json

---

## Test 11: Duplicate Transaction ID
**URL**: http://localhost:3000

- [ ] Submit a payment with transaction ID: 11111111111
- [ ] Try to submit another payment with same ID: 11111111111
- [ ] **VERIFY**: Error alert appears
- [ ] **VERIFY**: Message says "Transaction ID already used"

**Expected Result**: Duplicate transaction IDs rejected

---

## Test 12: Book Filtering (No Subscription)
**URL**: http://localhost:3000/books

- [ ] Login with account that has NO approved payment
- [ ] Navigate to /books page
- [ ] **VERIFY**: All books are visible
- [ ] **VERIFY**: No filtering applied

**Expected Result**: Users without subscription see all books

---

## Test 13: Book Filtering (With Subscription)
**URL**: http://localhost:3000/books

**Setup**: Manually edit payments.json to approve a payment:
```json
{
  "status": "approved",
  "userId": 1,
  "books": ["Biology", "Chemistry"],
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

- [ ] Login with user ID 1
- [ ] Navigate to /books page
- [ ] **VERIFY**: Only Biology and Chemistry are visible
- [ ] **VERIFY**: Other books are hidden

**Expected Result**: Only subscribed books are visible

---

## Test 14: Payment Number Validation (Backend)
**URL**: Test with API client (Postman/curl)

```bash
curl -X POST http://localhost:3000/api/payment/submit \
  -F "plan=monthly" \
  -F "amount=900" \
  -F "transactionId=12345678901" \
  -F "paymentNumber=03448007155" \
  -F "screenshot=@test.jpg"
```

- [ ] Send request with wrong payment number
- [ ] **VERIFY**: Response error: "Invalid payment number"

**Expected Result**: Backend validates payment number

---

## Test 15: Mobile Responsiveness
**URL**: http://localhost:3000

- [ ] Open on mobile device or use browser dev tools
- [ ] Test pricing modal on mobile
- [ ] **VERIFY**: Modal is responsive
- [ ] Test book selection modal
- [ ] **VERIFY**: Checkboxes are easy to tap
- [ ] Test payment modal
- [ ] **VERIFY**: Form fields are usable on mobile

**Expected Result**: All modals work on mobile

---

## Test 16: Modal Close Functionality
**URL**: http://localhost:3000

- [ ] Open pricing modal
- [ ] Click X button
- [ ] **VERIFY**: Modal closes
- [ ] Open book selection modal
- [ ] Click outside modal (backdrop)
- [ ] **VERIFY**: Modal closes
- [ ] Open payment modal
- [ ] Click X button
- [ ] **VERIFY**: Modal closes

**Expected Result**: All close methods work

---

## Test 17: Plan Details Display
**URL**: http://localhost:3000

- [ ] Open pricing modal
- [ ] **VERIFY**: Short Term shows:
  - PKR 650
  - 2 Weeks Access
  - Choose Own Logo
  - Specify any 2 Books
  - 14 Days Unlimited
- [ ] **VERIFY**: Monthly shows:
  - PKR 900
  - 1 Month Access
  - "Most Popular" badge
  - 30 Days and 20 papers
- [ ] **VERIFY**: Ultimate shows:
  - PKR 1300
  - No Book Specifications

**Expected Result**: All plan details are correct

---

## Test 18: Payment Modal Content
**URL**: http://localhost:3000

- [ ] Select Monthly plan with Biology and Chemistry
- [ ] In payment modal, **VERIFY**:
  - Plan name: "Monthly (1 Month)"
  - Amount: "PKR 900"
  - Selected Books: "Biology, Chemistry"
  - Payment number: "03448007154"
  - JazzCash / EasyPaisa label

**Expected Result**: All payment details are correct

---

## Test 19: Error Handling
**URL**: http://localhost:3000

- [ ] Disconnect from internet
- [ ] Try to submit payment
- [ ] **VERIFY**: Error message appears
- [ ] Reconnect to internet
- [ ] Try again
- [ ] **VERIFY**: Payment submits successfully

**Expected Result**: Network errors handled gracefully

---

## Test 20: Console Errors
**URL**: http://localhost:3000

- [ ] Open browser console (F12)
- [ ] Navigate through entire flow
- [ ] **VERIFY**: No JavaScript errors
- [ ] **VERIFY**: No 404 errors
- [ ] **VERIFY**: No CORS errors

**Expected Result**: No console errors

---

## Summary Checklist

### Features Working
- [ ] MCQs display (at least 10)
- [ ] Demo usage tracking (unique per browser)
- [ ] Login required for plan selection
- [ ] Book selection modal (2 books only)
- [ ] Payment modal with validation
- [ ] Screenshot date validation
- [ ] Transaction ID validation (11 digits)
- [ ] Duplicate transaction prevention
- [ ] Payment saved to payments.json
- [ ] Book filtering based on subscription
- [ ] Mobile responsive
- [ ] No console errors

### Files to Check
- [ ] payments.json (payment records)
- [ ] demo-usage.json (usage tracking)
- [ ] uploads/payments/ (screenshot files)
- [ ] Browser localStorage (guest IDs)

### Known Limitations
- Screenshot date validation uses file.lastModified (not EXIF data)
- Payment approval is manual (admin must edit payments.json)
- No admin panel for payment management
- No email notifications
- No automatic expiry checking

---

## Bug Report Template

If you find issues, report using this format:

**Bug Title**: [Brief description]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: What should happen

**Actual Result**: What actually happened

**Browser**: Chrome/Firefox/Safari/Edge

**Screenshots**: [Attach if applicable]

**Console Errors**: [Copy any errors from console]

---

## Success Criteria

All tests pass ✅
- MCQs appear correctly
- Demo tracking works per browser
- Login required before payment
- Book selection enforced
- Payment validation works
- Data saved correctly
- Book filtering works
- No critical errors

## Next Steps After Testing

1. Fix any bugs found
2. Add admin panel for payment approval
3. Add email notifications
4. Implement automatic expiry checking
5. Add EXIF data validation for screenshots
6. Add payment history page for users
7. Add analytics dashboard
