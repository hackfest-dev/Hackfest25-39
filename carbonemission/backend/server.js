const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = 5000;

// Database configuration
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'bumblebeenevergivesup',
  database: 'admin_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Session store setup
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({}, pool);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174/',
    'http://localhost:3000',
    'http://192.168.83.122:5173',
    'http://172.18.6.25:5173',
    'http://192.168.137.1:5173',
    'http://192.168.137.113:5173',
    'http://172.18.5.88:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'super-secret-key-123',
  resave: false,
  saveUninitialized: false,
  name: 'sector.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
}));





// File upload configuration
const upload = multer({ storage: multer.memoryStorage() });

// Add this after the existing multer configuration for licenses
const emissionsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'emissions');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `emission-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const emissionsUpload = multer({ 
  storage: emissionsStorage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Authentication middlewares
const adminAuth = (req, res, next) => {
  req.session.admin ? next() : res.status(401).json({ error: 'Admin authorization required' });
};

const administratorAuth = (req, res, next) => {
  req.session.administrator ? next() : res.status(401).json({ error: 'Administrator authorization required' });
};

// Email sending function
const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `Mine Sector System <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Setup OTP',
      text: `Your OTP code is: ${otp} (valid for 10 minutes)`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1a237e;">Password Setup</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #1a237e;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send OTP email');
  }
};

// ==================== Session Endpoints ====================
app.get('/api/admin/check-session', (req, res) => {
  res.json({ 
    isAdmin: !!req.session.admin,
    username: req.session.admin?.username 
  });
});

app.get('/api/administrator/check-session', (req, res) => {
  res.json({
    authenticated: !!req.session.administrator,
    administrator_id: req.session.administrator?.id,
    mine_name: req.session.administrator?.mine_name
  });
});

app.get('/api/sector/check-session', async (req, res) => {
  if (!req.session.sector) return res.json({ authenticated: false });

  try {
    const [sector] = await pool.query(
      'SELECT sector_id, sector_name FROM sectors WHERE sector_id = ?',
      [req.session.sector.id]
    );
    
    if (!sector.length) return res.json({ authenticated: false });

    res.json({
      authenticated: true,
      sector_id: sector[0].sector_id,
      sector_name: sector[0].sector_name // Add this line
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// ==================== Admin Routes ====================
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.admin = { 
      id: users[0].id, 
      username: users[0].username 
    };

    res.json({ success: true });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Administrator Routes ====================
app.post('/api/administrator/login', async (req, res) => {
  try {
    const { administrator_id, password } = req.body;
    const [admin] = await pool.query(
      'SELECT * FROM approved_administrators WHERE administrator_id = ?',
      [administrator_id]
    );

    if (!admin.length) return res.status(401).json({ error: 'Invalid credentials' });
    if (!(await bcrypt.compare(password, admin[0].password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.administrator = {
      id: admin[0].administrator_id,
      mine_name: admin[0].mine_name
    };

    res.json({ success: true });
  } catch (error) {
    console.error('Administrator login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== Unified Logout ====================
const handleLogout = (req, res, sessionKey) => {
  req.session.destroy(err => {
    res.clearCookie('connect.sid');
    res.json({ success: !err, [sessionKey]: false });
  });
};

app.post('/api/admin/logout', (req, res) => handleLogout(req, res, 'isAdmin'));
app.post('/api/administrator/logout', (req, res) => handleLogout(req, res, 'authenticated'));
app.post('/api/sector/logout', (req, res) => handleLogout(req, res, 'authenticated'));

// ==================== Administrator Signup ====================
app.post('/api/administrator/signup', upload.single('license'), async (req, res) => {
  try {
    const { administrator_id, mine_name, mine_location, mine_type, password } = req.body;
    
    if (!administrator_id || !mine_name || !mine_location || !mine_type || !password || !req.file) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [existing] = await pool.query(
      `SELECT administrator_id FROM pending_administrators WHERE administrator_id = ?
       UNION SELECT administrator_id FROM approved_administrators WHERE administrator_id = ?`,
      [administrator_id, administrator_id]
    );
    
    if (existing.length) return res.status(400).json({ error: 'Administrator ID already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO pending_administrators 
       (administrator_id, mine_name, mine_location, mine_type, password_hash, license_pdf) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [administrator_id, mine_name, mine_location, mine_type, hashedPassword, req.file.buffer]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// ==================== Admin Approval System ====================
app.get('/api/admin/pending-requests', adminAuth, async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT request_id, administrator_id, mine_name, mine_location, mine_type, created_at 
       FROM pending_administrators 
       WHERE request_status = 'pending'`
    );
    res.json(requests);
  } catch (error) {
    console.error('Pending requests error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/approve-administrator/:requestId', adminAuth, async (req, res) => {
  try {
    const { decision } = req.body;
    const [request] = await pool.query(
      'SELECT * FROM pending_administrators WHERE request_id = ?',
      [req.params.requestId]
    );

    if (!request.length) return res.status(404).json({ error: 'Request not found' });

    if (decision === 'approve') {
      await pool.query(
        `INSERT INTO approved_administrators 
         (administrator_id, mine_name, mine_location, mine_type, password_hash, license_path, approved_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          request[0].administrator_id,
          request[0].mine_name,
          request[0].mine_location,
          request[0].mine_type,
          request[0].password_hash,
          `licenses/${request[0].administrator_id}.pdf`,
          req.session.admin.id
        ]
      );

      fs.writeFileSync(
        path.join(__dirname, 'licenses', `${request[0].administrator_id}.pdf`), 
        request[0].license_pdf
      );
    }

    await pool.query('DELETE FROM pending_administrators WHERE request_id = ?', [req.params.requestId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Approval process failed: ' + error.message });
  }
});



// ==================== License Management ====================
const licensesDir = path.join(__dirname, 'licenses');
if (!fs.existsSync(licensesDir)) fs.mkdirSync(licensesDir, { recursive: true });

app.get('/api/license/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [pending] = await pool.query(
      'SELECT license_pdf FROM pending_administrators WHERE administrator_id = ?',
      [id]
    );

    if (pending.length) {
      res.setHeader('Content-Type', 'application/pdf');
      return res.send(pending[0].license_pdf);
    }

    const filePath = path.join(licensesDir, `${id}.pdf`);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      return res.sendFile(filePath);
    }

    res.status(404).json({ error: 'License not found' });
  } catch (error) {
    console.error('License fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve license' });
  }
});

// Add this after the licensesDir creation for sector pdf
const emissionsDir = path.join(__dirname, 'uploads', 'emissions');
if (!fs.existsSync(emissionsDir)) fs.mkdirSync(emissionsDir, { recursive: true });

// ==================== Sector Management ====================
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

app.post('/api/manage-sectors', administratorAuth, async (req, res) => {
  try {
    const { sector_id, sector_category, sector_email } = req.body;
    
    // Validate input
    if (!sector_id || !sector_category || !sector_email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check for existing sector ID or email
    const [[existingId], [existingEmail]] = await Promise.all([
      pool.query('SELECT sector_id FROM sectors WHERE sector_id = ?', [sector_id]),
      pool.query('SELECT sector_id FROM sectors WHERE sector_email = ?', [sector_email])
    ]);

    if (existingId.length) return res.status(400).json({ error: 'Sector ID already exists' });
    if (existingEmail.length) return res.status(400).json({ error: 'Email already registered' });

    // Create new sector
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

// ==================== Sector Authentication ====================
app.post('/api/sector-login', async (req, res) => {
  try {
    const { sector_id, sector_email, password } = req.body;
    
    // Find sector
    const [sector] = await pool.query(
      'SELECT * FROM sectors WHERE sector_id = ? AND sector_email = ?',
      [sector_id, sector_email]
    );

    if (!sector.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if password is set
    if (!sector[0].sector_password) {
      return res.status(401).json({ 
        error: 'Password not set', 
        needsPasswordSetup: true 
      });
    }

    // Validate password
    const isValid = await bcrypt.compare(password, sector[0].sector_password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    req.session.sector = {
      id: sector[0].sector_id,
      email: sector[0].sector_email
    };

    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Sector login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/sector-request-password', async (req, res) => {
  try {
    const { sector_id, sector_email } = req.body;
    
    // Verify sector exists
    const [sector] = await pool.query(
      'SELECT * FROM sectors WHERE sector_id = ? AND sector_email = ?',
      [sector_id, sector_email]
    );
    
    if (!sector.length) {
      return res.status(404).json({ error: 'Sector not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 600000); // 10 minutes

    // Store OTP
    await pool.query(
      'REPLACE INTO sector_password_reset (email, token, expires_at) VALUES (?, ?, ?)',
      [sector_email, otp, expiresAt]
    );

    // Send email
    await sendOTPEmail(sector_email, otp);
    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

app.post('/api/sector-reset-password', async (req, res) => {
  try {
    const { sector_email, otp, newPassword } = req.body;
    
    // Validate input
    if (!sector_email || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Verify OTP
    const [reset] = await pool.query(
      'SELECT * FROM sector_password_reset WHERE email = ? AND token = ? AND expires_at > NOW()',
      [sector_email, otp]
    );

    if (!reset.length) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Verify sector exists
    const [sector] = await pool.query(
      'SELECT * FROM sectors WHERE sector_email = ?',
      [sector_email]
    );

    if (!sector.length) {
      return res.status(404).json({ error: 'Sector not found' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE sectors SET sector_password = ? WHERE sector_email = ?',
      [hashedPassword, sector_email]
    );

    // Cleanup OTP
    await pool.query(
      'DELETE FROM sector_password_reset WHERE email = ?',
      [sector_email]
    );

    res.json({ message: 'Password created successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ==================== Sector Deletion ====================
// app.delete('/api/manage-sectors/:sector_id', administratorAuth, async (req, res) => {
//   try {
//     await pool.query(
//       'DELETE FROM sectors WHERE sector_id = ? AND administrator_id = ?',
//       [req.params.sector_id, req.session.administrator.id]
//     );
//     res.json({ message: 'Sector deleted successfully' });
//   } catch (error) {
//     console.error('Delete sector error:', error);
//     res.status(500).json({ error: 'Failed to delete sector' });
//   }
// });

// Start server


// Add this new endpoint for storing emission data

// ==================== Emission Data Storage ==================== 
app.post('/api/emissions/store', emissionsUpload.single('pdf'), async (req, res) => {
  try {
    const { sector_id, sector_type, month, year, inputs, emissions } = req.body;
    
    const [existing] = await pool.query(
      `SELECT id FROM sector_emissions 
       WHERE sector_id = ? AND month = ? AND year = ?`,
      [sector_id, parseInt(month), parseInt(year)]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'A submission already exists for this month and year' 
      });
    }
    // Validation
    if (!sector_id || !sector_type || !month || !year || !inputs || !emissions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate month (1-12)
    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid month value' });
    }

    // Handle PDF
    let pdfPath = null;
    if (req.file) {
      pdfPath = req.file.filename;
    }

    // Insert data
    await pool.query(
      `INSERT INTO sector_emissions 
      (sector_id, sector_type, month, year, input_data, emission_data, pdf_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sector_id,
        sector_type,
        parseInt(month),
        parseInt(year),
        JSON.stringify(inputs),
        JSON.stringify(emissions),
        pdfPath
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Storage error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Data storage failed' });
  }
});

// ==================== Get Sector Emissions ====================
// ==================== Get Sector Emissions ====================
app.get('/api/emissions/:sector_id', async (req, res) => {
  try {
    // Validate sector ID format
    if (!/^[A-Z]{2}-[A-Z]{3}-\d{3}$/.test(req.params.sector_id)) {
      return res.status(400).json({ error: 'Invalid sector ID format' });
    }

    const [entries] = await pool.query(
      `SELECT id, month, year, sector_type, input_data, emission_data, pdf_path, verified
       FROM sector_emissions 
       WHERE sector_id = ?
       ORDER BY year DESC, month DESC`,
      [req.params.sector_id]
    );

    // Parse JSON data and format response
    const formatted = entries.map(entry => ({
      ...entry,
      month: parseInt(entry.month),
      year: parseInt(entry.year),
      input_data: JSON.parse(entry.input_data),
      emission_data: JSON.parse(entry.emission_data),
      sector_type: entry.sector_type.trim(),
      verified: Boolean(entry.verified) // Convert tinyint to boolean
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch emissions data' });
  }
});



// Serve PDF files
// ==================== PDF File Serving ====================
app.get('/api/pdf/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', 'emissions', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (error) {
    console.error('PDF serve error:', error);
    res.status(500).send('Error retrieving PDF');
  }
});

// ==================== Administrator Emissions Data ====================
// Update the administrator emissions endpoint
app.get('/api/administrator/emissions', administratorAuth, async (req, res) => {
  try {
    const [sectors] = await pool.query(
      'SELECT sector_id, sector_name FROM sectors WHERE administrator_id = ?',
      [req.session.administrator.id]
    );

    const sectorsWithEmissions = await Promise.all(
      sectors.map(async (sector) => {
        const [emissions] = await pool.query(
          'SELECT id, month, year, emission_data, verified FROM sector_emissions WHERE sector_id = ?',
          [sector.sector_id]
        );
        return {
          ...sector,
          emissions: emissions.map(e => ({
            id: e.id,
            month: e.month,
            year: e.year,
            total: JSON.parse(e.emission_data).total,
            verified: e.verified // Include verification status
          }))
        };
      })
    );

    res.json(sectorsWithEmissions);
  } catch (error) {
    console.error('Administrator emissions error:', error);
    res.status(500).json({ error: 'Failed to fetch emissions data' });
  }
});

// ==================== Get Sector Details ====================
app.get('/api/sector/:sectorId', administratorAuth, async (req, res) => {
  try {
    const [sector] = await pool.query(
      `SELECT s.sector_id, s.sector_name, s.sector_email, a.mine_name
       FROM sectors s
       JOIN approved_administrators a ON s.administrator_id = a.administrator_id
       WHERE s.sector_id = ?`,
      [req.params.sectorId]
    );

    if (!sector.length) return res.status(404).json({ error: 'Sector not found' });
    
    res.json({
      sector_id: sector[0].sector_id,
      sector_name: sector[0].sector_name,
      mine_name: sector[0].mine_name,
      sector_email: sector[0].sector_email
    });
  } catch (error) {
    console.error('Sector details error:', error);
    res.status(500).json({ error: 'Failed to fetch sector details' });
  }
});



// ==================== Delete Emission Entry ====================
// ==================== Delete Emission Entry ====================
app.delete('/api/emissions/delete/:entryId', administratorAuth, async (req, res) => {
  try {
    const [entry] = await pool.query(
      `SELECT se.* 
       FROM sector_emissions se
       JOIN sectors s ON se.sector_id = s.sector_id
       WHERE se.id = ? AND s.administrator_id = ?`,
      [req.params.entryId, req.session.administrator.id]
    );

    if (!entry.length) return res.status(404).json({ error: 'Entry not found or unauthorized' });

    // Delete associated PDF if exists
    if (entry[0].pdf_path) {
      const pdfPath = path.join(__dirname, 'uploads', 'emissions', entry[0].pdf_path);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }

    await pool.query('DELETE FROM sector_emissions WHERE id = ?', [req.params.entryId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete emission error:', error);
    res.status(500).json({ error: 'Failed to delete emission entry' });
  }
});



// ==================== Verify Emission Entry ====================
app.put('/api/emissions/verify/:entryId', administratorAuth, async (req, res) => {
  try {
    const [entry] = await pool.query(
      `SELECT se.* 
       FROM sector_emissions se
       JOIN sectors s ON se.sector_id = s.sector_id
       WHERE se.id = ? AND s.administrator_id = ?`,
      [req.params.entryId, req.session.administrator.id]
    );

    if (!entry.length) return res.status(404).json({ error: 'Entry not found or unauthorized' });

    await pool.query(
      'UPDATE sector_emissions SET verified = TRUE WHERE id = ?',
      [req.params.entryId]
    );

    res.json({ success: true, message: 'Emission entry verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});











// Monthly reports storage
const monthlyReportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'monthly-reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `monthly-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const monthlyUpload = multer({ storage: monthlyReportStorage });

// Submit monthly report
app.post('/api/emissions/submit-monthly', administratorAuth, monthlyUpload.single('report'), async (req, res) => {
  try {
    const { month, year } = req.body;
    
    // Modified verification check
    const [unverified] = await pool.query(
      `SELECT se.id 
       FROM sector_emissions se
       JOIN sectors s ON se.sector_id = s.sector_id
       WHERE s.administrator_id = ? 
         AND se.month = ? 
         AND se.year = ? 
         AND se.verified = 0`,
      [req.session.administrator.id, parseInt(month), parseInt(year)]
    );

    if (unverified.length > 0) {
      return res.status(400).json({ error: 'All entries must be verified first' });
    }

    // Store report
    await pool.query(
      `INSERT INTO monthly_reports 
       (administrator_id, month, year, report_path)
       VALUES (?, ?, ?, ?)`,
      [
        req.session.administrator.id, 
        parseInt(month), 
        parseInt(year), 
        req.file.filename
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Monthly submission error:', error);
    res.status(500).json({ error: 'Monthly report submission failed' });
  }
});
// Admin aggregate endpoint
app.get('/api/admin/aggregate-emissions', adminAuth, async (req, res) => {
  try {
    const [data] = await pool.query(`
      SELECT 
        m.year,
        m.month,
        SUM(e.emission_data->>"$.total") AS total_emissions,
        GROUP_CONCAT(DISTINCT a.mine_name) AS mines
      FROM monthly_reports m
      JOIN approved_administrators a ON m.administrator_id = a.administrator_id
      JOIN sector_emissions e ON m.administrator_id = e.administrator_id 
        AND m.month = e.month 
        AND m.year = e.year
      GROUP BY m.year, m.month
      ORDER BY m.year DESC, m.month DESC
    `);
    
    res.json(data);
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({ error: 'Failed to aggregate data' });
  }
});


// ==================== Get Monthly Reports ====================
// ==================== Get Monthly Reports ====================
app.get('/api/monthly-reports/:administrator_id', administratorAuth, async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT id, month, year, report_path, submitted_at 
       FROM monthly_reports 
       WHERE administrator_id = ?
       ORDER BY year DESC, month DESC`,
      [req.params.administrator_id]
    );

    res.json(reports.map(report => ({
      ...report,
      month: parseInt(report.month),
      year: parseInt(report.year),
      // Update this line to use the new endpoint
      report_url: `/api/monthly-pdf/${report.report_path}`
    })));
  } catch (error) {
    console.error('Monthly reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// ==================== Monthly Report PDF Serving ====================
app.get('/api/monthly-pdf/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', 'monthly-reports', req.params.filename);
    console.log('Attempting to serve PDF from:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('File not found');
      return res.status(404).json({ 
        error: 'Report not found',
        suggestion: 'Verify the report exists in the monthly reports archive'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Monthly PDF serve error:', error);
    res.status(500).json({ error: 'Error retrieving report' });
  }
});




// ==================== Admin Routes ====================
app.get('/api/admin/administrators', adminAuth, async (req, res) => {
  try {
    const [administrators] = await pool.query(
      'SELECT * FROM approved_administrators'
    );
    res.json(administrators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch administrators' });
  }
});

// Update the /api/admin/aggregated-emissions endpoint
app.get('/api/admin/aggregated-emissions', adminAuth, async (req, res) => {
  try {
    const [data] = await pool.query(`
      SELECT 
        a.administrator_id,
        a.mine_name,
        a.mine_location,
        a.mine_type,
        COALESCE(SUM(m.total_emissions), 0) AS total_emissions,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', m.id,
              'month', m.month,
              'year', m.year,
              'total_emissions', m.total_emissions,
              'verified', m.verified,
              'report_path', m.report_path
            )
          ),
          JSON_ARRAY()
        ) AS monthly_reports
      FROM approved_administrators a
      LEFT JOIN (
        SELECT 
          m.administrator_id,
          m.id,
          m.month,
          m.year,
          m.verified,
          SUM(JSON_EXTRACT(e.emission_data, '$.total')) AS total_emissions,
          m.report_path
        FROM monthly_reports m
        LEFT JOIN sectors s ON m.administrator_id = s.administrator_id
        LEFT JOIN sector_emissions e ON s.sector_id = e.sector_id
          AND m.month = e.month
          AND m.year = e.year
        GROUP BY m.id, m.month, m.year
      ) m ON a.administrator_id = m.administrator_id
      GROUP BY a.administrator_id
    `);

    // Handle both string and parsed JSON cases
    const processedData = data.map(row => ({
      ...row,
      monthly_reports: typeof row.monthly_reports === 'string' 
        ? JSON.parse(row.monthly_reports) 
        : row.monthly_reports
    }));

    res.json(processedData);
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({ error: 'Failed to aggregate data' });
  }
});

// Update the verification endpoint SQL query
app.put('/api/admin/verify-report/:reportId', adminAuth, async (req, res) => {
  try {
    // First, update the monthly report as verified
    await pool.query('UPDATE monthly_reports SET verified = 1 WHERE id = ?', [req.params.reportId]);
    
    // Optionally, verify ALL the matching sector emissions too
    await pool.query(`
      UPDATE sector_emissions se
      JOIN sectors s ON se.sector_id = s.sector_id
      SET se.verified = 1
      WHERE s.administrator_id = (
        SELECT administrator_id FROM monthly_reports WHERE id = ?
      )
      AND se.month = (SELECT month FROM monthly_reports WHERE id = ?)
      AND se.year = (SELECT year FROM monthly_reports WHERE id = ?)
    `, [req.params.reportId, req.params.reportId, req.params.reportId]);

    res.json({ success: true, message: 'Report verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});


// ==================== Admin Monthly Reports ====================
// Update the /api/admin/monthly-reports endpoint in server.js
// Update the monthly reports endpoint SQL
// In server.js, update the monthly reports endpoint
// ==================== Admin Dashboard Reports Endpoint ====================
// ==================== Admin Dashboard Reports Endpoint ====================
app.get('/api/admin/dashboard-reports', adminAuth, async (req, res) => {
  try {
    const [reports] = await pool.query(`
      SELECT 
        mr.id,
        mr.administrator_id,
        a.mine_name,
        mr.month,
        mr.year,
        mr.report_path,
        mr.verified,
        COALESCE((
          SELECT SUM(JSON_EXTRACT(CAST(JSON_UNQUOTE(e.emission_data) AS JSON), '$.total') + 0)
          FROM sector_emissions e
          JOIN sectors s ON e.sector_id = s.sector_id
          WHERE s.administrator_id = mr.administrator_id
            AND e.month = mr.month
            AND e.year = mr.year
            AND e.verified = 1
        ), 0) AS total_emissions
      FROM monthly_reports mr
      JOIN approved_administrators a ON mr.administrator_id = a.administrator_id
      ORDER BY mr.year DESC, mr.month DESC
    `);
    res.json(reports);
  } catch (error) {
    console.error('Dashboard reports error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard reports' });
  }
});







// ==================== Offset Calculation Endpoints ====================
// 1. First define the storage and upload middleware
const offsetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'offsets');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `offset-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const offsetUpload = multer({ 
  storage: offsetStorage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// ==================== Offset Calculation Endpoints ====================
// Add to server.js
// Add to existing server.js after other endpoints
app.post('/api/offset/store', administratorAuth, offsetUpload.single('pdf'), async (req, res) => {
  try {
    const { month, year, ...offsetData } = req.body;

    // Validate required fields
    const requiredFields = [
      'tailingsVolume', 'sequestrationRate', 'methaneCaptured',
      'treesPlanted', 'treeType', 'renewableEnergy', 
      'ccsCaptured', 'fuelSaved'
    ];
    
    for (const field of requiredFields) {
      if (!(field in offsetData)) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    // Validate numerical fields
    const numericalFields = [
      'tailingsVolume', 'sequestrationRate', 'methaneCaptured',
      'treesPlanted', 'renewableEnergy', 'ccsCaptured', 'fuelSaved'
    ];

    for (const field of numericalFields) {
      if (isNaN(parseFloat(offsetData[field]))) {
        return res.status(400).json({ error: `Invalid number format for ${field}` });
      }
    }

    // Validate month/year
    if (isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: 'Invalid month/year format' });
    }

    // Check existing entry
    const [existing] = await pool.query(
      'SELECT id FROM administrator_offsets WHERE administrator_id = ? AND month = ? AND year = ?',
      [req.session.administrator.id, month, year]
    );
    
    if (existing.length) {
      return res.status(409).json({ error: 'Offset data already exists for this month' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'PDF report is required' });
    }

    // Convert all values to numbers
    const parsedData = {
      tailingsVolume: parseFloat(offsetData.tailingsVolume),
      sequestrationRate: parseFloat(offsetData.sequestrationRate),
      methaneCaptured: parseFloat(offsetData.methaneCaptured),
      treesPlanted: parseInt(offsetData.treesPlanted),
      treeType: offsetData.treeType,
      renewableEnergy: parseFloat(offsetData.renewableEnergy),
      ccsCaptured: parseFloat(offsetData.ccsCaptured),
      fuelSaved: parseFloat(offsetData.fuelSaved)
    };

    // Validate tree type
    const validTreeTypes = ['Neem', 'Teak', 'Bamboo', 'Mixed Native'];
    if (!validTreeTypes.includes(parsedData.treeType)) {
      return res.status(400).json({ error: 'Invalid tree species selection' });
    }

    // Calculate total offset
    const totalOffset = calculateTotalOffset(parsedData);
    const carbonCredits = totalOffset;

    // Insert into database
    const [result] = await pool.query(
      `INSERT INTO administrator_offsets (
        administrator_id, month, year, 
        tailings_volume, sequestration_rate, methane_captured,
        trees_planted, tree_type, renewable_energy,
        ccs_captured, fuel_saved, total_offset, carbon_credits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.administrator.id,
        parseInt(month),
        parseInt(year),
        parsedData.tailingsVolume,
        parsedData.sequestrationRate,
        parsedData.methaneCaptured,
        parsedData.treesPlanted,
        parsedData.treeType,
        parsedData.renewableEnergy,
        parsedData.ccsCaptured,
        parsedData.fuelSaved,
        totalOffset,
        carbonCredits
      ]
    );

    // Store PDF reference
    await pool.query(
      'INSERT INTO offset_pdfs (offset_id, file_path) VALUES (?, ?)',
      [result.insertId, req.file.filename]
    );

    res.json({ success: true, totalOffset, carbonCredits });
  } catch (error) {
    console.error('Offset storage error:', error);
    res.status(500).json({ error: 'Failed to store offset data' });
  }
});

function calculateTotalOffset(data) {
  const INDIA_CONSTANTS = {
    gridEF: 0.00082,
    methaneDensity: 0.716,
    methaneGWP: 28,
    dieselEF: 2.68,
    treeSpecies: {
      'Neem': 0.035 / 12,
      'Teak': 0.040 / 12,
      'Bamboo': 0.025 / 12,
      'Mixed Native': 0.030 / 12
    }
  };

  const components = [
    data.tailingsVolume * data.sequestrationRate,
    (data.methaneCaptured * INDIA_CONSTANTS.methaneDensity * INDIA_CONSTANTS.methaneGWP) / 1000,
    data.treesPlanted * INDIA_CONSTANTS.treeSpecies[data.treeType],
    data.renewableEnergy * INDIA_CONSTANTS.gridEF,
    data.ccsCaptured,
    data.fuelSaved * INDIA_CONSTANTS.dieselEF / 1000
  ];

  const total = components.reduce((sum, val) => sum + val, 0);
  return Number(total.toFixed(2));
}






//offsettttttt
// Get all administrator offsets
// Update the GET endpoint in server.js
app.get('/api/admin/administrator-offsets', adminAuth, async (req, res) => {
  try {
    const [offsets] = await pool.query(`
      SELECT 
        ao.id,
        ao.administrator_id,
        ao.month,
        ao.year,
        CAST(ao.tailings_volume AS FLOAT) as tailings_volume,
        CAST(ao.sequestration_rate AS FLOAT) as sequestration_rate,
        CAST(ao.methane_captured AS FLOAT) as methane_captured,
        ao.trees_planted,
        ao.tree_type,
        CAST(ao.renewable_energy AS FLOAT) as renewable_energy,
        CAST(ao.ccs_captured AS FLOAT) as ccs_captured,
        CAST(ao.fuel_saved AS FLOAT) as fuel_saved,
        CAST(ao.total_offset AS FLOAT) as total_offset,
        ao.verified,
        op.file_path AS pdf_path 
      FROM administrator_offsets ao
      LEFT JOIN offset_pdfs op ON ao.id = op.offset_id
    `);
    res.json(offsets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offset data' });
  }
});




// Add this in server.js after database configuration
const updateCreditTotal = async (administratorId, connection) => {
  const [total] = await connection.query(
    `SELECT SUM(credits_issued) AS total 
     FROM carbon_credits 
     WHERE administrator_id = ?`,
    [administratorId]
  );
  
  await connection.query(
    `INSERT INTO administrator_credit_totals (administrator_id, total_credits)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE 
     total_credits = VALUES(total_credits)`,
    [administratorId, total[0].total || 0]
  );
};

// Verify offset
// Modified verification endpoint
// Modified verification endpoint
app.put('/api/admin/verify-offset/:id', adminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verify the offset
    const [result] = await connection.query(
      `UPDATE administrator_offsets 
       SET verified = 1, verified_by = ?, verified_at = NOW()
       WHERE id = ?`,
      [req.session.admin.id, req.params.id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Offset not found');
    }

    // 2. Get the offset details
    const [offset] = await connection.query(
      `SELECT administrator_id, month, year, total_offset 
       FROM administrator_offsets 
       WHERE id = ?`,
      [req.params.id]
    );

    // 3. Create carbon credits entry
    const [credit] = await connection.query(
      `INSERT INTO carbon_credits 
       (administrator_id, offset_id, month, year, credits_issued)
       VALUES (?, ?, ?, ?, ?)`,
      [
        offset[0].administrator_id,
        req.params.id,
        offset[0].month,
        offset[0].year,
        offset[0].total_offset
      ]
    );
    await updateCreditTotal(offset[0].administrator_id, connection);
    await connection.commit();
    
    res.json({ 
      success: true,
      creditsIssued: offset[0].total_offset,
      verifiedBy: req.session.admin.username,
      verifiedAt: new Date()
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Verification failed: ' + error.message });
  } finally {
    connection.release();
  }
});

// Delete offset
app.delete('/api/admin/offset/:id', adminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get PDF file path
    const [pdfRecord] = await connection.query(
      'SELECT file_path FROM offset_pdfs WHERE offset_id = ?',
      [req.params.id]
    );

    // 2. Delete from offset_pdfs
    await connection.query(
      'DELETE FROM offset_pdfs WHERE offset_id = ?',
      [req.params.id]
    );

    // 3. Delete from administrator_offsets
    await connection.query(
      'DELETE FROM administrator_offsets WHERE id = ?',
      [req.params.id]
    );

    // 4. Delete PDF file
    if (pdfRecord.length && pdfRecord[0].file_path) {
      const filePath = path.join(__dirname, 'uploads', 'offsets', pdfRecord[0].file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Deletion error:', error);
    res.status(500).json({ error: 'Deletion failed: ' + error.message });
  } finally {
    connection.release();
  }
}); 

// Serve offset PDFs
app.get('/api/offset-pdf/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', 'offsets', req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving PDF' });
  }
});









//administrtor dashboardddddd
// Get offsets for logged-in administrator
app.get('/api/administrator/offsets', administratorAuth, async (req, res) => {
  try {
    const [offsets] = await pool.query(
      `SELECT 
         ao.*,
         op.file_path AS pdf_path,
         cc.credits_issued
       FROM administrator_offsets ao
       LEFT JOIN offset_pdfs op ON ao.id = op.offset_id
       LEFT JOIN carbon_credits cc ON ao.id = cc.offset_id
       WHERE ao.administrator_id = ?
       ORDER BY ao.year DESC, ao.month DESC`,
      [req.session.administrator.id]
    );
    res.json(offsets);
  } catch (error) {
    console.error(error); // helpful for debugging
    res.status(500).json({ error: 'Failed to fetch offset data' });
  }
});




//carbon creditsssss
//endpoint to get carbon credits for administrators:
// Update carbon credits endpoint
app.get('/api/administrator/carbon-credits', administratorAuth, async (req, res) => {
  try {
    const [credits] = await pool.query(
      `SELECT cc.*, ao.month, ao.year 
       FROM carbon_credits cc
       JOIN administrator_offsets ao ON cc.offset_id = ao.id
       WHERE cc.administrator_id = ?
       ORDER BY ao.year DESC, ao.month DESC`,
      [req.session.administrator.id]
    );
    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch carbon credits' });
  }
});






// Get administrator's carbon credits
app.get('/api/administrator/carbon-credits', administratorAuth, async (req, res) => {
  try {
    const [credits] = await pool.query(
      `SELECT * FROM carbon_credits 
       WHERE administrator_id = ?
       ORDER BY year DESC, month DESC`,
      [req.session.administrator.id]
    );
    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch carbon credits' });
  }
});




// In server.js, find the endpoint:
// In server.js, modify the endpoint:
app.get('/api/administrator/total-credits', administratorAuth, async (req, res) => {
  try {
    const [total] = await pool.query(
      `SELECT total_credits 
       FROM administrator_credit_totals
       WHERE administrator_id = ?`,
      [req.session.administrator.id]
    );
    
    res.json({
      total: total.length ? Number(total[0].total_credits) : 0
    });
  } catch (error) {
    console.error('Total credits error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch credit total',
      details: error.message
    });
  }
});





// ==================== Marketplace Endpoints ====================
// Add this GET endpoint for credit price settings
app.get('/api/admin/credit-price', adminAuth, async (req, res) => {
  try {
    const [settings] = await pool.query(
      'SELECT * FROM admin_credit_settings ORDER BY year DESC, month DESC LIMIT 1'
    );
    res.json(settings[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price settings' });
  }
});

// Create marketplace listing
// Modify the POST /api/marketplace/list endpoint
app.post('/api/marketplace/list', administratorAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { credits, price, month, year } = req.body;

    // Get net credits for this month/year
    const [creditData] = await connection.query(
      `SELECT COALESCE(SUM(cc.credits_issued), 0) AS total 
       FROM carbon_credits cc
       JOIN administrator_offsets ao ON cc.offset_id = ao.id
       WHERE cc.administrator_id = ? 
         AND ao.month = ? 
         AND ao.year = ?`,
      [req.session.administrator.id, month, year]
    );

    const [emissionData] = await connection.query(
      `SELECT COALESCE(SUM(JSON_EXTRACT(emission_data, '$.total') / 1000, 0) AS emissions
       FROM sector_emissions se
       JOIN sectors s ON se.sector_id = s.sector_id
       WHERE s.administrator_id = ? 
         AND se.month = ? 
         AND se.year = ? 
         AND se.verified = 1`,
      [req.session.administrator.id, month, year]
    );

    const available = creditData[0].total - emissionData[0].emissions;
    if (available < credits) throw new Error('Insufficient net credits for this month');

    // Create listing...
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Get marketplace listings
app.get('/api/marketplace', async (req, res) => {
  try {
    const [listings] = await pool.query(`
      SELECT ml.*, a.mine_name 
      FROM marketplace_listings ml
      JOIN approved_administrators a ON ml.administrator_id = a.administrator_id
      WHERE ml.status = 'active'
    `);
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// ==================== Admin Credit Management ====================

// Set base price
app.post('/api/admin/credit-price', adminAuth, async (req, res) => {
  try {
    const { month, year, price } = req.body;
    await pool.query(
      `INSERT INTO admin_credit_settings 
       (month, year, base_price, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       base_price = VALUES(base_price),
       updated_by = VALUES(updated_by)`,
      [month, year, price, req.session.admin.id]
    );
    
    // Return the updated settings
    const [settings] = await pool.query(
      'SELECT * FROM admin_credit_settings WHERE month = ? AND year = ?',
      [month, year]
    );
    res.json(settings[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update price' });
  }
});

// Get all administrators credits
// ==================== Admin Credit Overview ====================
app.get('/api/admin/credit-overview', adminAuth, async (req, res) => {
  try {
    const [data] = await pool.query(`
      SELECT 
        a.administrator_id,
        a.mine_name,
        COALESCE(act.total_credits, 0) AS total_credits,
        COALESCE(
          (SELECT SUM(emission_data->>"$.total") 
           FROM sector_emissions se
           JOIN sectors s ON se.sector_id = s.sector_id
           WHERE s.administrator_id = a.administrator_id
             AND se.verified = 1
          ), 0
        ) AS emissions,
        COALESCE(act.total_credits, 0) - COALESCE(
          (SELECT SUM(emission_data->>"$.total") 
           FROM sector_emissions se
           JOIN sectors s ON se.sector_id = s.sector_id
           WHERE s.administrator_id = a.administrator_id
             AND se.verified = 1
          ), 0
        ) AS available
      FROM approved_administrators a
      LEFT JOIN administrator_credit_totals act 
        ON a.administrator_id = act.administrator_id
    `);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credit data' });
  }
});

// server.js - Update /api/administrator/available-credits endpoint
// Updated /api/administrator/available-credits endpoint
  // server.js - Available Credits Endpoint
 // Modify the /api/administrator/available-credits endpoint
app.get('/api/administrator/available-credits', administratorAuth, async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ error: 'Month and year required' });

  try {
    // Get credits for this month/year
    const [credits] = await pool.query(
      `SELECT COALESCE(SUM(cc.credits_issued), 0) AS total 
       FROM carbon_credits cc
       JOIN administrator_offsets ao ON cc.offset_id = ao.id
       WHERE cc.administrator_id = ? 
         AND ao.month = ? 
         AND ao.year = ?`,
      [req.session.administrator.id, month, year]
    );

    // Get emissions for this month/year
    const [emissions] = await pool.query(
      `SELECT COALESCE(SUM(JSON_EXTRACT(emission_data, '$.total') / 1000, 0) AS emissions
       FROM sector_emissions se
       JOIN sectors s ON se.sector_id = s.sector_id
       WHERE s.administrator_id = ? 
         AND se.month = ? 
         AND se.year = ? 
         AND se.verified = 1`,
      [req.session.administrator.id, month, year]
    );

    const available = credits[0].total - emissions[0].emissions;
    res.json({ available: Math.max(available, 0) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate credits' });
  }
});



// server.js - Add new endpoint
app.get('/api/admin/net-credits', adminAuth, async (req, res) => {
  try {
    const [data] = await pool.query(`
      SELECT 
        a.administrator_id,
        a.mine_name,
        COALESCE(act.total_credits, 0) AS total_credits,
        COALESCE(
          (SELECT SUM(JSON_EXTRACT(emission_data, '$.total')) 
          FROM sector_emissions se
          JOIN sectors s ON se.sector_id = s.sector_id
          WHERE s.administrator_id = a.administrator_id
        ), 0) / 1000 AS emissions,
        COALESCE(act.total_credits, 0) - 
        (COALESCE(
          (SELECT SUM(JSON_EXTRACT(emission_data, '$.total')) 
          FROM sector_emissions se
          JOIN sectors s ON se.sector_id = s.sector_id
          WHERE s.administrator_id = a.administrator_id
        ), 0) / 1000) AS net_available
      FROM approved_administrators a
      LEFT JOIN administrator_credit_totals act 
        ON a.administrator_id = act.administrator_id
    `);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch net credits' });
  }
});


// Add this endpoint for credit-emission reconciliation
app.get('/api/administrator/net-credits', administratorAuth, async (req, res) => {
  try {
    const [credits] = await pool.query(
      `SELECT COALESCE(SUM(credits_issued), 0) AS total_credits
       FROM carbon_credits 
       WHERE administrator_id = ?`,
      [req.session.administrator.id]
    );

    const [emissions] = await pool.query(
      `SELECT COALESCE(SUM(JSON_EXTRACT(emission_data, '$.total') / 1000, 0) AS emissions
       FROM sector_emissions se
       JOIN sectors s ON se.sector_id = s.sector_id
       WHERE s.administrator_id = ?`,
      [req.session.administrator.id]
    );

    const netCredits = credits[0].total_credits - emissions[0].emissions;
    res.json({ net_credits: Math.max(netCredits, 0) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate net credits' });
  }
});


// Error handling middleware at the end
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

