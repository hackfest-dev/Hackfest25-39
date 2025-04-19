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


// ============ START SERVER ============
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${port}`);
});
