# Payment Flow Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER VISITS HOMEPAGE                     │
│                      http://localhost:3000                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Clicks "Get    │
                    │ Started" or    │
                    │ Cart Icon      │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Pricing Modal  │
                    │ Opens          │
                    │ (3 Plans)      │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ User Clicks    │
                    │ "Select Plan"  │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Check: Logged  │
                    │ In?            │
                    └────┬───────┬───┘
                         │       │
                    NO   │       │   YES
                         │       │
                         ▼       ▼
              ┌──────────────┐  ┌──────────────┐
              │ Show Login   │  │ Check Plan   │
              │ Modal        │  │ Type         │
              └──────────────┘  └──────┬───────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
          ┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
          │ Short Term      │ │ Monthly      │ │ Ultimate        │
          │ PKR 650         │ │ PKR 900      │ │ PKR 1300        │
          │ (2 Books)       │ │ (2 Books)    │ │ (All Books)     │
          └────────┬────────┘ └──────┬───────┘ └────────┬────────┘
                   │                 │                   │
                   ▼                 ▼                   │
          ┌─────────────────────────────┐               │
          │  Book Selection Modal       │               │
          │  - Biology                  │               │
          │  - Chemistry                │               │
          │  - Physics                  │               │
          │  - Mathematics              │               │
          │  - Computer Science         │               │
          │                             │               │
          │  [Select Exactly 2 Books]   │               │
          └────────────┬────────────────┘               │
                       │                                │
                       └────────────┬───────────────────┘
                                    │
                                    ▼
                       ┌────────────────────┐
                       │  Payment Modal     │
                       │                    │
                       │  Plan: [Name]      │
                       │  Amount: PKR [X]   │
                       │  Books: [List]     │
                       │                    │
                       │  Pay to:           │
                       │  03448007154       │
                       │  (JazzCash/Easy)   │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ User Fills Form:   │
                       │ - Transaction ID   │
                       │   (11 digits)      │
                       │ - Screenshot       │
                       │   (Today only)     │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ Frontend           │
                       │ Validation         │
                       └─────────┬──────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
          ┌─────────────┐ ┌──────────┐ ┌──────────┐
          │ TxnID = 11  │ │ Screenshot│ │ All      │
          │ digits?     │ │ = Today?  │ │ Fields?  │
          └──────┬──────┘ └─────┬────┘ └─────┬────┘
                 │              │            │
            NO   │   YES   NO   │   YES  NO  │   YES
                 │              │            │
                 ▼              ▼            ▼
          ┌──────────┐   ┌──────────┐  ┌──────────┐
          │ Show     │   │ Show     │  │ Submit   │
          │ Error    │   │ Error    │  │ to       │
          └──────────┘   └──────────┘  │ Backend  │
                                        └─────┬────┘
                                              │
                                              ▼
                                   ┌──────────────────┐
                                   │ Backend          │
                                   │ Validation       │
                                   └──────┬───────────┘
                                          │
                         ┌────────────────┼────────────────┐
                         │                │                │
                         ▼                ▼                ▼
                  ┌──────────┐    ┌──────────┐    ┌──────────┐
                  │ Payment  │    │ TxnID    │    │ Duplicate│
                  │ Number = │    │ Valid?   │    │ TxnID?   │
                  │ 034480..?│    │          │    │          │
                  └────┬─────┘    └────┬─────┘    └────┬─────┘
                       │               │               │
                  YES  │  NO      YES  │  NO      NO   │  YES
                       │               │               │
                       ▼               ▼               ▼
                  ┌─────────────────────────────┐  ┌──────────┐
                  │ Save to payments.json       │  │ Reject   │
                  │ {                           │  │ Payment  │
                  │   plan: "monthly",          │  └──────────┘
                  │   amount: 900,              │
                  │   transactionId: "...",     │
                  │   screenshot: "...",        │
                  │   books: ["Bio", "Chem"],   │
                  │   paymentNumber: "0344...", │
                  │   status: "pending",        │
                  │   timestamp: "..."          │
                  │ }                           │
                  └──────────────┬──────────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ Success Message    │
                       │ "Payment submitted!│
                       │ We will verify     │
                       │ within 24 hours"   │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ User Waits for     │
                       │ Admin Approval     │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ ADMIN PROCESS      │
                       │ (Manual)           │
                       └─────────┬──────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
          ┌─────────────┐ ┌──────────┐ ┌──────────┐
          │ Check       │ │ Verify   │ │ Check    │
          │ Screenshot  │ │ Payment  │ │ JazzCash │
          │ in uploads/ │ │ Details  │ │ Account  │
          └──────┬──────┘ └─────┬────┘ └─────┬────┘
                 │              │            │
                 └──────────────┼────────────┘
                                │
                                ▼
                       ┌────────────────────┐
                       │ Update             │
                       │ payments.json:     │
                       │ - status: approved │
                       │ - userId: 123      │
                       │ - expiresAt: date  │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ User Can Now       │
                       │ Access Books       │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ User Visits        │
                       │ /books Page        │
                       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ Check Subscription │
                       │ API Call           │
                       └─────────┬──────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
          ┌─────────────┐ ┌──────────┐ ┌──────────┐
          │ No          │ │ Approved │ │ Ultimate │
          │ Subscription│ │ 2 Books  │ │ Plan     │
          └──────┬──────┘ └─────┬────┘ └─────┬────┘
                 │              │            │
                 ▼              ▼            ▼
          ┌──────────┐   ┌──────────┐  ┌──────────┐
          │ Show All │   │ Show Only│  │ Show All │
          │ Books    │   │ Selected │  │ Books    │
          └──────────┘   │ 2 Books  │  └──────────┘
                         └──────────┘
```

## State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PAYMENT STATES                          │
└─────────────────────────────────────────────────────────────┘

    [User Submits Payment]
            │
            ▼
    ┌───────────────┐
    │   PENDING     │ ◄─── Initial state
    │               │      Waiting for admin
    └───────┬───────┘
            │
            │ Admin Reviews
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────┐
│APPROVED │   │REJECTED │
│         │   │         │
│User can │   │User must│
│access   │   │resubmit │
│books    │   │         │
└─────────┘   └─────────┘
```

## Book Access Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOK ACCESS FLOW                          │
└─────────────────────────────────────────────────────────────┘

User visits /books
        │
        ▼
Check: Is user logged in?
        │
    ┌───┴───┐
    │       │
   NO      YES
    │       │
    ▼       ▼
Show All  Check Subscription
Books     (API Call)
          │
          ▼
    Has Subscription?
          │
    ┌─────┴─────┐
    │           │
   NO          YES
    │           │
    ▼           ▼
Show All    Check Plan Type
Books       │
            ├─── Ultimate Plan
            │    └─► Show All Books
            │
            └─── Short/Monthly Plan
                 └─► Show Only Selected 2 Books
                     (Filter by subscription.books)
```

## Demo Usage Tracking

```
┌─────────────────────────────────────────────────────────────┐
│                  DEMO TRACKING FLOW                          │
└─────────────────────────────────────────────────────────────┘

User Opens Browser
        │
        ▼
Check localStorage
for 'paperify_guest_id'
        │
    ┌───┴───┐
    │       │
  Found   Not Found
    │       │
    │       ▼
    │   Generate New ID:
    │   guest_[timestamp]_[random]
    │       │
    │       ▼
    │   Save to localStorage
    │       │
    └───────┴───────┐
                    │
                    ▼
            Use Guest ID for
            Demo Tracking
                    │
                    ▼
            Track in demo-usage.json
            {
              "guest_123_abc": 2,
              "guest_456_def": 1
            }
                    │
                    ▼
            Check: Count >= 2?
                    │
            ┌───────┴───────┐
            │               │
           YES             NO
            │               │
            ▼               ▼
    Show Pricing      Allow Demo
    Modal             Continue
```

## Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   VALIDATION LAYERS                          │
└─────────────────────────────────────────────────────────────┘

                    USER INPUT
                        │
                        ▼
        ┌───────────────────────────┐
        │   FRONTEND VALIDATION     │
        │   (JavaScript)            │
        ├───────────────────────────┤
        │ ✓ Transaction ID = 11     │
        │ ✓ Screenshot exists       │
        │ ✓ Screenshot date = today │
        │ ✓ All fields filled       │
        │ ✓ 2 books selected        │
        └───────────┬───────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │   BACKEND VALIDATION      │
        │   (Node.js)               │
        ├───────────────────────────┤
        │ ✓ Payment # = 03448007154 │
        │ ✓ Transaction ID = 11     │
        │ ✓ No duplicate TxnID      │
        │ ✓ Screenshot uploaded     │
        │ ✓ Valid plan & amount     │
        └───────────┬───────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │   MANUAL VERIFICATION     │
        │   (Admin)                 │
        ├───────────────────────────┤
        │ ✓ Screenshot authentic    │
        │ ✓ Payment received        │
        │ ✓ Amount matches          │
        │ ✓ Date is recent          │
        └───────────┬───────────────┘
                    │
                    ▼
                APPROVED ✅
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA FLOW                               │
└─────────────────────────────────────────────────────────────┘

Frontend (Browser)
        │
        │ POST /api/payment/submit
        │ FormData {
        │   plan, amount, transactionId,
        │   screenshot, books, paymentNumber
        │ }
        │
        ▼
Backend (Node.js)
        │
        ├─► Validate Input
        │
        ├─► Check Duplicate TxnID
        │   (Read payments.json)
        │
        ├─► Save Screenshot
        │   (uploads/payments/)
        │
        ├─► Create Payment Record
        │   {
        │     plan, amount, transactionId,
        │     screenshot, books, paymentNumber,
        │     timestamp, status: "pending"
        │   }
        │
        ├─► Append to payments.json
        │
        └─► Return Success Response
                │
                ▼
        Frontend Shows Success
                │
                ▼
        User Waits for Approval
                │
                ▼
        Admin Reviews
                │
                ▼
        Admin Updates payments.json
        {
          status: "approved",
          userId: 123,
          expiresAt: "2024-02-20"
        }
                │
                ▼
        User Can Access Books
```

## File Structure

```
Real web/
│
├── index.js                    ← Main server
├── database.js                 ← User database
├── payments.json               ← Payment records
├── demo-usage.json             ← Demo tracking
│
├── views/
│   ├── Welcomepage.ejs         ← Payment modals
│   ├── questions.ejs           ← MCQs display
│   └── books.ejs               ← Book filtering
│
├── public/
│   └── demo-manager.js         ← Demo tracking
│
├── uploads/
│   └── payments/               ← Screenshots
│
└── Documentation/
    ├── IMPLEMENTATION_SUMMARY.md
    ├── PAYMENT_ADMIN_GUIDE.md
    ├── TESTING_CHECKLIST.md
    ├── QUICK_START.md
    └── FLOW_DIAGRAM.md         ← This file
```

## Key Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM COMPONENTS                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │
├──────────────┤
│ - Modals     │ ◄─── User Interface
│ - Validation │
│ - Forms      │
└──────┬───────┘
       │
       │ HTTP Requests
       │
       ▼
┌──────────────┐
│   Backend    │
├──────────────┤
│ - Express    │ ◄─── Server Logic
│ - Multer     │
│ - Validation │
└──────┬───────┘
       │
       │ Read/Write
       │
       ▼
┌──────────────┐
│   Storage    │
├──────────────┤
│ - JSON Files │ ◄─── Data Persistence
│ - SQLite DB  │
│ - Uploads    │
└──────────────┘
```

---

**Legend:**
- `│` = Flow direction
- `▼` = Next step
- `◄─` = Points to
- `✓` = Validation check
- `✅` = Success state
