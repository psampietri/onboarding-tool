import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from 'database';
import authRoutes from './api/authRoutes.js';
import userRoutes from './api/userRoutes.js';

const app = express();
const PORT = 5001;

app.use(cors());

// --- FIX: Manual Body Parser ---
// This middleware replaces express.json() and bodyParser.json()
app.use((req, res, next) => {
    // We only need to parse the body for POST/PUT requests
    if (req.method !== 'POST' && req.method !== 'PUT') {
        return next();
    }

    console.log(`[user-service] Manually parsing body for ${req.method} ${req.url}`);
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
        console.log('[user-service] ...received data chunk.');
    });

    req.on('end', () => {
        try {
            console.log('[user-service] Request stream ended. Full body:', body);
            // Attach the parsed body to the request object
            req.body = body ? JSON.parse(body) : {};
            console.log('[user-service] Request body parsed successfully.');
            next();
        } catch (e) {
            console.error('[user-service] Error parsing JSON body:', e);
            res.status(400).send('Bad Request: Invalid JSON');
        }
    });

    req.on('error', (err) => {
        console.error('[user-service] Error in request stream:', err);
        next(err);
    });
});
// --- End of FIX ---

// Define routes for this specific service
app.use('/', authRoutes);
app.use('/users', userRoutes);

const startServer = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connection verified for user-service.');
        client.release();

        app.listen(PORT, () => {
            console.log(`user-service listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('FATAL: user-service failed to connect to the database on startup.', err.stack);
        console.error('Please check that your PostgreSQL server is running and that the connection details in your .env file are correct.');
        process.exit(1);
    }
};

startServer();
