import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from '../../../database/index.js';
import onboardingRoutes from './api/onboardingRoutes.js';

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

app.use('/', onboardingRoutes);

const startServer = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connection verified for onboarding-service.');
        client.release();

        app.listen(PORT, () => {
            console.log(`onboarding-service listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('FATAL: onboarding-service failed to connect to the database on startup.', err.stack);
        process.exit(1);
    }
};

startServer();