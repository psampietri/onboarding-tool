import { Router } from 'express';
import { getServiceDesks, getRequestTypes, getRequestTypeFields, createJiraTicket } from '../services/integrationService.js';

const router = Router();

// --- JIRA READ OPERATIONS ---

router.get('/jira/servicedesks', async (req, res) => {
    try {
        const { configKey } = req.query;
        const serviceDesks = await getServiceDesks(configKey);
        res.json(serviceDesks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/jira/servicedesks/:serviceDeskId/requesttypes', async (req, res) => {
    try {
        const { serviceDeskId } = req.params;
        const { configKey } = req.query;
        const requestTypes = await getRequestTypes(configKey, serviceDeskId);
        res.json(requestTypes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/jira/servicedesks/:serviceDeskId/requesttypes/:requestTypeId/fields', async (req, res) => {
    try {
        const { serviceDeskId, requestTypeId } = req.params;
        const { configKey } = req.query;
        const fields = await getRequestTypeFields(configKey, serviceDeskId, requestTypeId);
        res.json(fields);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- JIRA WRITE OPERATIONS ---

router.post('/jira/requests', async (req, res) => {
    try {
        const { configKey, serviceDeskId, requestTypeId, requestFieldValues } = req.body;
        const result = await createJiraTicket(configKey, serviceDeskId, requestTypeId, requestFieldValues);
        res.status(201).json(result);
    } catch (error) {
        console.error("Jira Request Creation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;