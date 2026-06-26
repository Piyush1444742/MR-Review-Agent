import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDbStatus } from './config/db.js';
import reviewRoutes from './routes/reviewRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/reviews', reviewRoutes);

// Health & Database Status
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    database: getDbStatus(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('MR Review Agent API is running.');
});

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });

  } catch (err) {
    console.error("Server failed to start:");
    console.error(err);
  }
};

startServer();
