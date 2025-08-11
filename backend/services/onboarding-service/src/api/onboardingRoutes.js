import { Router } from 'express';
import * as OnboardingService from '../services/onboardingService.js';

const router = Router();

// Assign an onboarding template to a user
router.post('/instances', async (req, res) => {
    try {
        const { userId, templateId, assignedBy } = req.body;
        const instance = await OnboardingService.assignOnboarding(userId, templateId, assignedBy);
        res.status(201).json(instance);
    } catch (error) {
        console.error('Error creating onboarding instance:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all active onboarding instances (for the admin dashboard)
router.get('/instances', async (req, res) => {
    try {
        const instances = await OnboardingService.getAllOnboardingInstances();
        res.json(instances);
    } catch (error) {
        console.error('Error fetching onboarding instances:', error);
        res.status(500).json({ error: 'Failed to retrieve onboarding instances.' });
    }
});

// Get the details of a single onboarding instance, including its tasks
router.get('/instances/:id', async (req, res) => {
    try {
        const instanceDetails = await OnboardingService.getOnboardingInstanceById(req.params.id);
        if (!instanceDetails) {
            return res.status(404).json({ error: 'Onboarding instance not found.' });
        }
        res.json(instanceDetails);
    } catch (error) {
        console.error('Error fetching instance details:', error);
        res.status(500).json({ error: 'Failed to retrieve instance details.' });
    }
});

// Get the detailed status of a single onboarding instance for a specific user
router.get('/instances/user/:userId', async (req, res) => {
    try {
        const tasks = await OnboardingService.getOnboardingStatusForUser(req.params.userId);
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching user onboarding status:', error);
        res.status(500).json({ error: 'Failed to retrieve onboarding status.' });
    }
});

// Update the status of a specific task instance
router.put('/tasks/:taskId', async (req, res) => {
    try {
        const { status, ticketInfo } = req.body;
        const updatedTask = await OnboardingService.updateTaskStatus(req.params.taskId, status, ticketInfo);
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(400).json({ error: error.message });
    }
});

// Execute an automated task
router.post('/tasks/:taskId/execute', async (req, res) => {
    try {
        // In a real application, this would trigger an external API call
        // For now, we will simulate the process by updating the task status
        const result = await OnboardingService.executeAutomatedTask(req.params.taskId);
        res.json(result);
    } catch (error) {
        console.error('Error executing automated task:', error);
        res.status(500).json({ error: 'Failed to execute automated task.' });
    }
});

export default router;
