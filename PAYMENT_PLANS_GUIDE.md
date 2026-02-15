# Paperify Payment Plans - Complete Guide

## 💳 Payment Plans Overview

### Plan 1: Weekly Unlimited (PKR 600)
**Duration**: 14 Days (2 Weeks)
**Expiry Calculation**: Current Date + 14 days

**Features**:
- ✅ **Unlimited Papers**: Generate as many papers as you want
- ✅ **All Books Access**: Access to ALL subjects/books
- ✅ **All Classes**: Class 9, 11, 12
- ✅ **All Groups**: Science & Arts
- ✅ **Custom Logo**: Upload your own logo
- ✅ **All Question Types**: MCQs, Short, Long Questions
- ✅ **Bilingual**: English & Urdu support
- ✅ **Topic Selection**: Choose specific topics
- ✅ **No Restrictions**: Use any book, any time

**Best For**: Students preparing for exams in 2 weeks

---

### Plan 2: Monthly Specific (PKR 900) ⭐ MOST POPULAR
**Duration**: 30 Days (1 Month)
**Expiry Calculation**: Current Date + 30 days

**Features**:
- ✅ **30 Papers Limit**: Generate up to 30 papers
- ✅ **1 Specific Book**: Choose ONE book to lock
- ✅ **All Classes**: Can select from Class 9, 11, or 12
- ✅ **All Groups**: Science or Arts
- ✅ **Custom Logo**: Upload your own logo
- ✅ **All Question Types**: MCQs, Short, Long Questions
- ✅ **Bilingual**: English & Urdu support
- ✅ **Topic Selection**: Choose specific topics
- ⚠️ **Book Lock**: Once selected, cannot change book

**Best For**: Students focusing on one subject for a month

---

### Plan 3: Monthly Unlimited (PKR 1300)
**Duration**: 30 Days (1 Month)
**Expiry Calculation**: Current Date + 30 days

**Features**:
- ✅ **Unlimited Papers**: Generate as many papers as you want
- ✅ **All Books Access**: Access to ALL subjects/books
- ✅ **All Classes**: Class 9, 11, 12
- ✅ **All Groups**: Science & Arts
- ✅ **Custom Logo**: Upload your own logo
- ✅ **All Question Types**: MCQs, Short, Long Questions
- ✅ **Bilingual**: English & Urdu support
- ✅ **Topic Selection**: Choose specific topics
- ✅ **No Restrictions**: Use any book, any time
- ✅ **Priority Support**: Get help faster

**Best For**: Teachers or students preparing for multiple subjects

---

## 🆓 Demo/Free Plan

**Duration**: Unlimited (but limited usage)
**Papers Allowed**: 2 Free Papers

**Features**:
- ✅ **2 Free Papers**: Try before you buy
- ✅ **All Books Access**: Can try any book
- ✅ **All Question Types**: MCQs, Short, Long Questions
- ✅ **Bilingual**: English & Urdu support
- ⚠️ **No Custom Logo**: Cannot upload logo
- ⚠️ **Limited Papers**: Only 2 papers total
- ❌ **After Limit**: MUST purchase a plan to continue

**Demo Limit Enforcement**:
```
IF user generates 2 papers:
  → Show message: "Demo limit reached. Please purchase a plan to continue."
  → Redirect to pricing page
  → CANNOT generate more papers until payment
```

---

## 📅 Expiry Date Calculation

### Code Implementation:
```javascript
const expirationDate = new Date();

if (plan === 'weekly_unlimited') {
  expirationDate.setDate(expirationDate.getDate() + 14); // 2 weeks
} else if (plan === 'monthly_specific' || plan === 'monthly_unlimited') {
  expirationDate.setMonth(expirationDate.getMonth() + 1); // 1 month
}

// Save as ISO string
payment.expirationDate = expirationDate.toISOString();
```

### Example Expiry Dates:

**If purchased on: January 15, 2024**

| Plan | Expiry Date | Days |
|------|-------------|------|
| Weekly Unlimited | January 29, 2024 | 14 |
| Monthly Specific | February 15, 2024 | 30 |
| Monthly Unlimited | February 15, 2024 | 30 |

---

## 🔒 Payment Flow & Verification

### Step 1: User Selects Plan
```
User clicks plan → Check if logged in → Show login if needed
```

### Step 2: Book Selection (Monthly Specific Only)
```
Show ALL books from JSON → User selects 1 book → Lock to subscription
```

### Step 3: Payment Form
```
Display:
- Plan name
- Amount (PKR)
- Selected book (if applicable)
- Payment number: 0344 8007154
- Transaction ID input (11 digits)
- Screenshot upload
```

### Step 4: Payment Submission
```javascript
{
  plan: "monthly_specific",
  amount: 900,
  transactionId: "12345678901",
  userEmail: "user@example.com",
  books: ["Biology"],
  screenshot: "filename.jpg",
  timestamp: "2024-01-15T10:30:00.000Z",
  expirationDate: "2024-02-15T10:30:00.000Z",
  status: "pending"
}
```

### Step 5: Admin Approval
```
Admin reviews payment → Approves → Status changes to "approved"
```

### Step 6: User Can Generate Papers
```
IF subscription.status === 'approved' AND expirationDate > currentDate:
  → Allow paper generation
ELSE:
  → Block and show "Please purchase a plan"
```

---

## ✅ Subscription Verification Logic

### Demo User (No Payment):
```javascript
IF demoUsage >= 2:
  → BLOCK: "Demo limit reached. Purchase a plan to continue."
  → Show pricing modal
  → Cannot generate papers
ELSE:
  → Allow paper generation
  → Increment demo count
```

### Paid User (Active Subscription):
```javascript
const now = new Date();
const expiry = new Date(subscription.expirationDate);

IF subscription.status === 'approved' AND expiry > now:
  IF plan === 'weekly_unlimited' OR plan === 'monthly_unlimited':
    → Allow unlimited papers
  ELSE IF plan === 'monthly_specific':
    IF paperCount < 30:
      → Allow paper generation
      → Increment count
    ELSE:
      → BLOCK: "30 paper limit reached. Upgrade to unlimited."
ELSE:
  → BLOCK: "Subscription expired. Please renew."
  → Show pricing modal
```

### Expired Subscription:
```javascript
IF subscription.status === 'approved' BUT expiry < now:
  → BLOCK: "Your subscription expired on [date]. Please renew."
  → Show pricing modal
  → Cannot generate papers until new payment
```

---

## 📊 Payment Status States

| Status | Meaning | User Can Generate? |
|--------|---------|-------------------|
| `pending` | Waiting for admin approval | ❌ NO |
| `approved` | Payment verified, active | ✅ YES (if not expired) |
| `rejected` | Payment invalid | ❌ NO |
| `expired` | Subscription ended | ❌ NO |

---

## 🔐 Book Access Control

### Weekly Unlimited & Monthly Unlimited:
```javascript
// Show ALL books from JSON
const allBooks = await fetch('/api/books/all');
// No filtering needed
```

### Monthly Specific:
```javascript
IF subscription.books.length === 0:
  // Show ALL books, prompt to lock one
  → "Click a book to lock it to your subscription"
ELSE:
  // Show ONLY selected book
  const allowedBooks = subscription.books;
  subjects = subjects.filter(s => allowedBooks.includes(s.name));
```

---

## 💰 Payment Validation Rules

### Transaction ID:
- ✅ Must be exactly 11 digits
- ✅ Must be numeric only
- ✅ Must be unique (not used before)
- ❌ Cannot be reused

### Screenshot:
- ✅ Must be uploaded
- ✅ Must be image file
- ✅ Should be from today (file.lastModified check)
- ❌ Cannot be old screenshot

### Payment Number:
- ✅ Must be: **0344 8007154**
- ❌ Any other number rejected

### Book Selection:
- ✅ Monthly Specific: Exactly 1 book required
- ✅ Other plans: No book selection needed

---

## 🚀 After Payment Approval

### What Happens:
1. Admin approves payment
2. Status changes to "approved"
3. Expiry date is set (14 or 30 days)
4. User can now:
   - ✅ Generate papers (within limits)
   - ✅ Access subscribed books
   - ✅ Upload custom logo
   - ✅ Select topics
   - ✅ Download/print papers

### User Dashboard Shows:
```
✅ Active Subscription
Plan: Monthly Specific
Book: Biology
Papers Used: 5 / 30
Expires: February 15, 2024
Days Remaining: 25 days
```

---

## ⚠️ Important Notes

1. **Demo Limit is STRICT**: After 2 papers, user MUST pay
2. **Expiry is AUTOMATIC**: No grace period after expiry
3. **Book Lock is PERMANENT**: Cannot change book in Monthly Specific
4. **Transaction ID is UNIQUE**: Cannot reuse same ID
5. **Payment is MANUAL**: Admin must approve within 24 hours
6. **No Refunds**: Once approved, no refunds (mention in terms)

---

## 📱 User Experience Flow

```
New User
  ↓
Try Demo (2 free papers)
  ↓
Demo Limit Reached
  ↓
BLOCKED → "Purchase a plan to continue"
  ↓
Select Plan → Login → Pay
  ↓
Wait for Approval (24 hours)
  ↓
Approved → Generate Papers
  ↓
Subscription Expires
  ↓
BLOCKED → "Renew subscription"
  ↓
Pay Again → Continue
```

---

## 🔧 Technical Implementation

### Check Demo Limit:
```javascript
GET /api/demo/check?userId=guest_123
Response: { count: 2, limit: 2, error: "Demo limit reached" }
```

### Check Subscription:
```javascript
GET /api/user/subscription
Response: {
  subscription: {
    plan: "monthly_specific",
    books: ["Biology"],
    expiresAt: "2024-02-15T10:30:00.000Z",
    isExpired: false,
    daysRemaining: 25
  }
}
```

### Submit Payment:
```javascript
POST /api/payment/submit
Body: {
  plan, amount, transactionId, books, screenshot
}
Response: { success: true, message: "Payment submitted" }
```

---

**Last Updated**: Today
**Version**: 2.0
**Status**: ✅ Production Ready
