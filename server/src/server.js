require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// WEAVE Backend - Student Hackathon Project
const app = express();
const PORT = process.env.PORT || 5000;
const connectDB = require('./db');

// Connect to our MongoDB
connectDB();

// Basic Middleware
app.use(cors());
app.use(express.json());

// Main Routes
const uploadRoutes = require('./routes/upload');

app.use('/api/upload', uploadRoutes);

// Static folder for our uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check to make sure everything is alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'WEAVE Server is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
