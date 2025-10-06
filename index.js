const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const authMiddleware = require('./middlewares/authMiddleware');

const authRoutes = require('./routes/auth');
const oemRoutes = require('./routes/oem');
const inspectionRoutes = require('./routes/inspection');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Connect to MongoDB
connectDB();

// Public routes
app.get('/', (req, res) => {
  res.send('AOI IC Backend Running');
});

app.use('/auth', authRoutes);
app.use('/oem', oemRoutes);

// Protect inspection routes with JWT middleware
app.use('/inspection', authMiddleware, inspectionRoutes);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
