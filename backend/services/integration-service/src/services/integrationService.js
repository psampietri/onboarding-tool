// backend/services/integration-service/src/services/integrationService.js
import axios from 'axios';
import 'dotenv/config';

const getJiraApi = (configKey) => {
    const BASE_URL = process.env[`${configKey}_BASE_URL`];
    const API_TOKEN = process.env[`${configKey}_API_TOKEN`];

    if (!BASE_URL || !API_TOKEN) {
        throw new Error(`Missing Jira configuration for configKey: ${configKey}`);
    }

    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Basic ${Buffer.from(`:${API_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/json',
        },
    });
};

export const getServiceDesks = async (platform, configKey) => {
    const jiraApi = getJiraApi(configKey);
    const response = await jiraApi.get('/rest/servicedeskapi/servicedesk');
    return response.data;
};

export const getRequestTypes = async (platform, configKey, serviceDeskId) => {
    const jiraApi = getJiraApi(configKey);
    const response = await jiraApi.get(`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype`);
    return response.data;
};

export const getRequestTypeFields = async (platform, configKey, serviceDeskId, requestTypeId) => {
    const jiraApi = getJiraApi(configKey);
    const response = await jiraApi.get(`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype/${requestTypeId}/field`);
    return response.data;
};

export const prepareJiraTicketPayload = (jiraConfig, user) => {
    const { serviceDeskId, requestTypeId, fieldMappings } = jiraConfig;
    const requestFieldValues = {};

    for (const fieldId in fieldMappings) {
        const mapping = fieldMappings[fieldId];
        if (mapping.type === 'static') {
            requestFieldValues[fieldId] = mapping.value;
        } else if (mapping.type === 'dynamic' && user[mapping.value]) {
            // Jira's reporter field often requires an object with emailAddress
            if (fieldId === 'reporter') {
                requestFieldValues[fieldId] = { emailAddress: user[mapping.value] };
            } else {
                requestFieldValues[fieldId] = user[mapping.value];
            }
        }
    }

    // Add summary and description as required by many Jira setups
    if (!requestFieldValues.summary) {
        requestFieldValues.summary = `Onboarding Task: Access for ${user.name}`;
    }
    if (!requestFieldValues.description) {
        requestFieldValues.description = `Automated access request for ${user.name} (${user.email}).`;
    }

    return {
        serviceDeskId,
        requestTypeId,
        requestFieldValues
    };
};

export const createJiraTicket = async (jiraConfig, user) => {
    const payload = prepareJiraTicketPayload(jiraConfig, user);
    const jiraApi = getJiraApi(jiraConfig.configKey);
    const response = await jiraApi.post('/rest/servicedeskapi/request', payload);
    return response.data;
};