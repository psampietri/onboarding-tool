import { Router } from 'express';
import * as OnboardingService from '../services/onboardingService.js';

const router = Router();

router.post('/instances', async (req, res) => {
    try {
        const { userId, templateId, assignedBy } = req.body;
        const instance = await OnboardingService.assignOnboarding(userId, templateId, assignedBy);
        res.status(201).json(instance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/instances/user/:userId', async (req, res) => {
    try {
        const tasks = await OnboardingService.getOnboardingStatusForUser(req.params.userId);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve onboarding status.' });
    }
});

router.put('/tasks/:taskId', async (req, res) => {
    try {
        const { status, ticketInfo } = req.body;
        const updatedTask = await OnboardingService.updateTaskStatus(req.params.taskId, status, ticketInfo);
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
