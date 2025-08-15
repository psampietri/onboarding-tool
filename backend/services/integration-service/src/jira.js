import axios from 'axios';
import logger from '../../../utils/logger.js';

let jiraApi;
// In-memory cache for Jira field schemas to avoid repeated API calls.
const schemaCache = new Map();

/**
 * Initializes the Jira API client.
 * @param {string} token - The Jira API token.
 * @param {string} baseUrl - The base URL of the Jira instance.
 */
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
    logger.info(`Jira integration initialized for base URL: ${baseUrl}`);
};

/**
 * A robust, centralized function for making all Jira API calls.
 * @param {string} endpoint - The API endpoint to call.
 * @param {string} [method='GET'] - The HTTP method.
 * @param {object|null} [payload=null] - The request payload.
 * @returns {Promise<any>} The JSON response from the API.
 */
export const callJiraApi = async (endpoint, method = 'GET', payload = null) => {
    if (!jiraApi) {
        throw new Error('Jira API client has not been initialized. Call initJira() first.');
    }
    try {
        const options = {
            method,
            url: endpoint,
        };
        if (payload) {
            options.data = payload;
        }
        const response = await jiraApi(options);
        return response.status === 204 ? { success: true } : response.data;
    } catch (error) {
        if (error.response) {
            logger.error({ status: error.response.status, data: error.response.data, endpoint }, 'Jira API Error');
            throw { status: error.response.status, data: error.response.data };
        } else if (error.request) {
            logger.error({ endpoint, request: error.request }, 'Jira API Error: No response');
            throw new Error(`Jira API request failed. No response received.`);
        } else {
            logger.error({ message: error.message }, 'Jira API Setup Error');
            throw new Error(`Jira API setup error: ${error.message}`);
        }
    }
};

/**
 * Fetches the field schema for a given request type, using a cache to improve performance.
 * @param {string} serviceDeskId - The ID of the service desk.
 * @param {string} requestTypeId - The ID of the request type.
 * @returns {Promise<Map<string, object>>} A map of field IDs to their schemas.
 */
const getRequestTypeSchema = async (serviceDeskId, requestTypeId) => {
    const cacheKey = `${serviceDeskId}-${requestTypeId}`;
    if (schemaCache.has(cacheKey)) {
        logger.info({ cacheKey }, 'Jira schema cache hit.');
        return schemaCache.get(cacheKey);
    }
    logger.info({ cacheKey }, 'Jira schema cache miss. Fetching from API.');

    const response = await callJiraApi(`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype/${requestTypeId}/field`);
    const fieldSchemas = new Map(response.requestTypeFields.map(field => [field.fieldId, field.jiraSchema]));
    
    schemaCache.set(cacheKey, fieldSchemas);
    return fieldSchemas;
};

/**
 * Formats the payload for creating a Jira ticket by using the dynamically fetched field schema.
 * @param {string} serviceDeskId - The ID of the service desk.
 * @param {string} requestTypeId - The ID of the request type.
 * @param {object} fieldMappings - The field mappings from the template.
 * @param {object} user - The user data.
 * @returns {Promise<object>} The formatted requestFieldValues for the Jira API.
 */
export const formatJiraPayload = async (serviceDeskId, requestTypeId, fieldMappings, user) => {
    const fieldSchemas = await getRequestTypeSchema(serviceDeskId, requestTypeId);
    const requestFieldValues = {};
    const isNumeric = (val) => val !== null && !isNaN(parseFloat(val)) && isFinite(String(val));

    for (const [fieldId, mapping] of Object.entries(fieldMappings)) {
        const rawValue = mapping.type === 'dynamic' ? user[mapping.value] : mapping.value;

        if (rawValue === undefined || rawValue === null) {
            continue;
        }

        const schema = fieldSchemas.get(fieldId);

        if (schema) {
            const { type, items } = schema;
            if (type === 'array') {
                const values = Array.isArray(rawValue) ? rawValue : [rawValue];
                if (items === 'user') {
                    requestFieldValues[fieldId] = values.map(v => ({ name: v }));
                } else if (items === 'option') {
                    requestFieldValues[fieldId] = values.map(v => (isNumeric(v) ? { id: String(v) } : { value: String(v) }));
                } else {
                    requestFieldValues[fieldId] = values; // Assumes array of strings for other types
                }
            } else if (type === 'option') {
                requestFieldValues[fieldId] = isNumeric(rawValue) ? { id: String(rawValue) } : { value: String(rawValue) };
            } else if (type === 'user') {
                requestFieldValues[fieldId] = { name: rawValue };
            } else {
                requestFieldValues[fieldId] = rawValue;
            }
        } else {
            // Fallback for fields not described by the schema (less common)
            requestFieldValues[fieldId] = rawValue;
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
            logger.warn({ issueKey }, "Ticket not found in Service Desk API, falling back to generic API.");
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
                logger.error({ err: genericError, issueKey }, `Failed to fetch issue from both Service Desk and generic APIs.`);
                throw genericError;
            }
        }
        // If the error was not a 404, re-throw it
        throw error;
    }
};