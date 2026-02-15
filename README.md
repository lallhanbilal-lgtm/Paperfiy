# Paperify - Educational Paper Generation Platform

## 📚 Overview

Paperify is a comprehensive educational platform that allows students and teachers to generate custom exam papers with MCQs, short questions, and long questions. The platform includes a complete payment system with book subscription management.

## ✨ Features

### Core Features
- 🎯 **Custom Paper Generation** - Generate papers based on board, class, subject, and chapters
- 📝 **Multiple Question Types** - MCQs, Short Questions, Long Questions, Theorems
- 🌐 **Bilingual Support** - English and Urdu content
- 🎨 **Custom Branding** - Upload your own logo for papers
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

### Payment System
- 💳 **Multiple Plans** - Short Term (14 days), Monthly (30 days), Ultimate (30 days)
- 📚 **Book Selection** - Choose 2 specific books for Short/Monthly plans
- 🔒 **Secure Payments** - JazzCash/EasyPaisa integration
- ✅ **Payment Verification** - Screenshot and transaction ID validation
- 🎫 **Subscription Management** - Book access based on active subscription

### Demo System
- 🆓 **Free Trial** - 2 free paper generations per user
- 🔑 **Unique Tracking** - Per-browser demo usage tracking
- 🚀 **Seamless Upgrade** - Easy transition to paid plans

## 🚀 Quick Start

### Prerequisites
```bash
Node.js v14+
npm or yarn
```

### Installation
```bash
# Clone or navigate to project
cd "d:\Real web"

# Install dependencies
npm install

# Start server
node index.js
```

Server runs at: http://localhost:3000

## 📖 Documentation

### For Users
- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[Flow Diagram](FLOW_DIAGRAM.md)** - Visual representation of all flows

### For Developers
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical overview of features
- **[Testing Checklist](TESTING_CHECKLIST.md)** - Comprehensive testing guide

### For Admins
- **[Payment Admin Guide](PAYMENT_ADMIN_GUIDE.md)** - How to manage payments and subscriptions

## 💰 Pricing Plans

| Plan | Duration | Price | Books | Features |
|------|----------|-------|-------|----------|
| **Short Term** | 14 days | PKR 650 | 2 books | Custom logo, Unlimited papers |
| **Monthly** | 30 days | PKR 900 | 2 books | Custom logo, 20 papers |
| **Ultimate** | 30 days | PKR 1300 | All books | Everything + Priority support |

## 🔧 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - User database
- **Multer** - File upload handling
- **bcrypt** - Password hashing

### Frontend
- **EJS** - Template engine
- **Tailwind CSS** - Styling
- **Vanilla JavaScript** - Client-side logic
- **Firebase Auth** - Authentication

### Storage
- **JSON Files** - Payment records, demo tracking
- **File System** - Screenshot uploads
- **SQLite Database** - User data

## 📁 Project Structure

```
Real web/
├── index.js                    # Main server file
├── database.js                 # Database configuration
├── package.json                # Dependencies
│
├── views/                      # EJS templates
│   ├── Welcomepage.ejs         # Home + Payment modals
│   ├── questions.ejs           # Question configuration
│   ├── books.ejs               # Book selection
│   ├── pricing.ejs             # Pricing page
│   └── ...
│
├── public/                     # Static files
│   ├── demo-manager.js         # Demo tracking
│   └── images/
│
├── routes/                     # API routes
│   └── book.js
│
├── syllabus/                   # Board syllabi
│   ├── punjab_board_syllabus.json
│   ├── sindh_board_syllabus.json
│   └── fedral_board_syllabus.json
│
├── uploads/                    # User uploads
│   └── payments/               # Payment screenshots
│
├── payments.json               # Payment records
├── demo-usage.json             # Demo tracking data
└── paperify.db                 # User database
```

## 🎯 Key Features Implemented

### 1. MCQs Display ✅
- Minimum 10 demo MCQs always available
- Bilingual support (English + Urdu)
- Multiple choice options
- Random or manual selection

### 2. Demo Usage Tracking ✅
- Unique guest ID per browser
- Persistent tracking via localStorage
- 2 free papers per user
- Automatic upgrade prompt

### 3. Login-Protected Plans ✅
- Must login before selecting plan
- Automatic login modal
- Session management
- Secure authentication

### 4. Book Selection ✅
- Modal interface for book selection
- Exactly 2 books required (Short/Monthly)
- 5 available books:
  - Biology
  - Chemistry
  - Physics
  - Mathematics
  - Computer Science

### 5. Payment Processing ✅
- Payment to: **03448007154**
- JazzCash / EasyPaisa
- Transaction ID validation (11 digits)
- Screenshot upload with date verification
- Duplicate transaction prevention

### 6. Book Access Control ✅
- Filter books based on subscription
- Show only subscribed books
- Ultimate plan = all books
- Automatic filtering on /books page

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ Session management
- ✅ Transaction ID uniqueness check
- ✅ Screenshot date validation
- ✅ Payment number verification
- ✅ Input sanitization
- ✅ File type validation

## 📊 Payment Flow

1. **User selects plan** → Login check
2. **Login required** → Show login modal
3. **Book selection** → Choose 2 books (if applicable)
4. **Payment form** → Enter transaction ID + screenshot
5. **Validation** → Frontend + Backend checks
6. **Save payment** → Store in payments.json
7. **Admin review** → Manual verification
8. **Approval** → Update status + add expiry
9. **Book access** → User can access subscribed books

## 🧪 Testing

Run through the comprehensive testing checklist:

```bash
# See TESTING_CHECKLIST.md for detailed tests
```

Key tests:
- ✅ MCQs display correctly
- ✅ Demo tracking works per browser
- ✅ Login required for plans
- ✅ Book selection enforced
- ✅ Payment validation works
- ✅ Payments saved correctly
- ✅ Book filtering works

## 🐛 Known Issues & Limitations

### Current Limitations
- Screenshot date validation uses file.lastModified (not EXIF)
- Payment approval is manual (no admin panel yet)
- No email notifications
- No automatic expiry checking
- No payment history page for users

### Future Enhancements
- [ ] Admin panel for payment management
- [ ] Email notifications for payment status
- [ ] Automatic subscription expiry
- [ ] Payment history page
- [ ] Analytics dashboard
- [ ] EXIF data validation for screenshots
- [ ] Automated payment verification
- [ ] Refund system

## 📞 Support & Troubleshooting

### Common Issues

**Server won't start**
```bash
npm install
node index.js
```

**Payments not saving**
```bash
# Check if files exist
dir payments.json
dir uploads\payments
```

**MCQs not showing**
- Check browser console (F12)
- Verify demo MCQs in questions.ejs

**Login not working**
- Check Firebase configuration
- Verify database connection

### Getting Help

1. Check documentation files
2. Review error messages in console
3. Test in incognito mode
4. Clear browser cache
5. Check server logs

## 🔄 Updates & Maintenance

### Regular Tasks
- ✅ Backup payments.json daily
- ✅ Review pending payments
- ✅ Verify screenshots
- ✅ Check JazzCash/EasyPaisa account
- ✅ Monitor demo usage
- ✅ Update expiry dates

### Backup Strategy
```bash
# Backup important files
copy payments.json payments.backup.json
xcopy uploads\payments uploads\payments.backup\ /E /I
copy paperify.db paperify.backup.db
```

## 📈 Analytics & Monitoring

Track these metrics:
- Total users registered
- Active subscriptions
- Payment conversion rate
- Most popular plan
- Most selected books
- Demo to paid conversion
- Average approval time

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Update documentation
5. Submit for review

### Code Style
- Use ES6+ features
- Comment complex logic
- Follow existing patterns
- Keep functions small
- Write descriptive names

## 📄 License

[Your License Here]

## 👥 Team

- **Developer**: [Your Name]
- **Designer**: [Designer Name]
- **Admin**: [Admin Name]

## 📞 Contact

- **Email**: support@paperify.com
- **Phone**: 03448007154 (Payment Support)
- **Website**: http://localhost:3000

## 🎉 Acknowledgments

- Tailwind CSS for styling
- Firebase for authentication
- Font Awesome for icons
- Google Fonts for typography

---

## 📚 Quick Links

- [Quick Start Guide](QUICK_START.md) - Get started in 5 minutes
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Technical details
- [Payment Admin Guide](PAYMENT_ADMIN_GUIDE.md) - Admin instructions
- [Testing Checklist](TESTING_CHECKLIST.md) - Test all features
- [Flow Diagram](FLOW_DIAGRAM.md) - Visual flows

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready ✅

---

Made with ❤️ for Education
