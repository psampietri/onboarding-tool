import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import integrationRoutes from './api/integrationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// --- Start of Debugging Health Check ---
// This is a simple route to test if the server is alive and responding.
app.get('/ping', (req, res) => {
    console.log('[integration-service] Received a request to /ping');
    res.status(200).json({ status: 'ok' });
});
// --- End of Debugging Health Check ---

// All other routes will be handled in the routes file
app.use('/', integrationRoutes);

app.listen(PORT, () => {
    console.log(`Integration Service listening on port ${PORT}`);
});