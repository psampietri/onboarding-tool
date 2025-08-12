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

router.get('/charts', async (req, res) => {
    try {
        const chartData = await AnalyticsService.getChartData();
        res.json(chartData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Failed to retrieve chart data.' });
    }
});

export default router;
