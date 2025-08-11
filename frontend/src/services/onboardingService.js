import api from './api';

export const assignOnboarding = async (userId, templateId, assignedBy) => {
    const response = await api.post('/onboarding/instances', { userId, templateId, assignedBy });
    return response.data;
};

export const getOnboardingStatusForUser = async (userId) => {
    const response = await api.get(`/onboarding/instances/user/${userId}`);
    return response.data;
};

export const updateTaskStatus = async (taskId, status, ticketInfo = {}) => {
    const response = await api.put(`/onboarding/tasks/${taskId}`, { status, ticketInfo });
    return response.data;
};

export const executeAutomatedTask = async (taskId) => {
    const response = await api.post(`/onboarding/tasks/${taskId}/execute`);
    return response.data;
};
