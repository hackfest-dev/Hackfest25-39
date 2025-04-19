const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const session = require('express-session');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = 5000;

// ============ DATABASE CONNECTION ============
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_db_password',
  database: 'admin_db',
  waitForConnections: true,
  connectionLimit: 10
});

// ============ SESSION CONFIG ============
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({}, pool);

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ============ MULTER ============
const upload = multer({ storage: multer.memoryStorage() });

// ============ EMAIL TRANSPORTER ============
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `Sector System <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    html: `<p>Your OTP is: <b>${otp}</b></p>`
  });
};

// ============ ADMIN LOGIN ============
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.admin = { id: users[0].id, username: users[0].username };
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============ ADMINISTRATOR SIGNUP ============
app.post('/api/administrator/signup', upload.single('license'), async (req, res) => {
  try {
    const { administrator_id, mine_name, mine_location, mine_type, password } = req.body;
    if (!req.file) return res.status(400).json({ error: 'License PDF required' });

    const [exists] = await pool.query(
      `SELECT administrator_id FROM pending_administrators WHERE administrator_id = ?
       UNION SELECT administrator_id FROM approved_administrators WHERE administrator_id = ?`,
      [administrator_id, administrator_id]
    );
    if (exists.length) return res.status(400).json({ error: 'ID already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO pending_administrators 
       (administrator_id, mine_name, mine_location, mine_type, password_hash, license_pdf) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [administrator_id, mine_name, mine_location, mine_type, hashedPassword, req.file.buffer]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ============ ADMINISTRATOR LOGIN ============
app.post('/api/administrator/login', async (req, res) => {
  try {
    const { administrator_id, password } = req.body;
    const [admin] = await pool.query(
      'SELECT * FROM approved_administrators WHERE administrator_id = ?',
      [administrator_id]
    );

    if (!admin.length || !(await bcrypt.compare(password, admin[0].password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.administrator = {
      id: admin[0].administrator_id,
      mine_name: admin[0].mine_name
    };

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============ SECTOR LOGIN ============
app.post('/api/sector-login', async (req, res) => {
  try {
    const { sector_id, sector_email, password } = req.body;
    const [sector] = await pool.query(
      'SELECT * FROM sectors WHERE sector_id = ? AND sector_email = ?',
      [sector_id, sector_email]
    );

    if (!sector.length || !sector[0].sector_password) {
      return res.status(401).json({ error: 'Invalid credentials or password not set' });
    }

    const isValid = await bcrypt.compare(password, sector[0].sector_password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.sector = { id: sector[0].sector_id, email: sector[0].sector_email };
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============ SECTOR PASSWORD SETUP ============
app.post('/api/sector-request-password', async (req, res) => {
  try {
    const { sector_id, sector_email } = req.body;
    const [sector] = await pool.query(
      'SELECT * FROM sectors WHERE sector_id = ? AND sector_email = ?',
      [sector_id, sector_email]
    );
    if (!sector.length) return res.status(404).json({ error: 'Sector not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 600000);

    await pool.query(
      'REPLACE INTO sector_password_reset (email, token, expires_at) VALUES (?, ?, ?)',
      [sector_email, otp, expiresAt]
    );

    await sendOTPEmail(sector_email, otp);
    res.json({ message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ error: 'OTP failed' });
  }
});

app.post('/api/sector-reset-password', async (req, res) => {
  try {
    const { sector_email, otp, newPassword } = req.body;
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password too short' });

    const [reset] = await pool.query(
      'SELECT * FROM sector_password_reset WHERE email = ? AND token = ? AND expires_at > NOW()',
      [sector_email, otp]
    );
    if (!reset.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE sectors SET sector_password = ? WHERE sector_email = ?',
      [hashedPassword, sector_email]
    );
    await pool.query('DELETE FROM sector_password_reset WHERE email = ?', [sector_email]);

    res.json({ message: 'Password set successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
  }
});




// ==================== Manage Sectors Endpoints ====================
// Get all sectors under administrator
app.get('/api/manage-sectors', administratorAuth, async (req, res) => {
  try {
    const [sectors] = await pool.query(
      'SELECT * FROM sectors WHERE administrator_id = ?',
      [req.session.administrator.id]
    );
    res.json(sectors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sectors' });
  }
});

// Create new sector
app.post('/api/manage-sectors', administratorAuth, async (req, res) => {
  try {
    const { sector_id, sector_category, sector_email } = req.body;
    
    if (!sector_id || !sector_category || !sector_email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [[existingId], [existingEmail]] = await Promise.all([
      pool.query('SELECT sector_id FROM sectors WHERE sector_id = ?', [sector_id]),
      pool.query('SELECT sector_id FROM sectors WHERE sector_email = ?', [sector_email])
    ]);

    if (existingId.length) return res.status(400).json({ error: 'Sector ID already exists' });
    if (existingEmail.length) return res.status(400).json({ error: 'Email already registered' });

    await pool.query(
      `INSERT INTO sectors 
       (sector_id, sector_name, sector_email, administrator_id) 
       VALUES (?, ?, ?, ?)`,
      [sector_id, sector_category, sector_email, req.session.administrator.id]
    );
    
    res.status(201).json({ 
      sector_id,
      sector_name: sector_category,
      sector_email,
      administrator_id: req.session.administrator.id
    });
  } catch (error) {
    console.error('Sector creation error:', error);
    res.status(500).json({ error: 'Failed to create sector' });
  }
});


// ============ START SERVER ============
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${port}`);
});
