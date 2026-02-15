# 🎓 How Paperify Works - Complete Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Journey](#user-journey)
3. [Payment System](#payment-system)
4. [Subscription Plans](#subscription-plans)
5. [Demo System](#demo-system)
6. [Book Access Control](#book-access-control)
7. [Paper Generation](#paper-generation)
8. [Technical Flow](#technical-flow)

---

## 🌟 System Overview

Paperify is an educational platform that generates custom exam papers for students. The system has three main components:

1. **User Management** - Registration, login, and authentication
2. **Payment & Subscription** - Plan selection, payment processing, and book access
3. **Paper Generation** - Custom paper creation based on board, class, subject, and chapters

---

## 👤 User Journey

### Step 1: Landing Page
- User visits the homepage (`/`)
- Can browse without login
- Sees pricing plans and features

### Step 2: Registration/Login
- **Option A**: Sign up with Google (Firebase Auth)
- **Option B**: Sign up with Email/Password
- Session is created and stored in `req.session`

### Step 3: Demo Usage (Optional)
- **Free Trial**: Every user gets 2 free paper generations
- Tracked per browser using `localStorage` with unique guest ID
- After 2 papers, user must purchase a plan

### Step 4: Plan Selection
- User clicks "Get Started" or "Select Plan"
- **Must be logged in** to select a plan
- If not logged in, login modal appears automatically

### Step 5: Book Selection (For Monthly Specific Plan)
- If user selects **Monthly Specific (PKR 900)**, they must choose **1 book**
- Modal shows ALL available books from all boards
- Books are fetched from `/api/books/all` endpoint
- Selected book is stored with payment data

### Step 6: Payment
- User fills payment form:
  - **Transaction ID** (11 digits from JazzCash/EasyPaisa)
  - **Screenshot** (must be from today)
  - **Payment Number**: 03448007154
- Payment is submitted to `/api/payment/submit`
- **Auto-approval**: Payment is automatically approved after 24 seconds
- Beautiful success modal appears: "✅ You have successfully paid! You can now use Paperify"

### Step 7: Paper Generation
- User navigates to `/paper`
- Selects:
  - Board (Punjab, Sindh, Federal)
  - Class (9, 10, 11, 12)
  - Group (Science/Arts for Class 11-12)
  - Subject (filtered based on subscription)
  - Chapters
  - Topics (for Class 11-12 only)
- Configures question types and marks
- Generates paper

---

## 💳 Payment System

### Payment Flow

```
User Selects Plan → Login Check → Book Selection (if needed) → Payment Form → Submit
     ↓
Payment Saved (status: pending) → Auto-Approve (24 seconds) → Status: approved
     ↓
User Can Access Platform → Books Filtered → Generate Papers
```

### Payment Data Structure

```json
{
  "plan": "monthly_specific",
  "amount": 900,
  "transactionId": "12345678901",
  "screenshot": "1234567890-screenshot.jpg",
  "books": ["Biology"],
  "paymentNumber": "03448007154",
  "userEmail": "user@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "expirationDate": "2024-02-15T10:30:00.000Z",
  "status": "approved",
  "claimed": true
}
```

### Payment Validation

1. **Login Required**: User must be logged in (`req.session.userId`)
2. **Transaction ID**: Must be exactly 11 digits, numeric only
3. **Screenshot**: Must be uploaded, file date must be today
4. **Payment Number**: Must match `03448007154`
5. **Duplicate Check**: Transaction ID must be unique

### Auto-Approval System

```javascript
// After payment submission, auto-approve after 24 seconds
setTimeout(() => {
  payment.status = 'approved';
  saveToFile();
}, 24000);
```

---

## 📦 Subscription Plans

### 1. Weekly Unlimited (PKR 600)
- **Duration**: 14 days
- **Papers**: Unlimited
- **Books**: All books included
- **Features**: Full access to all subjects

### 2. Monthly Specific (PKR 900)
- **Duration**: 30 days
- **Papers**: 30 papers limit
- **Books**: 1 specific book (user selects)
- **Features**: Limited to selected book only

### 3. Monthly Unlimited (PKR 1300)
- **Duration**: 30 days
- **Papers**: Unlimited
- **Books**: All books included
- **Features**: Full access + priority support

### Plan Comparison

| Feature | Weekly Unlimited | Monthly Specific | Monthly Unlimited |
|---------|-----------------|------------------|-------------------|
| Duration | 14 days | 30 days | 30 days |
| Price | PKR 600 | PKR 900 | PKR 1300 |
| Papers | Unlimited | 30 | Unlimited |
| Books | All | 1 Selected | All |
| Best For | Short-term prep | Single subject focus | Complete access |

---

## 🎁 Demo System

### How Demo Works

1. **Guest Users**: Tracked by unique ID in `localStorage`
   ```javascript
   const guestId = localStorage.getItem('paperify_guest_id') || generateGuestId();
   ```

2. **Demo Limit**: 2 free papers per browser
   - Stored in `data/demo-usage.json`
   - Format: `{ "guest_abc123": 2 }`

3. **After Demo Limit**:
   - User sees alert: "Demo limit reached"
   - **Shows payment modal** (NOT login modal)
   - Can purchase plan to continue

4. **Logged-in Users Without Subscription**:
   - Also get 2 demo papers
   - Tracked separately from guest users

### Demo Tracking API

```javascript
// Check demo usage
GET /api/demo/check?userId=guest_abc123&subject=Biology

// Track demo usage
POST /api/demo/track
Body: { userId: "guest_abc123", subject: "Biology" }
```

---

## 📚 Book Access Control

### How Book Filtering Works

1. **Check User Subscription**:
   ```javascript
   GET /api/user/subscription
   ```

2. **Filter Books Based on Plan**:
   - **Weekly/Monthly Unlimited**: Show all books
   - **Monthly Specific**: Show only selected book
   - **No Subscription**: Show all books (demo mode)

3. **Book Selection for Monthly Specific**:
   - User selects plan → Book selection modal appears
   - User chooses 1 book → Book is locked to subscription
   - Cannot change book after selection

4. **Book Locking**:
   ```javascript
   POST /api/user/subscription/lock-book
   Body: { book: "Biology" }
   ```

### Book Filtering in books.ejs

```javascript
if (userSubscription && userSubscription.books && userSubscription.books.length > 0) {
  const allowedBooks = userSubscription.books.map(b => b.toLowerCase());
  subjects = subjects.filter(s => {
    const subjectName = s.name.en.toLowerCase();
    return allowedBooks.includes(subjectName);
  });
}
```

---

## 📝 Paper Generation

### Generation Flow

```
Select Board → Select Class → Select Group → Select Subject → Select Chapters → Select Topics → Configure Questions → Generate Paper
```

### Question Types

1. **MCQs** (Multiple Choice Questions)
   - 4 options (a, b, c, d)
   - Bilingual support (English + Urdu)

2. **Short Questions**
   - 2-5 marks each
   - Brief answers required

3. **Long Questions**
   - 5-10 marks each
   - Detailed answers required

4. **Theorems** (Mathematics)
   - Proof-based questions

5. **Paragraphs** (English)
   - Comprehension passages with questions

### Topic Selection (Class 11-12 Only)

- **Active Topics**: Black text, green badge
- **Non-Active Topics**: Red text, red badge
- User can select specific topics within chapters
- Paper only includes questions from selected topics

### Paper Configuration

```javascript
{
  duration: "3 Hours",
  mcqs: { include: true, count: 10, marks: 1 },
  short: { include: true, count: 5, marks: 2 },
  long: { include: true, count: 3, marks: 5 },
  theorem: { include: false, count: 0, marks: 8 }
}
```

---

## 🔧 Technical Flow

### Database Structure

**Users Table** (`paperify.db`)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  name TEXT,
  subject TEXT,
  created_at DATETIME
);
```

**Payments** (`data/payments.json`)
```json
[
  {
    "plan": "monthly_specific",
    "amount": 900,
    "transactionId": "12345678901",
    "books": ["Biology"],
    "userEmail": "user@example.com",
    "status": "approved",
    "expirationDate": "2024-02-15T10:30:00.000Z"
  }
]
```

**Demo Usage** (`data/demo-usage.json`)
```json
{
  "guest_abc123": 2,
  "guest_xyz789": 1
}
```

### Session Management

```javascript
req.session = {
  userId: 1,
  userEmail: "user@example.com",
  tempUnlimitedUntil: null // For admin temporary unlimited access
}
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create new user |
| `/api/auth/login` | POST | Login user |
| `/api/auth/logout` | POST | Logout user |
| `/api/user/subscription` | GET | Get user's active subscription |
| `/api/payment/submit` | POST | Submit payment for verification |
| `/api/demo/check` | GET | Check demo usage count |
| `/api/demo/track` | POST | Track demo paper generation |
| `/api/books/all` | GET | Get all available books |
| `/api/subjects/:board/:class` | GET | Get subjects for class |
| `/api/chapters/:board/:class/:subject` | GET | Get chapters for subject |
| `/api/topics/:board/:class/:subject/:chapter` | GET | Get topics for chapter |

### File Structure

```
Real web/
├── index.js                    # Main server
├── database.js                 # Database functions
├── views/
│   ├── Welcomepage.ejs         # Home + Payment modals
│   ├── books.ejs               # Book/Chapter selection
│   ├── questions.ejs           # Question configuration
│   └── paper-generator.ejs     # Paper display
├── data/
│   ├── payments.json           # Payment records
│   ├── demo-usage.json         # Demo tracking
│   ├── paperify.db             # User database
│   └── uploads/payments/       # Payment screenshots
└── syllabus/
    ├── punjab_board_syllabus.json
    ├── sindh_board_syllabus.json
    └── fedral_board_syllabus.json
```

---

## 🔐 Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **Session Management**: Express-session with secure cookies
3. **Transaction ID Validation**: Unique, 11 digits, numeric only
4. **Screenshot Validation**: Must be from today
5. **Payment Number Verification**: Must match 03448007154
6. **Expiry Date Checking**: Automatic filtering of expired subscriptions
7. **Input Sanitization**: All user inputs are validated

---

## 🎯 Key Features

### ✅ Implemented Features

1. **User Authentication** (Firebase + Email/Password)
2. **Payment Processing** (JazzCash/EasyPaisa)
3. **Auto-Approval System** (24 seconds)
4. **Book Selection & Filtering**
5. **Demo System** (2 free papers)
6. **Topic Selection** (Class 11-12)
7. **Bilingual Support** (English + Urdu)
8. **Custom Logo Upload**
9. **PDF Export & Share**
10. **Subscription Management**

### 🚀 Future Enhancements

1. Admin panel for payment management
2. Email notifications
3. Payment history page
4. Analytics dashboard
5. Refund system
6. Mobile app

---

## 📞 Support

- **Payment Support**: 03448007154
- **Email**: support@paperify.com
- **Website**: http://localhost:8000

---

## 🎉 Success Metrics

Track these metrics:
- Total users registered
- Active subscriptions
- Payment conversion rate
- Most popular plan
- Most selected books
- Demo to paid conversion
- Average paper generation time

---

**Made with ❤️ for Education**
