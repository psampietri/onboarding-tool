import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Corrected dotenv import
import pool from '../../../database/index.js';
import onboardingRoutes from './api/onboardingRoutes.js';
import logger from '../../../utils/logger.js';

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

app.use('/', onboardingRoutes);

const startServer = async () => {
    try {
        const client = await pool.connect();
        logger.info('Database connection verified for onboarding-service.');
        client.release();

        app.listen(PORT, () => {
            logger.info(`onboarding-service listening on port ${PORT}`);
        });
    } catch (err) {
        logger.error({ err }, 'FATAL: onboarding-service failed to connect to the database on startup.');
        process.exit(1);
    }
};

startServer();