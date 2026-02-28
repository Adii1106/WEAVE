require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const connectDB = require('./db');

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');

app.use('/api/auth', authRoutes);
app.use('/api/room', roomRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'WEAVE Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
