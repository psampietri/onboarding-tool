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
app.use('/', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Notification Service is running' });
});

app.listen(PORT, () => {
    console.log(`Notification service is running on port ${PORT}`);
});