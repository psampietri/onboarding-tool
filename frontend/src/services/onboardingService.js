// frontend/src/services/onboardingService.js
import api from './api';

export const getOnboardingInstances = async () => {
    const response = await api.get('/onboarding/instances');
    return response.data;
};

export const getOnboardingInstanceById = async (instanceId) => {
    const response = await api.get(`/onboarding/instances/${instanceId}`);
    return response.data;
};

export const executeAutomatedTask = async (taskId) => {
    const response = await api.post(`/onboarding/tasks/${taskId}/execute`);
    return response.data;
};

export const dryRunAutomatedTask = async (taskId) => {
    const response = await api.post(`/onboarding/tasks/${taskId}/dry-run`);
    return response.data;
};

export const updateOnboardingInstance = async (instanceId, data) => {
    const response = await api.put(`/onboarding/instances/${instanceId}`, data);
    return response.data;
};

export const deleteOnboardingInstance = async (instanceId) => {
    const response = await api.delete(`/onboarding/instances/${instanceId}`);
    return response.data;
};

export const getOnboardingStatusForUser = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        return []; 
    }
    const response = await api.get(`/onboarding/users/${user.id}/tasks`);
    return response.data;
};

export const updateTaskStatus = async (taskId, status, ticketInfo = null) => {
    const response = await api.put(`/onboarding/tasks/${taskId}`, { status, ticketInfo });
    return response.data;
};

export const associateTicket = async (taskId, issueKey) => {
    const response = await api.post(`/onboarding/tasks/${taskId}/associate`, { issue_key: issueKey });
    return response.data;
};

export const unassignTicket = async (taskId) => {
    const response = await api.post(`/onboarding/tasks/${taskId}/unassign`);
    return response.data;
};