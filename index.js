// index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authMiddleware = require('./middlewares/authMiddleware');

// Load env variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const oemRoutes = require('./routes/oem');
const inspectionRoutes = require('./routes/inspection');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== MIDDLEWARES ======

// Security headers
app.use(helmet());

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Set your frontend URL in .env for security
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

// JSON parser
app.use(express.json({ limit: '10mb' }));

// Compression for faster responses
app.use(compression());

// HTTP request logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ====== CONNECT DATABASE ======
connectDB();

// ====== ROUTES ======
app.get('/', (req, res) => {
  res.send('✅ AOI IC Backend Running Successfully');
});

app.use('/auth', authRoutes);
app.use('/oem', oemRoutes);
app.use('/inspection', authMiddleware, inspectionRoutes);

// ====== ERROR HANDLER ======
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
