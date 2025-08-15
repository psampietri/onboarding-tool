import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Corrected dotenv import
import integrationRoutes from './api/integrationRoutes.js';
import { initJira } from './jira.js';
import logger from '../../../utils/logger.js';

// Initialize the Jira utility with credentials from environment variables
try {
    initJira(process.env.JIRA_API_TOKEN, process.env.JIRA_BASE_URL);
} catch (error) {
    logger.error({ err: error }, "FATAL: Failed to initialize Jira integration.");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
    logger.info('[integration-service] Received a request to /ping');
    res.status(200).json({ status: 'ok' });
});

app.use('/', integrationRoutes);

app.listen(PORT, () => {
    logger.info(`Integration Service listening on port ${PORT}`);
});