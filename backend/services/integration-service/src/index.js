import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import integrationRoutes from './api/integrationRoutes.js';

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// All routes will be handled in the routes file
app.use('/', integrationRoutes);

app.listen(PORT, () => {
    console.log(`Integration Service listening on port ${PORT}`);
});
