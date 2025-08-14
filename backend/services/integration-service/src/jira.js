import axios from 'axios';

let jiraApi;

export const initJira = (token, baseUrl) => {
    if (!token || !baseUrl) {
        throw new Error('Jira API token and base URL are required.');
    }
    jiraApi = axios.create({
        baseURL: baseUrl,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        timeout: 30000 // 30-second timeout
    });
    console.log(`Jira integration initialized for base URL: ${baseUrl}`);
};

export const callJiraApi = async (endpoint, method = 'GET', payload = null) => {
    if (!jiraApi) {
        throw new Error('Jira API client has not been initialized. Call initJira() first.');
    }
    // ADDED LOG: Announce the outgoing request to Jira
    console.log(`[integration-service] Calling Jira API: ${method} ${jiraApi.defaults.baseURL}${endpoint}`);
    try {
        const options = {
            method,
            url: endpoint,
        };
        if (payload) {
            options.data = payload;
        }
        const response = await jiraApi(options);
        // ADDED LOG: Announce a successful response from Jira
        console.log(`[integration-service] Success from Jira API for ${endpoint}. Status: ${response.status}`);
        return response.status === 204 ? { success: true } : response.data;
    } catch (error) {
        if (error.response) {
            console.error(`Jira API Error: ${error.response.status} calling ${endpoint}`, error.response.data);
            throw { status: error.response.status, data: error.response.data };
        } else if (error.request) {
            // This block will be hit on a timeout
            console.error(`Jira API Error: No response for ${endpoint}. Request timed out.`);
            throw new Error(`Jira API request failed. No response received (timeout).`);
        } else {
            console.error('Jira API Setup Error:', error.message);
            throw new Error(`Jira API setup error: ${error.message}`);
        }
    }
};

// ... (formatJiraPayload and getJiraIssueDetails functions remain the same)

/**
 * Formats the payload for creating a Jira ticket based on template mappings.
 * This is adapted from the more comprehensive version in the access-request-automation tool.
 * @param {object} fieldMappings - The field mappings from the template.
 * @param {object} user - The user data.
 * @returns {object} The formatted requestFieldValues for the Jira API.
 */
export const formatJiraPayload = (fieldMappings, user) => {
    const requestFieldValues = {};

    for (const [fieldId, mapping] of Object.entries(fieldMappings)) {
        let value = mapping.type === 'dynamic' ? user[mapping.value] : mapping.value;

        // Helper to check if a value is numeric
        const isNumeric = (val) => val !== null && !isNaN(parseFloat(val)) && isFinite(val);

        if (mapping.jiraSchema) {
            const { type, items } = mapping.jiraSchema;

            if (type === 'array' && items === 'user') {
                requestFieldValues[fieldId] = Array.isArray(value) ? value.map(v => ({ name: v })) : [{ name: value }];
            } else if (type === 'user') {
                requestFieldValues[fieldId] = { name: value };
            } else if (type === 'array' && items === 'option') {
                const values = Array.isArray(value) ? value : [value];
                requestFieldValues[fieldId] = values.map(v => (isNumeric(v) ? { id: v.toString() } : { value: v }));
            } else if (type === 'option') {
                requestFieldValues[fieldId] = isNumeric(value) ? { id: value.toString() } : { value: value };
            } else if (type === 'array') {
                requestFieldValues[fieldId] = Array.isArray(value) ? value : [value];
            } else {
                requestFieldValues[fieldId] = value;
            }
        } else {
            // Fallback for older templates without a schema
            requestFieldValues[fieldId] = value;
        }
    }
    return requestFieldValues;
};

/**
 * Fetches Jira issue details, with a fallback from Service Desk API to the generic API.
 * @param {string} issueKey - The Jira issue key (e.g., "PROJ-123").
 * @returns {Promise<object>} Normalized issue details.
 */
export const getJiraIssueDetails = async (issueKey) => {
    try {
        // First, try the more detailed Service Desk API
        return await callJiraApi(`/rest/servicedeskapi/request/${issueKey}`);
    } catch (error) {
        if (error.status === 404) {
            // If not found, fall back to the generic Jira API for broader compatibility
            try {
                const genericIssue = await callJiraApi(`/rest/api/2/issue/${issueKey}`);
                // Normalize the response to match the Service Desk API structure
                return {
                    issueKey: genericIssue.key,
                    requestType: { name: genericIssue.fields.issuetype.name },
                    createdDate: { iso8601: genericIssue.fields.created },
                    currentStatus: {
                        status: genericIssue.fields.status.name,
                        statusCategory: genericIssue.fields.status.statusCategory.key,
                        statusDate: { iso8601: genericIssue.fields.resolutiondate || genericIssue.fields.updated }
                    }
                };
            } catch (genericError) {
                console.error(`Failed to fetch issue ${issueKey} from both Service Desk and generic APIs.`);
                throw genericError;
            }
        }
        // If the error was not a 404, re-throw it
        throw error;
    }
};