import { Router } from 'express';
import * as OnboardingService from '../services/onboardingService.js';

const router = Router();

// --- Onboarding Instances ---
router.post('/instances', async (req, res) => {
    try {
        const newInstance = await OnboardingService.createOnboardingInstance(req.body);
        res.status(201).json(newInstance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/instances', async (req, res) => {
    const instances = await OnboardingService.getAllOnboardingInstances();
    res.json(instances);
});

router.get('/instances/:id', async (req, res) => {
    const instance = await OnboardingService.getOnboardingInstanceById(req.params.id);
    if (!instance) {
        return res.status(404).json({ error: 'Onboarding instance not found.' });
    }
    res.json(instance);
});

// Update an onboarding instance
router.put('/instances/:id', async (req, res) => {
    try {
        const updatedInstance = await OnboardingService.updateOnboardingInstance(req.params.id, req.body);
        if (!updatedInstance) {
            return res.status(404).json({ error: 'Onboarding instance not found.' });
        }
        res.json(updatedInstance);
    } catch (error) {
        console.error('Error updating onboarding instance:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete an onboarding instance
router.delete('/instances/:id', async (req, res) => {
    try {
        await OnboardingService.deleteOnboardingInstance(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting onboarding instance:', error);
        res.status(500).json({ error: 'Failed to delete onboarding instance.' });
    }
});


// --- Task Instances ---

// Get all tasks for a specific user
router.get('/users/:userId/tasks', async (req, res) => {
    try {
        const tasks = await OnboardingService.getTasksByUserId(req.params.userId);
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        res.status(500).json({ error: 'Failed to retrieve user tasks.' });
    }
});

// Update a specific task instance
router.put('/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await OnboardingService.updateTaskStatus(req.params.id, req.body);
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/execute', async (req, res) => {
    try {
        const result = await OnboardingService.executeAutomatedTask(req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Execution Error:", error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/tasks/:id/dry-run', async (req, res) => {
    try {
        const result = await OnboardingService.dryRunAutomatedTask(req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Dry Run Error:", error);
        res.status(400).json({ error: error.message });
    }
});


export default router;
