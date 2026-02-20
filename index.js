import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import session from 'express-session';
import cors from 'cors';
import Stripe from 'stripe';
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
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/stripe/webhook') {
      req.rawBody = buf;
    }
  }
}));
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

const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');
const PAYMENT_ORDERS_FILE = path.join(DATA_DIR, 'payment-orders.json');
const REFERRAL_REQUIRED_PAID_USERS = 10;
const REFERRAL_FREE_PAPER_LIMIT = 15;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const STRIPE_PLANS = {
  weekly_unlimited: { amount: 600, name: 'Weekly Unlimited (14 Days)', backendPlan: 'weekly_unlimited', durationDays: 14 },
  monthly_specific: { amount: 900, name: 'Monthly Specific (30 Papers)', backendPlan: 'monthly_specific', durationDays: 30 },
  monthly_unlimited: { amount: 1300, name: 'Monthly Unlimited (30 Days)', backendPlan: 'monthly_unlimited', durationDays: 30 }
};
const MANUAL_PAYMENT_NUMBER = process.env.PAYMENT_NUMBER || '03448007154';
const ORDER_EXPIRY_MINUTES = parseInt(process.env.ORDER_EXPIRY_MINUTES || '15', 10);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function loadReferralData() {
  try {
    if (!fs.existsSync(REFERRALS_FILE)) return { users: {} };
    const parsed = JSON.parse(fs.readFileSync(REFERRALS_FILE, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || typeof parsed.users !== 'object') {
      return { users: {} };
    }
    return parsed;
  } catch (error) {
    console.error('Referral data read error:', error.message);
    return { users: {} };
  }
}

function saveReferralData(data) {
  fs.writeFileSync(REFERRALS_FILE, JSON.stringify(data, null, 2));
}

function generateReferralCode(email, users) {
  const base = normalizeEmail(email).split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase() || 'USER';
  let code = '';
  do {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    code = `${base}${suffix}`;
  } while (Object.values(users).some((u) => u && u.referralCode === code));
  return code;
}

function ensureReferralProfile(email) {
  const normalizedEmail = normalizeEmail(email);
  const data = loadReferralData();
  if (!normalizedEmail) return { data, profile: null };

  if (!data.users[normalizedEmail]) {
    data.users[normalizedEmail] = {
      referralCode: generateReferralCode(normalizedEmail, data.users),
      referredBy: null,
      paidReferralUsers: [],
      freePaperCount: 0,
      unlockedAt: null,
      createdAt: new Date().toISOString()
    };
    saveReferralData(data);
  }
  return { data, profile: data.users[normalizedEmail] };
}

function getReferralStatus(email) {
  const normalizedEmail = normalizeEmail(email);
  const { data, profile } = ensureReferralProfile(normalizedEmail);
  if (!profile) return null;

  if (!Array.isArray(profile.paidReferralUsers)) profile.paidReferralUsers = [];
  const paidReferrals = profile.paidReferralUsers.length;
  const unlocked = paidReferrals >= REFERRAL_REQUIRED_PAID_USERS || !!profile.unlockedAt;
  if (unlocked && !profile.unlockedAt) {
    profile.unlockedAt = new Date().toISOString();
    saveReferralData(data);
  }

  return {
    referralCode: profile.referralCode,
    referredBy: profile.referredBy || null,
    paidReferrals,
    requiredPaidReferrals: REFERRAL_REQUIRED_PAID_USERS,
    unlocked,
    freePaperCount: profile.freePaperCount || 0,
    freePaperLimit: REFERRAL_FREE_PAPER_LIMIT
  };
}

function applyReferralCode(userEmail, referralCode) {
  const normalizedEmail = normalizeEmail(userEmail);
  const normalizedCode = String(referralCode || '').trim().toUpperCase();
  if (!normalizedCode) return { ok: false, error: 'Referral code is required' };

  const { data } = ensureReferralProfile(normalizedEmail);
  const userProfile = data.users[normalizedEmail];
  if (!userProfile) return { ok: false, error: 'User not found' };
  if (userProfile.referredBy) return { ok: false, error: 'Referral code already applied' };
  if (userProfile.referralCode === normalizedCode) return { ok: false, error: 'You cannot use your own referral code' };

  const referrerEmail = Object.keys(data.users).find((email) => data.users[email]?.referralCode === normalizedCode);
  if (!referrerEmail) return { ok: false, error: 'Invalid referral code' };
  if (referrerEmail === normalizedEmail) return { ok: false, error: 'You cannot use your own referral code' };

  userProfile.referredBy = normalizedCode;
  userProfile.referredAt = new Date().toISOString();
  saveReferralData(data);
  return { ok: true, referrerEmail };
}

function creditReferrerForPaidUser(paidUserEmail) {
  const normalizedPaidUserEmail = normalizeEmail(paidUserEmail);
  const { data } = ensureReferralProfile(normalizedPaidUserEmail);
  const paidUserProfile = data.users[normalizedPaidUserEmail];
  if (!paidUserProfile || !paidUserProfile.referredBy) {
    return { credited: false };
  }

  const referrerEmail = Object.keys(data.users).find((email) => data.users[email]?.referralCode === paidUserProfile.referredBy);
  if (!referrerEmail) return { credited: false };

  const referrerProfile = data.users[referrerEmail];
  if (!Array.isArray(referrerProfile.paidReferralUsers)) referrerProfile.paidReferralUsers = [];

  if (referrerProfile.paidReferralUsers.includes(normalizedPaidUserEmail)) {
    return { credited: false, alreadyCredited: true };
  }

  referrerProfile.paidReferralUsers.push(normalizedPaidUserEmail);
  const paidReferrals = referrerProfile.paidReferralUsers.length;
  if (paidReferrals >= REFERRAL_REQUIRED_PAID_USERS && !referrerProfile.unlockedAt) {
    referrerProfile.unlockedAt = new Date().toISOString();
  }
  saveReferralData(data);

  return {
    credited: true,
    referrerEmail,
    paidReferrals,
    unlocked: paidReferrals >= REFERRAL_REQUIRED_PAID_USERS
  };
}

function getFreePaperCount(email) {
  const normalizedEmail = normalizeEmail(email);
  const { profile } = ensureReferralProfile(normalizedEmail);
  return profile?.freePaperCount || 0;
}

function incrementFreePaperCount(email) {
  const normalizedEmail = normalizeEmail(email);
  const { data, profile } = ensureReferralProfile(normalizedEmail);
  if (!profile) return 0;
  profile.freePaperCount = (profile.freePaperCount || 0) + 1;
  saveReferralData(data);
  return profile.freePaperCount;
}

function getStripeBaseUrl(req) {
  const protocol = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toString().split(',')[0].trim();
  return `${protocol}://${req.get('host')}`;
}

function parseBooks(booksInput) {
  try {
    if (!booksInput) return [];
    if (Array.isArray(booksInput)) return booksInput;
    return JSON.parse(booksInput);
  } catch {
    return [];
  }
}

function calculateExpirationDate(planKey) {
  const plan = STRIPE_PLANS[planKey];
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + (plan?.durationDays || 30));
  return expirationDate;
}

function loadPaymentOrders() {
  try {
    if (!fs.existsSync(PAYMENT_ORDERS_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(PAYMENT_ORDERS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Payment orders read error:', error.message);
    return [];
  }
}

function savePaymentOrders(orders) {
  fs.writeFileSync(PAYMENT_ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function createOrderId() {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function getPlanConfigOrNull(planKey) {
  return STRIPE_PLANS[planKey] || null;
}

function getUserEmailFromRequest(req) {
  const bodyEmail = normalizeEmail(req.body?.userEmail || req.query?.userEmail || '');
  const sessionEmail = normalizeEmail(req.session?.userEmail || '');
  return sessionEmail || bodyEmail || '';
}

function loadPayments() {
  const paymentsFile = path.join(DATA_DIR, 'payments.json');
  if (!fs.existsSync(paymentsFile)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Payments read error:', error.message);
    return [];
  }
}

function savePayments(payments) {
  const paymentsFile = path.join(DATA_DIR, 'payments.json');
  fs.writeFileSync(paymentsFile, JSON.stringify(payments, null, 2));
}

/* ===================== ROUTES ===================== */

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, subject, age, institution, country, preferredBooks, referralCode } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    const userId = await createUser({ email, password, name, subject, age, institution, country, preferredBooks });
    req.session.userId = userId;
    req.session.userEmail = email;
    ensureReferralProfile(email);
    if (referralCode) {
      applyReferralCode(email, referralCode);
    }
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
    ensureReferralProfile(user.email);
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
  ensureReferralProfile(user.email);
  res.json({ user: { id: user.id, email: user.email, name: user.name, subject: user.subject, preferredBooks: JSON.parse(user.preferred_books || '[]') } });
});

app.get('/api/referral/status', (req, res) => {
  try {
    if (!req.session || !req.session.userEmail) {
      return res.status(401).json({ success: false, error: 'Please login first' });
    }
    const status = getReferralStatus(req.session.userEmail);
    return res.json({ success: true, referral: status });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/referral/apply', (req, res) => {
  try {
    if (!req.session || !req.session.userEmail) {
      return res.status(401).json({ success: false, error: 'Please login first' });
    }
    const result = applyReferralCode(req.session.userEmail, req.body?.referralCode);
    if (!result.ok) return res.status(400).json({ success: false, error: result.error });
    return res.json({ success: true, message: 'Referral code applied successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Subscription and Usage
app.get('/api/user/subscription', (req, res) => {
  res.json({ 
    subscription: { 
      plan: 'ultimate', 
      books: [], 
      isActive: true, 
      unlimited: true 
    } 
  });
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

    console.log(`ðŸ”’ Book "${book}" locked to Monthly plan for user: ${userEmail}`);
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
  return res.status(410).json({
    success: false,
    error: 'This endpoint is disabled. Use /api/payment/create-order and /api/payment/submit-order.'
  });
});

app.post('/api/payment/create-order', (req, res) => {
  try {
    const userEmail = getUserEmailFromRequest(req);

    const planKey = req.body?.plan;
    const plan = getPlanConfigOrNull(planKey);
    if (!plan) return res.status(400).json({ success: false, error: 'Invalid plan selected.' });

    const books = parseBooks(req.body?.books);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ORDER_EXPIRY_MINUTES * 60 * 1000);
    const order = {
      orderId: createOrderId(),
      userEmail,
      plan: plan.backendPlan,
      frontendPlan: planKey,
      amount: plan.amount,
      books,
      paymentNumber: MANUAL_PAYMENT_NUMBER,
      status: 'created',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      submittedAt: null,
      transactionId: null,
      senderNumber: null,
      screenshot: null,
      reviewNote: null,
      reviewedAt: null,
      reviewedBy: null
    };

    const orders = loadPaymentOrders();
    orders.push(order);
    savePaymentOrders(orders);

    return res.json({
      success: true,
      order: {
        orderId: order.orderId,
        plan: order.frontendPlan,
        amount: order.amount,
        books: order.books,
        paymentNumber: order.paymentNumber,
        expiresAt: order.expiresAt
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/payment/submit-order', upload.single('screenshot'), (req, res) => {
  try {
    const { orderId, transactionId, senderNumber } = req.body;
    const screenshot = req.file;
    if (!orderId) return res.status(400).json({ success: false, error: 'Order ID is required.' });
    if (!/^\d{10,20}$/.test(String(transactionId || ''))) {
      return res.status(400).json({ success: false, error: 'Transaction ID must be numeric (10-20 digits).' });
    }
    if (!/^\d{4,15}$/.test(String(senderNumber || ''))) {
      return res.status(400).json({ success: false, error: 'Sender number must be numeric (4-15 digits).' });
    }
    if (!screenshot) return res.status(400).json({ success: false, error: 'Screenshot is required.' });

    const orders = loadPaymentOrders();
    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    if (orderIndex === -1) return res.status(404).json({ success: false, error: 'Order not found.' });
    const order = orders[orderIndex];

    if (order.status !== 'created') {
      return res.status(400).json({ success: false, error: `Order is already ${order.status}.` });
    }
    if (new Date(order.expiresAt) <= new Date()) {
      order.status = 'expired';
      orders[orderIndex] = order;
      savePaymentOrders(orders);
      return res.status(400).json({ success: false, error: 'Order expired. Please create a new order.' });
    }

    const payments = loadPayments();
    const isDuplicateTxn = payments.some(p => String(p.transactionId) === String(transactionId))
      || orders.some(o => o.orderId !== orderId && String(o.transactionId || '') === String(transactionId));
    if (isDuplicateTxn) {
      return res.status(400).json({ success: false, error: 'Transaction ID already used.' });
    }

    order.status = 'submitted';
    order.transactionId = String(transactionId);
    order.senderNumber = String(senderNumber);
    order.screenshot = screenshot.filename;
    order.submittedAt = new Date().toISOString();
    orders[orderIndex] = order;
    savePaymentOrders(orders);

    return res.json({
      success: true,
      message: 'Payment submitted for verification. Access will activate after approval.',
      orderStatus: order.status
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/payment/order/:orderId', (req, res) => {
  try {
    const order = loadPaymentOrders().find(o => o.orderId === req.params.orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });
    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/payment/review', (req, res) => {
  try {
    const superEmail = process.env.SUPERUSER_EMAIL || 'bilal@paperify.com';
    if (!req.session || normalizeEmail(req.session.userEmail) !== normalizeEmail(superEmail)) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const { orderId, action, note } = req.body || {};
    if (!orderId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'orderId and valid action are required.' });
    }

    const orders = loadPaymentOrders();
    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    if (orderIndex === -1) return res.status(404).json({ success: false, error: 'Order not found.' });

    const order = orders[orderIndex];
    if (order.status !== 'submitted') {
      return res.status(400).json({ success: false, error: `Order status is ${order.status}. Only submitted orders can be reviewed.` });
    }

    if (action === 'reject') {
      order.status = 'rejected';
      order.reviewNote = note || 'Rejected by admin.';
      order.reviewedAt = new Date().toISOString();
      order.reviewedBy = req.session.userEmail;
      orders[orderIndex] = order;
      savePaymentOrders(orders);
      return res.json({ success: true, message: 'Order rejected.' });
    }

    const payments = loadPayments();
    const dup = payments.some(p => String(p.transactionId) === String(order.transactionId));
    if (dup) return res.status(400).json({ success: false, error: 'Duplicate transactionId in payments.' });

    const expirationDate = calculateExpirationDate(order.frontendPlan || order.plan);
    const hadApprovedPaymentBefore = payments.some(
      p => normalizeEmail(p.userEmail) === normalizeEmail(order.userEmail) && p.status === 'approved'
    );

    payments.push({
      plan: order.plan,
      frontendPlan: order.frontendPlan,
      amount: order.amount,
      transactionId: order.transactionId,
      screenshot: order.screenshot,
      books: order.books || [],
      paymentNumber: order.paymentNumber || MANUAL_PAYMENT_NUMBER,
      senderNumber: order.senderNumber || null,
      userEmail: order.userEmail,
      timestamp: new Date().toISOString(),
      expirationDate: expirationDate.toISOString(),
      status: 'approved',
      claimed: true,
      orderId: order.orderId
    });
    savePayments(payments);

    order.status = 'approved';
    order.reviewNote = note || 'Approved by admin.';
    order.reviewedAt = new Date().toISOString();
    order.reviewedBy = req.session.userEmail;
    orders[orderIndex] = order;
    savePaymentOrders(orders);

    if (!hadApprovedPaymentBefore) {
      const reward = creditReferrerForPaidUser(order.userEmail);
      if (reward.credited) {
        console.log(`Referral reward credited: ${reward.referrerEmail} now has ${reward.paidReferrals}/${REFERRAL_REQUIRED_PAID_USERS} paid users`);
      }
    }

    return res.json({
      success: true,
      message: `Order approved. Access active until ${new Date(expirationDate).toLocaleDateString()}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/payment/pending', (req, res) => {
  try {
    const superEmail = process.env.SUPERUSER_EMAIL || 'bilal@paperify.com';
    if (!req.session || normalizeEmail(req.session.userEmail) !== normalizeEmail(superEmail)) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }
    const pending = loadPaymentOrders()
      .filter(o => o.status === 'submitted')
      .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));
    return res.json({ success: true, pending });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe is not configured on server.' });
    }
    const bodyEmail = normalizeEmail(req.body?.userEmail || '');
    const userEmail = normalizeEmail(req.session?.userEmail || bodyEmail);

    const planKey = req.body?.plan;
    const plan = STRIPE_PLANS[planKey];
    if (!plan) {
      return res.status(400).json({ success: false, error: 'Invalid plan selected.' });
    }

    const books = parseBooks(req.body?.books);

    const baseUrl = getStripeBaseUrl(req);
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'pkr',
            product_data: {
              name: plan.name
            },
            unit_amount: plan.amount * 100
          },
          quantity: 1
        }
      ],
      metadata: {
        userEmail,
        plan: plan.backendPlan,
        frontendPlan: planKey,
        books: JSON.stringify(books)
      },
      success_url: `${baseUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?payment=cancel`
    });

    return res.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      publishableKey: STRIPE_PUBLISHABLE_KEY || null
    });
  } catch (error) {
    console.error('Stripe checkout create error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/stripe/webhook', (req, res) => {
  try {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      return res.status(500).send('Stripe webhook not configured');
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).send('Missing stripe-signature');
    if (!req.rawBody) return res.status(400).send('Missing raw body for webhook verification');

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const sessionData = event.data.object;
      if (sessionData.payment_status === 'paid') {
        const paymentsFile = path.join(DATA_DIR, 'payments.json');
        let payments = [];
        if (fs.existsSync(paymentsFile)) {
          payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
        }

        const stripeSessionId = sessionData.id;
        const alreadySaved = payments.some(p => p.stripeSessionId === stripeSessionId);
        if (!alreadySaved) {
          const userEmail = normalizeEmail(sessionData.metadata?.userEmail || sessionData.customer_details?.email || '');
          const backendPlan = sessionData.metadata?.plan || 'monthly_unlimited';
          const frontendPlan = sessionData.metadata?.frontendPlan || backendPlan;
          const books = parseBooks(sessionData.metadata?.books);
          const expirationDate = calculateExpirationDate(frontendPlan);

          const hadApprovedPaymentBefore = payments.some(
            p => normalizeEmail(p.userEmail) === userEmail && p.status === 'approved'
          );

          payments.push({
            plan: backendPlan,
            frontendPlan,
            amount: (sessionData.amount_total || 0) / 100,
            transactionId: String(sessionData.payment_intent || sessionData.id),
            screenshot: null,
            books,
            paymentNumber: 'stripe',
            userEmail,
            timestamp: new Date().toISOString(),
            expirationDate: expirationDate.toISOString(),
            status: 'approved',
            claimed: true,
            stripeSessionId: sessionData.id,
            stripePaymentIntentId: sessionData.payment_intent || null
          });

          fs.writeFileSync(paymentsFile, JSON.stringify(payments, null, 2));
          console.log(`Stripe payment saved: ${sessionData.id} (${backendPlan}) for ${userEmail}`);

          if (!hadApprovedPaymentBefore && userEmail) {
            const reward = creditReferrerForPaidUser(userEmail);
            if (reward.credited) {
              console.log(`Referral reward credited: ${reward.referrerEmail} now has ${reward.paidReferrals}/${REFERRAL_REQUIRED_PAID_USERS} paid users`);
            }
          }
        }
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    return res.status(500).send('Webhook processing failed');
  }
});

app.post('/api/demo/track', (req, res) => {
  res.json({ count: 0, limit: 999999, unlimited: true, plan: 'unlimited_free' });
});

app.get('/api/demo/check', (req, res) => {
  res.json({ count: 0, limit: 999999, unlimited: true, plan: 'unlimited_free' });
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

// Add custom question API
app.post('/api/add-question', express.json(), (req, res) => {
  try {
    const { board, className, subject, chapter, questionType, questionText, questionTextUrdu } = req.body;
    
    if (!board || !className || !subject || !chapter || !questionType || !questionText) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const filePath = path.join(__dirname, 'syllabus', `${board.toLowerCase()}_board_syllabus.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Board syllabus not found' });
    }

    const syllabusData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const classData = syllabusData.find(c => c.class.toString() === className.toString());
    
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    const subjectData = classData.subjects.find(s => {
      const name = (s.name && typeof s.name === 'object') ? s.name.en : s.name;
      return name && name.toLowerCase().trim() === subject.toLowerCase().trim();
    });

    if (!subjectData) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    const chapterData = subjectData.chapters.find(ch => {
      const chName = (ch.chapter && typeof ch.chapter === 'object') ? ch.chapter.en : ch.chapter;
      return chName && chName.toLowerCase().trim() === chapter.toLowerCase().trim();
    });

    if (!chapterData) {
      return res.status(404).json({ success: false, error: 'Chapter not found' });
    }

    // Check if chapter has bilingual support
    const hasBilingualSupport = chapterData.short_questions_ur || chapterData.long_questions_ur || chapterData.mcqs?.some(q => q.question_ur);

    // Add question based on type
    if (questionType === 'mcq') {
      if (!chapterData.mcqs) chapterData.mcqs = [];
      chapterData.mcqs.push({
        question: questionText,
        question_ur: hasBilingualSupport ? (questionTextUrdu || '') : '',
        options: ['', '', '', ''],
        options_ur: hasBilingualSupport ? ['', '', '', ''] : [],
        correct: null
      });
    } else if (questionType === 'short') {
      if (!chapterData.short_questions) chapterData.short_questions = [];
      chapterData.short_questions.push(questionText);
      
      if (hasBilingualSupport) {
        if (!chapterData.short_questions_ur) chapterData.short_questions_ur = [];
        chapterData.short_questions_ur.push(questionTextUrdu || '');
      }
    } else if (questionType === 'long') {
      if (!chapterData.long_questions) chapterData.long_questions = [];
      chapterData.long_questions.push(questionText);
      
      if (hasBilingualSupport) {
        if (!chapterData.long_questions_ur) chapterData.long_questions_ur = [];
        chapterData.long_questions_ur.push(questionTextUrdu || '');
      }
    }

    // Save updated syllabus
    fs.writeFileSync(filePath, JSON.stringify(syllabusData, null, 2), 'utf8');

    res.json({ 
      success: true, 
      message: 'Question added successfully',
      hasBilingualSupport,
      question: questionText,
      questionUrdu: questionTextUrdu || ''
    });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all books from all boards
app.get('/api/books/all', (req, res) => {
  try {
    const boards = ['punjab', 'sindh', 'fedral'];
    const allBooks = new Set();
    
    boards.forEach(board => {
      try {
        const data = loadBoardData(board);
        if (!data || !Array.isArray(data)) {
          console.log(`âš ï¸ No data for ${board}`);
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
    console.log(`ðŸ“š Found ${booksList.length} books:`, booksList);
    res.json({ books: booksList });
  } catch (error) {
    console.error('âŒ Error in /api/books/all:', error);
    res.status(500).json({ books: [], error: error.message });
  }
});

app.get('/api/user/has-paid', (req, res) => {
  res.json({ hasPaid: true });
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
    
    console.log(`ðŸ“š Found ${subjects.length} subjects for ${board} Class ${className} ${group}:`, subjects.map(s => (s.name && typeof s.name === 'object') ? s.name.en : s.name));
    res.json(subjects);
  } catch (error) {
    console.error('âŒ Error in subjects API:', error);
    res.status(500).json({ error: 'Failed to load subjects' });
  }
});

app.get('/api/subjects/:board/:class', (req, res) => {
  try {
    const { board, class: className } = req.params;
    const data = loadBoardData(board);
    const classData = data.find(c => c.class.toString() === className.toString());
    
    if (!classData) {
      console.log(`âŒ No class data found for ${board} Class ${className}`);
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
    
    console.log(`ðŸ“š Found ${processedSubjects.length} subjects for ${board} Class ${className}:`, processedSubjects.map(s => s.displayName));
    res.json(processedSubjects);
  } catch (error) {
    console.error('âŒ Error in subjects API:', error);
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
      console.log(`âŒ No subject data found for ${decodedSubject}`);
      return res.json([]);
    }
    
    const chapters = subjectData.chapters ? subjectData.chapters.map(ch => ({
      title: (ch.chapter && typeof ch.chapter === 'object') ? ch.chapter.en : ch.chapter || ch.title,
      title_ur: (ch.chapter && typeof ch.chapter === 'object') ? ch.chapter.ur : ''
    })) : [];
    
    console.log(`ðŸ“– Found ${chapters.length} chapters for ${decodedSubject}`);
    res.json(chapters);
  } catch (error) {
    console.error('âŒ Error in chapters API:', error);
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
app.get('/ans', (req, res) => res.render('ans'));
app.get('/ai-mentor', (req, res) => res.render('ai-mentor'));

// AI Mentor API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBAZl5UCngV2VygkKEZh_P5GJ9RiMCfyts';
const GEMINI_FALLBACK_KEY = process.env.GEMINI_FALLBACK_KEY || 'AIzaSyDG1C_WCn5SXyL1_IMsthScwiTdPAem0EI';

app.post('/api/ai-mentor', async (req, res) => {
  console.log('🤖 AI Mentor API called with:', req.body);
  
  try {
    const { message, profile } = req.body;
    
    if (!message || !profile) {
      console.log('❌ Missing message or profile');
      return res.status(400).json({ success: false, error: 'Message and profile are required' });
    }

    console.log('✅ Generating fallback response...');
    const fallbackResponse = generateFallbackResponse(message, profile);
    console.log('✅ Response generated successfully');
    
    return res.json({ success: true, response: fallbackResponse });
  } catch (error) {
    console.error('❌ AI Mentor error:', error);
    
    // Even if fallback fails, provide basic response
    const basicResponse = `**🎯 ${req.body?.message || 'Course'} Learning Guide**\n\nI'm here to help you learn! Here are some general tips:\n\n**📚 Getting Started:**\n• Start with YouTube tutorials\n• Practice daily for 1-2 hours\n• Join online communities\n• Build projects to practice\n\n**🎥 Recommended Channels:**\n• English: Search "${req.body?.message || 'your topic'} tutorial"\n• Urdu: CodeWithHarry, Yahoo Baba\n\n**⏰ Timeline:** 3-6 months with consistent practice\n\n**🚀 Next Steps:**\n1. Search YouTube for beginner tutorials\n2. Start practicing today\n3. Join relevant Facebook groups\n4. Build a simple project\n\nKeep learning and stay consistent! 💪`;
    
    res.json({ success: true, response: basicResponse });
  }
});

async function callGeminiAPI(apiKey, systemPrompt, userPrompt) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser Query: ${userPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return { success: false, error: 'API request failed' };
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      return { success: true, text };
    }

    return { success: false, error: 'Invalid API response' };
  } catch (error) {
    console.error('Gemini API call error:', error);
    return { success: false, error: error.message };
  }
}

function generateFallbackResponse(message, profile) {
  const course = message.toLowerCase();
  const { userType, location, hasLaptop, budget } = profile;
  
  // Web Development
  if (course.includes('web') || course.includes('html') || course.includes('css') || course.includes('javascript') || course.includes('frontend') || course.includes('react') || course.includes('vue')) {
    return `**🎯 Web Development Roadmap**\n\n**📚 Learning Path (4-6 months):**\n1. HTML & CSS (3 weeks)\n2. JavaScript (6 weeks)\n3. React/Vue (8 weeks)\n4. Backend basics (4 weeks)\n\n**🎥 Best Channels:**\n• English: Traversy Media, FreeCodeCamp\n• Urdu: CodeWithHarry, Yahoo Baba\n\n**💻 Tools Needed:** ${hasLaptop === 'no' ? 'Get a laptop first - essential for coding!' : 'VS Code, Chrome DevTools'}\n\n**💰 Cost:** ${budget === '0' ? 'Free YouTube tutorials only' : 'YouTube + Udemy courses (PKR 2,000)'}\n\n**🏢 ${location} Options:** Local computer institutes, online bootcamps\n\n**🚀 Start Today:** Create your first HTML page!`;
  }
  
  // Python
  if (course.includes('python') || course.includes('django') || course.includes('flask')) {
    return `**🐍 Python Programming Roadmap**\n\n**📚 Learning Path (3-5 months):**\n1. Python basics (4 weeks)\n2. Data structures (3 weeks)\n3. OOP concepts (2 weeks)\n4. Web frameworks (6 weeks)\n\n**🎥 Best Channels:**\n• English: Corey Schafer, Programming with Mosh\n• Urdu: CodeWithHarry Python Series\n\n**💻 Setup:** ${hasLaptop === 'no' ? 'Laptop required for Python development' : 'Python 3.x + PyCharm/VS Code'}\n\n**💰 Investment:** ${budget === '0' ? 'Start with free Python.org tutorials' : 'YouTube + Python books (PKR 1,500)'}\n\n**🏢 ${location} Training:** IT institutes, university courses\n\n**🚀 First Step:** Install Python and write "Hello World"!`;
  }
  
  // Graphic Design
  if (course.includes('graphic') || course.includes('design') || course.includes('photoshop') || course.includes('illustrator')) {
    return `**🎨 Graphic Design Roadmap**\n\n**📚 Learning Path (4-6 months):**\n1. Design principles (2 weeks)\n2. Photoshop mastery (6 weeks)\n3. Illustrator skills (6 weeks)\n4. Portfolio building (4 weeks)\n\n**🎥 Best Channels:**\n• English: Adobe Creative Cloud, Tutvid\n• Urdu: Graphics Designing Urdu\n\n**💻 Requirements:** ${hasLaptop === 'no' ? 'Powerful laptop needed for design software' : 'Adobe Creative Suite, good graphics card'}\n\n**💰 Budget:** ${budget === '0' ? 'Use free alternatives like GIMP, Canva' : 'Adobe subscription (PKR 3,000/month)'}\n\n**🏢 ${location} Studios:** Design agencies, printing shops for internships\n\n**🚀 Start Now:** Download GIMP and create your first poster!`;
  }
  
  // Data Science/AI
  if (course.includes('data') || course.includes('machine') || course.includes('ai') || course.includes('analytics')) {
    return `**📊 Data Science Roadmap**\n\n**📚 Learning Path (6-8 months):**\n1. Python/R basics (4 weeks)\n2. Statistics & math (6 weeks)\n3. Pandas, NumPy (4 weeks)\n4. Machine learning (8 weeks)\n\n**🎥 Best Channels:**\n• English: 3Blue1Brown, StatQuest\n• Urdu: Data Science Urdu Tutorials\n\n**💻 Setup:** ${hasLaptop === 'no' ? 'High-performance laptop essential' : 'Jupyter Notebook, Python libraries'}\n\n**💰 Investment:** ${budget === '0' ? 'Kaggle Learn (free courses)' : 'Coursera specializations (PKR 5,000)'}\n\n**🏢 ${location} Opportunities:** Banks, telecom companies, startups\n\n**🚀 Begin With:** Analyze a simple dataset on Kaggle!`;
  }
  
  // Mobile App Development
  if (course.includes('mobile') || course.includes('app') || course.includes('android') || course.includes('ios') || course.includes('flutter')) {
    return `**📱 Mobile App Development**\n\n**📚 Learning Path (5-7 months):**\n1. Programming basics (4 weeks)\n2. Flutter/React Native (8 weeks)\n3. Backend integration (4 weeks)\n4. App store deployment (2 weeks)\n\n**🎥 Best Channels:**\n• English: Flutter Official, React Native\n• Urdu: Flutter Urdu Tutorials\n\n**💻 Tools:** ${hasLaptop === 'no' ? 'Laptop mandatory for app development' : 'Android Studio, VS Code, smartphone for testing'}\n\n**💰 Cost:** ${budget === '0' ? 'Free Flutter/React Native tutorials' : 'Udemy courses + developer accounts (PKR 4,000)'}\n\n**🏢 ${location} Market:** Growing demand for mobile developers\n\n**🚀 First App:** Build a simple calculator app!`;
  }
  
  // Digital Marketing
  if (course.includes('marketing') || course.includes('seo') || course.includes('social') || course.includes('ads')) {
    return `**📈 Digital Marketing Roadmap**\n\n**📚 Learning Path (3-4 months):**\n1. Marketing fundamentals (2 weeks)\n2. SEO & content (4 weeks)\n3. Social media marketing (4 weeks)\n4. Paid advertising (3 weeks)\n\n**🎥 Best Channels:**\n• English: Neil Patel, Moz\n• Urdu: Digital Marketing Urdu\n\n**💻 Requirements:** ${hasLaptop === 'no' ? 'Laptop helpful but smartphone can work initially' : 'Analytics tools, social media schedulers'}\n\n**💰 Budget:** ${budget === '0' ? 'Free Google Digital Garage courses' : 'Paid tools + courses (PKR 3,000/month)'}\n\n**🏢 ${location} Jobs:** Agencies, e-commerce, freelancing\n\n**🚀 Start Today:** Create a business page and post content!`;
  }
  
  // Default response for other topics
  return `**🎯 ${message} Learning Guide**\n\n**📚 General Approach:**\n1. Find quality tutorials on YouTube\n2. Practice daily (1-2 hours minimum)\n3. Join relevant communities\n4. Build real projects\n\n**🎥 Search Strategy:**\n• "${message} tutorial for beginners"\n• "${message} course in Urdu"\n• "${message} projects for practice"\n\n**💻 Setup:** ${hasLaptop === 'no' ? 'Consider getting a laptop for better learning' : 'Ensure you have necessary software installed'}\n\n**💰 Budget Plan:** ${budget === '0' ? 'Focus on free YouTube content and practice' : 'Invest in quality courses and tools'}\n\n**🏢 ${location} Opportunities:** Research local demand and training centers\n\n**⏰ Timeline:** 3-6 months with consistent daily practice\n\n**🚀 Action Plan:**\n1. Watch 3 beginner tutorials this week\n2. Practice what you learn immediately\n3. Join online communities for support\n4. Set daily learning goals\n\nStart your ${message} journey today! 💪`;
}

// Start Server
app.listen(PORT, async () => {
  console.log(`ðŸš€ Server running at http://localhost:${PORT}`);
  try {
    await initDatabase();
    console.log('âœ… Database initialized');
  } catch (err) {
    console.error('âŒ Database failed:', err);
  }
});
