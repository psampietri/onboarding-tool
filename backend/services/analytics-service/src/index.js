// backend/services/analytics-service/src/index.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config';
import pool from '../../database/index.js';
import analyticsRoutes from './api/analyticsRoutes.js';
import auditRoutes from './api/auditRoutes.js'; // Import the audit routes

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(bodyParser.json());

// Test database connection
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Database connection error:', err.stack);
        process.exit(1);
    } else {
        console.log('Database connection successful');
    }
});

// Routes
app.use('/analytics', analyticsRoutes);
app.use('/audit', auditRoutes); // Add the audit routes

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'Analytics Service is running' });
});

app.get('/kpis', (req, res) => {
  // Fetch and return KPIs
  res.json({
    activeUsers: 150,
    completionRate: 85,
    averageTime: '3d 4h',
  });
});

app.get('/charts', (req, res) => {
  // Fetch and return chart data
  res.json([
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
  ]);
});


app.listen(PORT, () => {
    console.log(`Analytics service is running on port ${PORT}`);
});