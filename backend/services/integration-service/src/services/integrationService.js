import fetch from 'node-fetch';

// Helper function to get the correct configuration from environment variables
const getPlatformConfig = (configKey) => {
    const baseUrl = process.env[`${configKey}_BASE_URL`];
    const apiToken = process.env[`${configKey}_API_TOKEN`];

    if (!baseUrl || !apiToken) {
        throw new Error(`Configuration for key "${configKey}" not found in .env file.`);
    }

    return { baseUrl, apiToken };
};

// Generic function to make API calls to a platform
const callPlatformApi = async (configKey, endpoint, method = 'GET', body = null) => {
    const { baseUrl, apiToken } = getPlatformConfig(configKey);
    const url = `${baseUrl}${endpoint}`;

    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    // Handle responses with no content
    if (response.status === 204) {
        return null;
    }

    return response.json();
};

// --- Service Functions ---

export const getServiceDesks = async (configKey) => {
    return await callPlatformApi(configKey, '/rest/servicedeskapi/servicedesk');
};

export const getRequestTypes = async (configKey, serviceDeskId) => {
    return await callPlatformApi(configKey, `/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype`);
};

export const getRequestTypeFields = async (configKey, serviceDeskId, requestTypeId) => {
    return await callPlatformApi(configKey, `/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype/${requestTypeId}/field`);
};

export const createJiraTicket = async (configKey, serviceDeskId, requestTypeId, requestFieldValues) => {
    const endpoint = '/rest/servicedeskapi/request';
    const body = {
        serviceDeskId,
        requestTypeId,
        requestFieldValues,
    };
    return await callPlatformApi(configKey, endpoint, 'POST', body);
};
