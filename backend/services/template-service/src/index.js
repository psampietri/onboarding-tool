import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from 'database';

// Dynamically import routes based on service name
const serviceName = process.cwd().split('/').pop();
const routes = await import(`./api/${serviceName.replace('-service', '')}Routes.js`);

const app = express();
// Assign a unique port to each service
const PORT = {
    'user-service': 5001,
    'template-service': 5002,
    'onboarding-service': 5003,
    'analytics-service': 5004,
}[serviceName];

app.use(cors());
app.use(express.json());

// Use the dynamically imported routes
app.use('/', routes.default);
if (serviceName === 'user-service') {
    const userRoutes = await import('./api/userRoutes.js');
    app.use('/users', userRoutes.default);
}


// Test the database connection before starting the server
pool.query('SELECT NOW()')
    .then(() => {
        app.listen(PORT, () => {
            console.log(`${serviceName} listening on port ${PORT}`);
        });
        console.log(`Database connection verified for ${serviceName}.`);
    })
    .catch(err => {
        console.error(`FATAL: ${serviceName} failed to connect to the database on startup.`, err.stack);
        console.error('Please check that your PostgreSQL server is running and that the connection details in your .env file are correct.');
        process.exit(1);
    });
