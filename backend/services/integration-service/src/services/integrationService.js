import { callJiraApi, formatJiraPayload, getJiraIssueDetails } from '../jira.js';

export const getServiceDesks = async (platform, configKey) => {
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
    // This function is now async and must be awaited.
    const requestFieldValues = await formatJiraPayload(serviceDeskId, requestTypeId, fieldMappings, user);

    const payload = {
        serviceDeskId,
        requestTypeId,
        requestFieldValues
    };

    return await callJiraApi('/rest/servicedeskapi/request', 'POST', payload);
};

export const prepareDryRunPayload = async (jiraConfig, user) => {
    const { serviceDeskId, requestTypeId, fieldMappings } = jiraConfig;
    // This function is now async and must be awaited.
    const requestFieldValues = await formatJiraPayload(serviceDeskId, requestTypeId, fieldMappings, user);

    return {
        serviceDeskId,
        requestTypeId,
        requestFieldValues
    };
};

export const getJiraTicket = async (platform, ticketKey) => {
    return await getJiraIssueDetails(ticketKey);
};
