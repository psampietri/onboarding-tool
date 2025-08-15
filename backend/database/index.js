import pg from 'pg';
import 'dotenv/config';
import logger from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 3000, // Shorten timeout for faster failure
    idleTimeoutMillis: 5000,
});

pool.on('connect', client => {
    logger.info('Database client connected.');
});

pool.on('error', (err, client) => {
    logger.error({ err }, 'DATABASE POOL ERROR:');
});

pool.on('remove', client => {
    logger.info('Database client removed.');
});

logger.info('Database pool created.');

export default pool;