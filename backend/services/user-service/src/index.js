import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config';
import pool from 'database';
import authRoutes from './api/authRoutes.js';
import userRoutes from './api/userRoutes.js';

const app = express();
const PORT = 5001;

// Standard middleware setup
app.use(cors());
app.use(bodyParser.json());

// Define routes for this service
app.use('/', authRoutes);
// FIX: Mount user routes at the root
app.use('/', userRoutes); 

const startServer = async () => {
    try {
        // Test the database connection before starting
        const client = await pool.connect();
        console.log('Database connection verified for user-service.');
        client.release();

        // If the connection is successful, start the server
        app.listen(PORT, () => {
            console.log(`user-service listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('FATAL: user-service failed to connect to the database on startup.', err.stack);
        process.exit(1);
    }
};

startServer();
