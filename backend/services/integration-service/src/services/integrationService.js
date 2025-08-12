import axios from 'axios';
import 'dotenv/config';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;

const jiraApi = axios.create({
    baseURL: JIRA_BASE_URL,
    headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json',
    },
});

export const getServiceDesks = async (platform, configKey) => {
    const response = await jiraApi.get('/rest/servicedeskapi/servicedesk');
    return response.data;
};

export const getRequestTypes = async (platform, configKey, serviceDeskId) => {
    const response = await jiraApi.get(`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype`);
    return response.data;
};

export const getRequestTypeFields = async (platform, configKey, serviceDeskId, requestTypeId) => {
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
    const response = await jiraApi.post('/rest/servicedeskapi/request', payload);
    return response.data;
};
