import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from '../../../database/index.js';
import templateRoutes from './api/templateRoutes.js';
import logger from '../../../utils/logger.js';

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.use('/', templateRoutes);

pool.query('SELECT NOW()', (err) => {
    if (err) {
        logger.error({ err }, 'FATAL: template-service failed to connect to the database on startup.');
        process.exit(1);
    } else {
        logger.info('Database connection verified for template-service.');
        app.listen(PORT, () => {
            logger.info(`template-service listening on port ${PORT}`);
        });
    }
});