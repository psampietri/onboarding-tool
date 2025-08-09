import { Router } from 'express';
import * as AnalyticsService from '../services/analyticsService.js';

const router = Router();

router.get('/kpis', async (req, res) => {
    try {
        const kpis = await AnalyticsService.getOnboardingKPIs();
        res.json(kpis);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve KPIs.' });
    }
});

export default router;
