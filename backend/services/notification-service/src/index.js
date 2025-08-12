import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config';
import pool from '../../../database/index.js';
import notificationRoutes from './api/notificationRoutes.js';

const app = express();
const PORT = process.env.PORT || 5006;

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
app.use('/notifications', notificationRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'Notification Service is running' });
});

app.get('/email/templates', (req, res) => {
  // Fetch and return email templates
  res.json([
    { id: 1, name: 'Welcome Email', subject: 'Welcome to the Team!' },
    { id: 2, name: 'Task Assignment', subject: 'You have a new task' },
  ]);
});

app.listen(PORT, () => {
    console.log(`Notification service is running on port ${PORT}`);
});