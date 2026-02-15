import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function initDatabase() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'paperify.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      google_id TEXT,
      name TEXT NOT NULL,
      subject TEXT,
      age INTEGER,
      institution TEXT,
      country TEXT,
      preferred_books TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      email TEXT,
      plan TEXT NOT NULL,
      amount INTEGER NOT NULL,
      transaction_id TEXT UNIQUE,
      screenshot TEXT,
      books TEXT,
      phone TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      email TEXT UNIQUE,
      plan TEXT,
      books TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  return db;
}

export async function createUser(userData) {
  const database = await initDatabase();
  const { email, password, name, subject, age, institution, country, preferredBooks } = userData;

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  const result = await database.run(
    `INSERT INTO users (email, password, name, subject, age, institution, country, preferred_books) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [email, hashedPassword, name, subject, age, institution, country, JSON.stringify(preferredBooks)]
  );

  return result.lastID;
}

export async function findUserByEmail(email) {
  const database = await initDatabase();
  return await database.get('SELECT * FROM users WHERE email = ?', [email]);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function savePayment(paymentData) {
  const database = await initDatabase();
  const { userId, email, plan, amount, transactionId, screenshot, books, phone } = paymentData;

  const result = await database.run(
    `INSERT INTO payments (user_id, email, plan, amount, transaction_id, screenshot, books, phone) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId || null, email, plan, amount, transactionId, screenshot, JSON.stringify(books), phone]
  );

  return result.lastID;
}

export async function findPaymentByTransactionId(transactionId) {
  const database = await initDatabase();
  return await database.get('SELECT * FROM payments WHERE transaction_id = ?', [transactionId]);
}

export async function createOrUpdateSubscription(userId, email, plan, books, daysValid) {
  const database = await initDatabase();
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();

  const existing = await database.get('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);

  if (existing) {
    await database.run(
      `UPDATE subscriptions SET plan = ?, books = ?, expires_at = ? WHERE user_id = ?`,
      [plan, JSON.stringify(books), expiresAt, userId]
    );
  } else {
    await database.run(
      `INSERT INTO subscriptions (user_id, email, plan, books, expires_at) VALUES (?, ?, ?, ?, ?)`,
      [userId, email, plan, JSON.stringify(books), expiresAt]
    );
  }
}

export async function getSubscription(userId) {
  const database = await initDatabase();
  const sub = await database.get('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);

  if (sub) {
    // Check if expired
    if (new Date(sub.expires_at) < new Date()) {
      // Delete expired subscription
      await database.run('DELETE FROM subscriptions WHERE id = ?', [sub.id]);
      return null;
    }
    return {
      plan: sub.plan,
      books: JSON.parse(sub.books || '[]'),
      expiresAt: sub.expires_at
    };
  }
  return null;
}