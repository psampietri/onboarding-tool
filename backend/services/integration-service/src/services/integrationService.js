import axios from 'axios';
import 'dotenv/config';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

const jiraApi = axios.create({
    baseURL: JIRA_BASE_URL,
    headers: {
        'Authorization': `Bearer ${JIRA_API_TOKEN}`,
        'Content-Type': 'application/json',
    },
});

export const getServiceDesks = async (platform, configKey) => {
    try {
        const response = await jiraApi.get('/rest/servicedeskapi/servicedesk');
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Jira API error:', error.response.status, error.response.data);
            throw new Error(`Jira API request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error('Jira API request error:', error.request);
            throw new Error('Jira API request failed. No response received from Jira.');
        } else {
            console.error('Jira API setup error:', error.message);
            throw new Error(`Jira API setup error: ${error.message}`);
        }
    }
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

export const getJiraTicket = async (platform, ticketKey) => {
    try {
        // Using the generic Jira issue API endpoint which works for service desk tickets too
        const response = await jiraApi.get(`/rest/api/3/issue/${ticketKey}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Jira API error fetching ticket:', error.response.status, error.response.data);
            throw new Error(`Jira API request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error('Jira API request error fetching ticket:', error.request);
            throw new Error('Jira API request failed. No response received from Jira.');
        } else {
            console.error('Jira API setup error fetching ticket:', error.message);
            throw new Error(`Jira API setup error: ${error.message}`);
        }
    }
};