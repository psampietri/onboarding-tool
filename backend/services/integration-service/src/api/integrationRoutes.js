import { Router } from 'express';
import { getServiceDesks, getRequestTypes, getRequestTypeFields, createJiraTicket, getJiraTicket } from '../services/integrationService.js';

const router = Router();

// --- Integration READ OPERATIONS ---

router.get('/:platform/servicedesks', async (req, res) => {
    console.log(`[integrationRoutes] GET /${req.params.platform}/servicedesks handler reached.`);
    try {
        const { platform } = req.params;
        const { configKey } = req.query;
        const serviceDesks = await getServiceDesks(platform, configKey);
        res.json(serviceDesks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:platform/servicedesks/:serviceDeskId/requesttypes', async (req, res) => {
    try {
        const { platform, serviceDeskId } = req.params;
        const { configKey } = req.query;
        const requestTypes = await getRequestTypes(platform, configKey, serviceDeskId);
        res.json(requestTypes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:platform/servicedesks/:serviceDeskId/requesttypes/:requestTypeId/fields', async (req, res) => {
    try {
        const { platform, serviceDeskId, requestTypeId } = req.params;
        const { configKey } = req.query;
        const fields = await getRequestTypeFields(platform, configKey, serviceDeskId, requestTypeId);
        res.json(fields);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:platform/requests/:ticketKey', async (req, res) => {
    try {
        const { platform, ticketKey } = req.params;
        const ticketDetails = await getJiraTicket(platform, ticketKey);
        res.json(ticketDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Integration WRITE OPERATIONS ---

router.post('/:platform/requests', async (req, res) => {
    try {
        const { platform } = req.params;
        const { configKey, serviceDeskId, requestTypeId, requestFieldValues } = req.body;
        const result = await createJiraTicket(platform, configKey, serviceDeskId, requestTypeId, requestFieldValues);
        res.status(201).json(result);
    } catch (error) {
        console.error("Jira Request Creation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;