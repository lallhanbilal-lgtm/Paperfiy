import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import session from 'express-session';
import bookRoutes from './routes/book.js';
import {
  initDatabase,
  createUser,
  findUserByEmail,
  verifyPassword,
  savePayment,
  findPaymentByTransactionId,
  createOrUpdateSubscription,
  getSubscription
} from './database.js';

/* ===================== DIRNAME FIX ===================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

/* ===================== DATA DIRECTORY ===================== */
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads', 'payments');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/* ===================== VIEW ENGINE ===================== */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ===================== MIDDLEWARE ===================== */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'paperify-default-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

/* ===================== UTILITY ===================== */
function loadBoardData(board) {
  try {
    const safeBoard = board.trim().toLowerCase();
    const filePath = path.join(
      __dirname,
      'syllabus',
      `${safeBoard}_board_syllabus.json`
    );

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return [];
    }

    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${board} board data:`, error);
    return [];
  }
}

/* ===================== ROUTES ===================== */

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, subject, age, institution, country, preferredBooks } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    const userId = await createUser({ email, password, name, subject, age, institution, country, preferredBooks });
    req.session.userId = userId;
    req.session.userEmail = email;
    res.json({ success: true, userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user || !await verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, subject: user.subject } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = await findUserByEmail(req.session.userEmail);
  res.json({ user: { id: user.id, email: user.email, name: user.name, subject: user.subject, preferredBooks: JSON.parse(user.preferred_books || '[]') } });
});

// Subscription and Usage
app.get('/api/user/subscription', async (req, res) => {
  try {
    if (!req.session.userId) return res.json({ subscription: null });

    const paymentsFile = path.join(DATA_DIR, 'payments.json');
    if (!fs.existsSync(paymentsFile)) return res.json({ subscription: null });

    const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
    const now = new Date();
    
    // Find the most recent approved payment that is NOT expired
    const approvedPayments = payments.filter(p => 
      p.status === 'approved' && 
      p.userEmail === req.session.userEmail &&
      new Date(p.expirationDate) > now
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const activePayment = approvedPayments[0];

    if (activePayment) {
      const expirationDate = new Date(activePayment.expirationDate);
      const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
      
      // Map plan names correctly
      let planName = activePayment.plan;
      if (planName === 'weekly_unlimited') planName = 'short_term';
      if (planName === 'monthly_specific') planName = 'monthly';
      if (planName === 'monthly_unlimited') planName = 'ultimate';
      
      res.json({
        subscription: {
          plan: planName,
          originalPlan: activePayment.plan,
          books: activePayment.books || [],
          expiresAt: activePayment.expirationDate,
          isExpired: false,
          daysRemaining: daysRemaining,
          isActive: true
        }
      });
    } else {
      // Check if user has any expired subscriptions
      const expiredPayments = payments.filter(p => 
        p.status === 'approved' && 
        p.userEmail === req.session.userEmail &&
        new Date(p.expirationDate) <= now
      );
      
      res.json({ 
        subscription: null,
        hasExpiredSubscription: expiredPayments.length > 0
      });
    }
  } catch (error) {
    console.error('Subscription check error:', error);
    res.json({ subscription: null });
  }
});

app.get('/api/payment/status/:transactionId', (req, res) => {
  try {
    const paymentsFile = path.join(DATA_DIR, 'payments.json');
    if (!fs.existsSync(paymentsFile)) return res.json({ status: 'not-found' });

    const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
    const payment = payments.find(p => p.transactionId === req.params.transactionId);

    if (!payment) return res.json({ status: 'not-found' });

    const expirationDate = new Date(payment.expirationDate);
    const now = new Date();
    res.json({
      status: payment.status,
      plan: payment.plan,
      expiresAt: payment.expirationDate,
      isExpired: now > expirationDate,
      daysRemaining: Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    res.json({ status: 'error', error: error.message });
  }
});

app.post('/api/user/subscription/lock-book', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const { book } = req.body;
    if (!book) return res.status(400).json({ success: false, error: 'Book is required' });

    const paymentsFile = path.join(DATA_DIR, 'payments.json');
    if (!fs.existsSync(paymentsFile)) return res.status(404).json({ success: false, error: 'No subscription found' });

    let payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
    const userEmail = req.session.userEmail;
    const now = new Date();

    const activeSubIndex = payments.findIndex(p =>
      p.status === 'approved' &&
      p.userEmail === userEmail &&
      p.plan === 'monthly_specific' &&
      (!p.books || p.books.length === 0) &&
      new Date(p.expirationDate) > now
    );

    if (activeSubIndex === -1) {
      return res.status(400).json({ success: false, error: 'No eligible Monthly plan (PKR 900) subscription found or book already locked.' });
    }

    payments[activeSubIndex].books = [book];
    fs.writeFileSync(paymentsFile, JSON.stringify(payments, null, 2));

    console.log(`🔒 Book "${book}" locked to Monthly plan for user: ${userEmail}`);
    res.json({ success: true, message: `Book "${book}" locked to your Monthly subscription (PKR 900).` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(DATA_DIR, 'uploads', 'payments');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

app.post('/api/payment/submit', upload.single('screenshot'), (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: 'Please login first to submit payment' });
    }

    const { plan, amount, transactionId, books, paymentNumber } = req.body;
    const screenshot = req.file;

    if (paymentNumber !== '03448007154') return res.status(400).json({ success: false, error: 'Invalid payment number' });
    if (!transactionId || transactionId.length !== 11) return res.status(400).json({ success: false, error: 'Transaction ID must be 11 digits' });

    const paymentsFile = path.join(DATA_DIR, 'payments.json');
    let payments = [];
    if (fs.existsSync(paymentsFile)) {
      payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
      if (payments.find(p => p.transactionId === transactionId)) {
        return res.status(400).json({ success: false, error: 'Transaction ID already used.' });
      }
    }

    if (!screenshot) return res.status(400).json({ success: false, error: 'Screenshot is required' });

    // Set correct expiration dates based on plan
    const expirationDate = new Date();
    if (plan === 'short_term' || plan === 'weekly_unlimited') {
      expirationDate.setDate(expirationDate.getDate() + 14); // 14 days
    } else if (plan === 'monthly' || plan === 'monthly_specific') {
      expirationDate.setDate(expirationDate.getDate() + 30); // 30 days
    } else if (plan === 'ultimate' || plan === 'monthly_unlimited') {
      expirationDate.setDate(expirationDate.getDate() + 30); // 30 days
    } else {
      expirationDate.setDate(expirationDate.getDate() + 30); // Default 30 days
    }

    // Map frontend plan names to backend plan names
    let backendPlan = plan;
    if (plan === 'short_term') backendPlan = 'weekly_unlimited';
    if (plan === 'monthly') backendPlan = 'monthly_specific';
    if (plan === 'ultimate') backendPlan = 'monthly_unlimited';

    const paymentData = {
      plan: backendPlan,
      frontendPlan: plan,
      amount, 
      transactionId,
      screenshot: screenshot ? screenshot.filename : null,
      books: books ? JSON.parse(books) : [],
      paymentNumber,
      userEmail: req.session.userEmail,
      timestamp: new Date().toISOString(),
      expirationDate: expirationDate.toISOString(),
      status: 'pending',
      claimed: true
    };

    // Instant approval for valid payments
    const isValidTransaction = /^\d{11}$/.test(transactionId) && paymentNumber === '03448007154';
    const isValidScreenshot = screenshot && screenshot.mimetype && screenshot.mimetype.startsWith('image/');
    
    if (isValidTransaction && isValidScreenshot) {
      paymentData.status = 'approved';
      console.log(`✅ Auto-approved valid payment: ${transactionId} - Plan: ${plan} (${backendPlan})`);
    } else {
      console.log(`⚠️ Payment requires manual review: ${transactionId}`);
    }

    payments.push(paymentData);
    fs.writeFileSync(paymentsFile, JSON.stringify(payments, null, 2));
    console.log(`💾 Payment saved to: ${paymentsFile}`);
    
    const approvalMessage = paymentData.status === 'approved' 
      ? `✅ Payment approved! You can now use Paperify until ${expirationDate.toLocaleDateString()}.`
      : `✅ Payment submitted! Approval pending review.`;
    
    res.json({ success: true, message: approvalMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/demo/track', (req, res) => {
  try {
    const userId = req.body.userId || 'guest';
    const subject = req.body.subject || 'General';
    const isGuest = userId.startsWith('guest_') || userId === 'guest';

    if (isGuest) {
      const demoFile = path.join(DATA_DIR, 'demo-usage.json');
      let usage = {};
      if (fs.existsSync(demoFile)) usage = JSON.parse(fs.readFileSync(demoFile, 'utf8'));
      usage[userId] = (usage[userId] || 0) + 1;
      fs.writeFileSync(demoFile, JSON.stringify(usage, null, 2));
      return res.json({ count: usage[userId], limit: 3 });
    } else {
      const userEmail = req.session.userEmail;
      if (!userEmail) return res.status(401).json({ error: 'Session expired' });

      const paymentsFile = path.join(DATA_DIR, 'payments.json');
      if (!fs.existsSync(paymentsFile)) {
        const demoFile = path.join(DATA_DIR, 'demo-usage.json');
        let usage = {};
        if (fs.existsSync(demoFile)) usage = JSON.parse(fs.readFileSync(demoFile, 'utf8'));
        usage[userId] = (usage[userId] || 0) + 1;
        fs.writeFileSync(demoFile, JSON.stringify(usage, null, 2));
        return res.json({ count: usage[userId], limit: 3 });
      }

      const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
      const activeSub = payments.find(p => p.status === 'approved' && p.userEmail === userEmail && new Date(p.expirationDate) > new Date());

      if (!activeSub) {
        const demoFile = path.join(DATA_DIR, 'demo-usage.json');
        let usage = {};
        if (fs.existsSync(demoFile)) usage = JSON.parse(fs.readFileSync(demoFile, 'utf8'));
        usage[userId] = (usage[userId] || 0) + 1;
        fs.writeFileSync(demoFile, JSON.stringify(usage, null, 2));
        return res.json({ count: usage[userId], limit: 3 });
      }

      if (activeSub.plan === 'monthly_specific') {
        const subUsageFile = path.join(DATA_DIR, 'subscription-usage.json');
        let subUsage = {};
        if (fs.existsSync(subUsageFile)) subUsage = JSON.parse(fs.readFileSync(subUsageFile, 'utf8'));
        const usageKey = `${userEmail}_${activeSub.transactionId}`;
        if (!subUsage[usageKey]) subUsage[usageKey] = {};
        subUsage[usageKey][subject] = (subUsage[usageKey][subject] || 0) + 1;
        fs.writeFileSync(subUsageFile, JSON.stringify(subUsage, null, 2));
        return res.json({ count: subUsage[usageKey][subject], limit: 30, plan: 'monthly_specific' });
      }

      return res.json({ count: 0, limit: 99999, unlimited: true });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/api/demo/check', async (req, res) => {
  try {
    const demoFile = path.join(DATA_DIR, 'demo-usage.json');
    const subUsageFile = path.join(DATA_DIR, 'subscription-usage.json');

    // Check for temporary unlimited access
    if (req.session && req.session.tempUnlimitedUntil && Date.now() < req.session.tempUnlimitedUntil) {
      return res.json({ count: 0, limit: 999999, unlimited: true, expiresAt: req.session.tempUnlimitedUntil });
    }

    const userId = req.query.userId || 'guest';
    const subject = req.query.subject || 'General';
    const isGuest = userId.startsWith('guest_') || userId === 'guest';

    // Guest users - demo limit
    if (isGuest) {
      if (!fs.existsSync(demoFile)) return res.json({ count: 0, limit: 3 });
      const usage = JSON.parse(fs.readFileSync(demoFile, 'utf8'));
      return res.json({ count: usage[userId] || 0, limit: 3 });
    }

    // Logged in users - check subscription
    const userEmail = req.session.userEmail;
    if (!userEmail) return res.json({ count: 0, limit: 3, error: 'Please login to continue' });

    const paymentsFile = path.join(DATA_DIR, 'payments.json');
    if (!fs.existsSync(paymentsFile)) {
      // No subscription - use demo limit
      if (!fs.existsSync(demoFile)) return res.json({ count: 0, limit: 3 });
      const usage = JSON.parse(fs.readFileSync(demoFile, 'utf8'));
      const count = usage[userId] || 0;
      if (count >= 3) return res.json({ count, limit: 3, error: 'Demo limit reached. Please purchase a plan.' });
      return res.json({ count, limit: 3 });
    }

    const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
    const now = new Date();
    
    // Find active subscription
    const activeSub = payments.find(p => 
      p.status === 'approved' && 
      p.userEmail === userEmail && 
      new Date(p.expirationDate) > now
    );

    if (!activeSub) {
      // No active subscription - use demo limit
      if (!fs.existsSync(demoFile)) return res.json({ count: 0, limit: 3 });
      const usage = JSON.parse(fs.readFileSync(demoFile, 'utf8'));
      const count = usage[userId] || 0;
      if (count >= 3) return res.json({ count, limit: 3, error: 'Demo limit reached. Please purchase a plan.' });
      return res.json({ count, limit: 3 });
    }

    // Handle different subscription plans
    if (activeSub.plan === 'weekly_unlimited' || activeSub.plan === 'monthly_unlimited') {
      return res.json({ count: 0, limit: 99999, unlimited: true, plan: activeSub.plan });
    }

    if (activeSub.plan === 'monthly_specific') {
      const allowedBooks = activeSub.books || [];
      
      // Check if subject is allowed for monthly specific plan
      if (allowedBooks.length > 0) {
        const normalizedSubject = subject.toLowerCase().replace(/\s/g, '').trim();
        const normalizedBooks = allowedBooks.map(b => b.toLowerCase().replace(/\s/g, '').trim());
        
        if (!normalizedBooks.includes(normalizedSubject)) {
          return res.json({ 
            error: `Your Monthly plan (PKR 900) is only for: ${allowedBooks.join(', ')}. Current subject: ${subject}`,
            allowedBooks: allowedBooks,
            currentSubject: subject,
            plan: 'monthly_specific'
          });
        }
      } else {
        // No books selected yet for monthly plan
        return res.json({ 
          error: `Please select your books first for your Monthly plan (PKR 900).`,
          plan: 'monthly_specific',
          needsBookSelection: true
        });
      }
      
      // Track usage for monthly_specific plan
      let subUsage = {};
      if (fs.existsSync(subUsageFile)) subUsage = JSON.parse(fs.readFileSync(subUsageFile, 'utf8'));
      const usageKey = `${userEmail}_${activeSub.transactionId}`;
      const subjectCount = (subUsage[usageKey] || {})[subject] || 0;
      
      if (subjectCount >= 30) {
        return res.json({ 
          count: subjectCount, 
          limit: 30, 
          error: 'Monthly limit reached for this subject.',
          plan: 'monthly_specific' 
        });
      }
      
      return res.json({ count: subjectCount, limit: 30, plan: 'monthly_specific' });
    }

    // Fallback to demo limit
    return res.json({ count: 0, limit: 3 });
  } catch (error) {
    console.error('Demo check error:', error);
    res.json({ count: 0, limit: 3, error: error.message });
  }
});

// Admin Toggle
app.post('/api/admin/temp-unlimited', (req, res) => {
  const superEmail = process.env.SUPERUSER_EMAIL || 'bilal@paperify.com';
  if (!req.session || req.session.userEmail !== superEmail) return res.status(403).json({ error: 'forbidden' });
  const durationMs = parseInt(req.body.durationMs) || (60 * 60 * 1000);
  req.session.tempUnlimitedUntil = Date.now() + durationMs;
  res.json({ success: true, expiresAt: req.session.tempUnlimitedUntil });
});

// Syllabus API
app.get('/api/data/:board', (req, res) => res.json(loadBoardData(req.params.board)));

// Get all books from all boards
app.get('/api/books/all', (req, res) => {
  try {
    const boards = ['punjab', 'sindh', 'fedral'];
    const allBooks = new Set();
    
    boards.forEach(board => {
      try {
        const data = loadBoardData(board);
        if (!data || !Array.isArray(data)) {
          console.log(`⚠️ No data for ${board}`);
          return;
        }
        data.forEach(classData => {
          if (classData.subjects && Array.isArray(classData.subjects)) {
            classData.subjects.forEach(subject => {
              // Handle both nested and simple name structures
              let name;
              if (subject.name && typeof subject.name === 'object' && subject.name.en) {
                name = subject.name.en;
              } else if (typeof subject.name === 'string') {
                name = subject.name;
              }
              
              if (name && typeof name === 'string') {
                allBooks.add(name.trim());
              }
            });
          }
        });
      } catch (err) {
        console.error(`Error loading ${board}:`, err.message);
      }
    });
    
    const booksList = Array.from(allBooks).sort();
    console.log(`📚 Found ${booksList.length} books:`, booksList);
    res.json({ books: booksList });
  } catch (error) {
    console.error('❌ Error in /api/books/all:', error);
    res.status(500).json({ books: [], error: error.message });
  }
});

app.get('/api/user/has-paid', (req, res) => {
  try {
    if (!req.session || !req.session.userEmail) {
      return res.json({ hasPaid: false });
    }
    const paymentsFile = path.join(DATA_DIR, 'payments.json');
    if (!fs.existsSync(paymentsFile)) return res.json({ hasPaid: false });
    const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
    const hasPaid = payments.some(p => p.userEmail === req.session.userEmail && p.status === 'approved');
    res.json({ hasPaid });
  } catch (error) {
    res.json({ hasPaid: false });
  }
});

app.get('/api/subjects/:board/:class/:group', (req, res) => {
  try {
    const { board, class: className, group } = req.params;
    const data = loadBoardData(board);
    const classData = data.find(c => c.class.toString() === className.toString());
    if (!classData) return res.json([]);

    // Updated subject lists for better categorization
    const science = ['biology', 'chemistry', 'physics', 'mathematics', 'computer science', 'english', 'urdu'];
    const arts = ['civics', 'food and nutrition', 'general mathematics', 'general science', 'home economics', 'pakistan studies', 'physical education', 'poultry farming', 'english', 'urdu', 'islamic studies', 'history', 'geography', 'economics', 'political science', 'sociology', 'psychology'];

    let subjects = [];
    
    if (classData.subjects && Array.isArray(classData.subjects)) {
      if (group.toLowerCase() === 'all') {
        // For Class 11/12, show all subjects
        subjects = classData.subjects;
      } else {
        subjects = classData.subjects.filter(subject => {
          const name = (subject.name && typeof subject.name === 'object') ? subject.name.en : subject.name;
          if (!name) return false;
          const normalizedName = name.toLowerCase().trim();
          
          if (group.toLowerCase() === 'science') {
            return science.includes(normalizedName);
          } else if (group.toLowerCase() === 'arts') {
            return arts.includes(normalizedName);
          }
          return false;
        });
      }
    }
    
    console.log(`📚 Found ${subjects.length} subjects for ${board} Class ${className} ${group}:`, subjects.map(s => (s.name && typeof s.name === 'object') ? s.name.en : s.name));
    res.json(subjects);
  } catch (error) {
    console.error('❌ Error in subjects API:', error);
    res.status(500).json({ error: 'Failed to load subjects' });
  }
});

app.get('/api/subjects/:board/:class', (req, res) => {
  try {
    const { board, class: className } = req.params;
    const data = loadBoardData(board);
    const classData = data.find(c => c.class.toString() === className.toString());
    
    if (!classData) {
      console.log(`❌ No class data found for ${board} Class ${className}`);
      return res.json([]);
    }
    
    const subjects = classData.subjects || [];
    
    // Process subjects to handle nested name structure
    const processedSubjects = subjects.map(subject => {
      let name;
      if (subject.name && typeof subject.name === 'object' && subject.name.en) {
        name = subject.name.en;
      } else if (typeof subject.name === 'string') {
        name = subject.name;
      } else {
        name = 'Unknown Subject';
      }
      
      return {
        ...subject,
        displayName: name
      };
    });
    
    console.log(`📚 Found ${processedSubjects.length} subjects for ${board} Class ${className}:`, processedSubjects.map(s => s.displayName));
    res.json(processedSubjects);
  } catch (error) {
    console.error('❌ Error in subjects API:', error);
    res.status(500).json({ error: 'Failed to load subjects' });
  }
});

app.get('/api/chapters/:board/:class/:subject', (req, res) => {
  try {
    const { board, class: className, subject } = req.params;
    const data = loadBoardData(board);
    const classData = data.find(c => c.class.toString() === className.toString());
    if (!classData) return res.json([]);
    
    const decodedSubject = decodeURIComponent(subject).toLowerCase().trim();
    const subjectData = classData.subjects.find(s => {
      const name = (s.name && typeof s.name === 'object') ? s.name.en : s.name;
      return name && name.toLowerCase().trim() === decodedSubject;
    });
    
    if (!subjectData) {
      console.log(`❌ No subject data found for ${decodedSubject}`);
      return res.json([]);
    }
    
    const chapters = subjectData.chapters ? subjectData.chapters.map(ch => ({
      title: (ch.chapter && typeof ch.chapter === 'object') ? ch.chapter.en : ch.chapter || ch.title,
      title_ur: (ch.chapter && typeof ch.chapter === 'object') ? ch.chapter.ur : ''
    })) : [];
    
    console.log(`📖 Found ${chapters.length} chapters for ${decodedSubject}`);
    res.json(chapters);
  } catch (error) {
    console.error('❌ Error in chapters API:', error);
    res.json([]);
  }
});

app.get('/api/topics/:board/:class/:subject/:chapter', (req, res) => {
  const { board, class: className, subject, chapter } = req.params;
  if (!['11', '12'].includes(className)) return res.json([]);
  const data = loadBoardData(board);
  const classData = data.find(c => c.class.toString() === className.toString());
  if (!classData) return res.json([]);
  const subjectData = classData.subjects.find(s => s.name.en.toLowerCase().trim() === decodeURIComponent(subject).toLowerCase().trim());
  if (!subjectData) return res.json([]);
  const chapterData = subjectData.chapters.find(ch => ch.chapter.en === decodeURIComponent(chapter));
  res.json(chapterData && Array.isArray(chapterData.topics) ? chapterData.topics.map(t => ({ topic: t.topic, status: t.status || 'active' })) : []);
});

// Routes and Pages
app.use('/book', bookRoutes);
app.get('/', (req, res) => {
  const superEmail = process.env.SUPERUSER_EMAIL || 'bilal@paperify.com';
  res.render('Welcomepage', {
    userEmail: req.session ? req.session.userEmail : null,
    isSuperUser: req.session && req.session.userEmail === superEmail,
    tempUnlimitedUntil: req.session ? req.session.tempUnlimitedUntil : null,
    superEmail: superEmail
  });
});
app.get('/board', (req, res) => res.render('board'));
app.get('/paper', (req, res) => res.render('classes'));
app.get('/group', (req, res) => res.render('groups'));
app.get('/books', (req, res) => res.render('books'));
app.get('/questions', (req, res) => res.render('questions'));
app.get('/pape', (req, res) => res.render('paper-generator'));
app.get('/courses', (req, res) => res.render('Courses'));
app.get('/pricing', (req, res) => res.render('pricing'));

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  try {
    await initDatabase();
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ Database failed:', err);
  }
});