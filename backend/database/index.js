import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

console.log('Initializing database pool with the following config:');
console.log({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: '***', // For security, we do not log the password
    port: process.env.DB_PORT,
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 3000, // Shorten timeout for faster failure
    idleTimeoutMillis: 5000,
});

pool.on('error', (err, client) => {
    console.error('DATABASE POOL ERROR:', err);
    process.exit(-1);
});

console.log('Database pool created.');

export default pool;
