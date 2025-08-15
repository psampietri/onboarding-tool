import { Router } from 'express';
import * as IntegrationService from '../services/integrationService.js';

const router = Router();

// --- Jira Metadata Routes ---
router.get('/:platform/servicedesks', async (req, res) => {
    try {
        const { platform } = req.params;
        const { configKey } = req.query;
        const serviceDesks = await IntegrationService.getServiceDesks(platform, configKey);
        res.json(serviceDesks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:platform/servicedesks/:serviceDeskId/requesttypes', async (req, res) => {
    try {
        const { platform, serviceDeskId } = req.params;
        const { configKey } = req.query;
        const requestTypes = await IntegrationService.getRequestTypes(platform, configKey, serviceDeskId);
        res.json(requestTypes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:platform/servicedesks/:serviceDeskId/requesttypes/:requestTypeId/fields', async (req, res) => {
    try {
        const { platform, serviceDeskId, requestTypeId } = req.params;
        const { configKey } = req.query;
        const fields = await IntegrationService.getRequestTypeFields(platform, configKey, serviceDeskId, requestTypeId);
        res.json(fields);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:platform/requests/:ticketKey', async (req, res) => {
    try {
        const { platform, ticketKey } = req.params;
        const ticketDetails = await IntegrationService.getJiraTicket(platform, ticketKey);
        res.json(ticketDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- Jira Action Routes ---

router.post('/requests/create', async (req, res) => {
    try {
        const { jiraConfig, user } = req.body;
        if (!jiraConfig || !user) {
            return res.status(400).json({ error: 'Missing jiraConfig or user in request body.' });
        }
        const result = await IntegrationService.createJiraTicket(jiraConfig, user);
        res.status(201).json(result);
    } catch (error) {
        console.error("Jira Request Creation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/requests/dry-run', async (req, res) => {
    try {
        const { jiraConfig, user } = req.body;
        if (!jiraConfig || !user) {
            return res.status(400).json({ error: 'Missing jiraConfig or user in request body.' });
        }
        const result = await IntegrationService.prepareDryRunPayload(jiraConfig, user);
        res.json({
            message: "This is a dry run. The following payload would be sent to Jira.",
            payload: result
        });
    } catch (error) {
        console.error("Dry Run Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
