# Payment Data Structure & Admin Guide

## payments.json Structure

```json
[
  {
    "plan": "monthly",
    "amount": "900",
    "transactionId": "12345678901",
    "screenshot": "1234567890-screenshot.jpg",
    "books": ["Biology", "Chemistry"],
    "paymentNumber": "03448007154",
    "timestamp": "2024-01-20T10:30:00.000Z",
    "status": "pending",
    "userId": null,
    "expiresAt": null
  }
]
```

## Payment Status Flow

### 1. Pending (Initial State)
```json
{
  "status": "pending",
  "userId": null,
  "expiresAt": null
}
```

### 2. Approved (After Admin Verification)
```json
{
  "status": "approved",
  "userId": 123,
  "expiresAt": "2024-02-20T10:30:00.000Z"
}
```

### 3. Rejected (If Payment Invalid)
```json
{
  "status": "rejected",
  "reason": "Invalid transaction ID"
}
```

## Admin Approval Process

### Step 1: Check New Payments
1. Open `payments.json`
2. Find entries with `"status": "pending"`
3. Note the transaction ID and screenshot filename

### Step 2: Verify Payment
1. Check screenshot in `uploads/payments/` folder
2. Verify:
   - Screenshot shows payment to 03448007154
   - Amount matches the plan amount
   - Transaction ID matches
   - Date is recent (today)

### Step 3: Check JazzCash/EasyPaisa Account
1. Login to 03448007154 account
2. Find transaction with matching ID
3. Verify amount received

### Step 4: Approve Payment
1. Find the user who made payment (check session/email)
2. Update payment entry:
```json
{
  "status": "approved",
  "userId": 123,
  "expiresAt": "2024-02-20T10:30:00.000Z"
}
```

### Step 5: Calculate Expiry Date
- **Short Term**: Current date + 14 days
- **Monthly**: Current date + 30 days
- **Ultimate**: Current date + 30 days

Example:
```javascript
// If approved on 2024-01-20
// Monthly plan expires on 2024-02-19
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30);
```

## Plan Details

| Plan | Duration | Price | Books | Features |
|------|----------|-------|-------|----------|
| Short Term | 14 days | PKR 650 | 2 books | Choose logo, 2 books, unlimited papers |
| Monthly | 30 days | PKR 900 | 2 books | Choose logo, 2 books, 20 papers |
| Ultimate | 30 days | PKR 1300 | All books | Everything + no book limit + priority support |

## Book Options

Available books for selection:
1. Biology
2. Chemistry
3. Physics
4. Mathematics
5. Computer Science

## Screenshot Verification Checklist

✅ Screenshot shows payment app (JazzCash/EasyPaisa)
✅ Recipient number is 03448007154
✅ Amount matches plan price
✅ Transaction ID is visible and matches
✅ Date/time is recent (within 24 hours)
✅ Screenshot is not edited/photoshopped

## Common Issues

### Issue: Duplicate Transaction ID
**Solution**: Reject payment, ask user to submit new transaction

### Issue: Wrong Amount
**Solution**: Reject payment, ask user to pay correct amount

### Issue: Old Screenshot
**Solution**: Reject payment, ask user to submit fresh screenshot

### Issue: Wrong Payment Number
**Solution**: Reject payment, inform user of correct number

## User Notification (Manual)

After approval, notify user via:
1. Email (if available)
2. In-app notification
3. Update their account status

Message template:
```
Dear User,

Your payment for [PLAN NAME] has been approved!

Plan Details:
- Plan: [Short Term/Monthly/Ultimate]
- Amount: PKR [AMOUNT]
- Books: [BOOK1, BOOK2]
- Valid Until: [EXPIRY DATE]

You can now access your selected books and generate papers.

Thank you for choosing Paperify!
```

## Database Schema (Future Enhancement)

Consider adding a `subscriptions` table:
```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  plan TEXT,
  books TEXT,
  amount INTEGER,
  transaction_id TEXT,
  starts_at DATETIME,
  expires_at DATETIME,
  status TEXT,
  created_at DATETIME
);
```

## API Endpoints

### Check Subscription
```
GET /api/user/subscription
Response: { subscription: { plan, books, expiresAt } }
```

### Submit Payment
```
POST /api/payment/submit
Body: FormData with plan, amount, transactionId, screenshot, books
Response: { success: true, message: "..." }
```

## Security Notes

1. **Never expose payment verification logic to frontend**
2. **Always verify transaction IDs server-side**
3. **Store screenshots securely**
4. **Validate file types (images only)**
5. **Check file size limits**
6. **Sanitize transaction IDs**
7. **Use HTTPS in production**

## Monitoring

Track these metrics:
- Total payments submitted
- Pending payments count
- Approved payments count
- Rejected payments count
- Average approval time
- Most popular plan
- Most selected books

## Backup

Regularly backup:
- `payments.json`
- `uploads/payments/` folder
- User database
- Demo usage data
