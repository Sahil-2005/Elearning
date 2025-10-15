const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const morgan = require('morgan');

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));

// Global error handler (safety net)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
});

const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://rahultag161_db_user:kq3NFWfECzycdZ8c@elearning.4mk0kzh.mongodb.net/Elearning?retryWrites=true&w=majority&appName=Elearning';
const MONGO_URI = process.env.MONGO_URI;

connectDB(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });


