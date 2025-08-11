import api from './api';

// Fetches available service desks from a platform
export const getServiceDesks = async (platform, configKey) => {
    // Use the new /integrations base path
    const response = await api.get(`/integrations/${platform}/servicedesks`, { params: { configKey } });
    return response.data;
};

// Fetches request types for a specific service desk
export const getRequestTypes = async (platform, configKey, serviceDeskId) => {
    const response = await api.get(`/integrations/${platform}/servicedesks/${serviceDeskId}/requesttypes`, { params: { configKey } });
    return response.data;
};

// Fetches the fields for a specific request type
export const getRequestTypeFields = async (platform, configKey, serviceDeskId, requestTypeId) => {
    const response = await api.get(`/integrations/${platform}/servicedesks/${serviceDeskId}/requesttypes/${requestTypeId}/fields`, { params: { configKey } });
    return response.data;
};
