// backend/services/integration-service/src/services/integrationService.js
import { callJiraApi, formatJiraPayload, getJiraIssueDetails } from '../jira.js';

export const getServiceDesks = async (platform, configKey) => {
    // Platform and configKey are kept for future extensibility (e.g., supporting other systems)
    return await callJiraApi('/rest/servicedeskapi/servicedesk');
};

export const getRequestTypes = async (platform, configKey, serviceDeskId) => {
    return await callJiraApi(`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype`);
};

export const getRequestTypeFields = async (platform, configKey, serviceDeskId, requestTypeId) => {
    return await callJiraApi(`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype/${requestTypeId}/field`);
};

export const createJiraTicket = async (jiraConfig, user) => {
    const { serviceDeskId, requestTypeId, fieldMappings } = jiraConfig;
    const requestFieldValues = formatJiraPayload(fieldMappings, user);

    const payload = {
        serviceDeskId,
        requestTypeId,
        requestFieldValues
    };

    return await callJiraApi('/rest/servicedeskapi/request', 'POST', payload);
};

// Renamed from prepareJiraTicketPayload to reflect its purpose better in the service layer
export const prepareDryRunPayload = (jiraConfig, user) => {
    const { serviceDeskId, requestTypeId, fieldMappings } = jiraConfig;
    const requestFieldValues = formatJiraPayload(fieldMappings, user);

    return {
        serviceDeskId,
        requestTypeId,
        requestFieldValues
    };
};

export const getJiraTicket = async (platform, ticketKey) => {
    return await getJiraIssueDetails(ticketKey);
};