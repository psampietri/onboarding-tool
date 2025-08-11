import fetch from 'node-fetch';
import * as OnboardingModel from '../models/onboardingModel.js';

// Helper function to get user details from the user-service
const getUserDetails = async (userId, token) => {
    // This assumes the user-service is running on port 5001
    const response = await fetch(`http://localhost:5001/users/${userId}`, {
        headers: { 'Authorization': token }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch user details from user-service');
    }
    return response.json();
};

export const assignOnboarding = async (userId, templateId, assignedBy) => {
    return await OnboardingModel.createOnboardingInstance(userId, templateId, assignedBy);
};

export const getAllOnboardingInstances = async () => {
    return await OnboardingModel.findAllOnboardingInstances();
};

export const getOnboardingInstanceById = async (id) => {
    return await OnboardingModel.findOnboardingInstanceById(id);
};

export const getOnboardingStatusForUser = async (userId) => {
    return await OnboardingModel.findTasksByUserId(userId);
};

export const updateTaskStatus = async (taskId, status, ticketInfo) => {
    return await OnboardingModel.updateTaskInstance(taskId, status, ticketInfo);
};

export const executeAutomatedTask = async (taskId, authToken) => {
    console.log(`Executing automated task for task ID: ${taskId}`);
    
    // 1. Get task details, including config and user ID
    const taskInstance = await OnboardingModel.findTaskInstanceById(taskId);
    
    // Determine the platform from the config object's key (e.g., "jira")
    const platform = Object.keys(taskInstance.config)[0];
    if (!platform || !taskInstance.config[platform]) {
        throw new Error('Task is not a valid automated task or is misconfigured.');
    }

    // 2. Get the full user profile, passing the auth token
    const user = await getUserDetails(taskInstance.user_id, authToken);

    // 3. Map user data to the form fields
    const { serviceDeskId, requestTypeId, fieldMappings, configKey } = taskInstance.config[platform];
    const requestFieldValues = {};
    for (const platformFieldId in fieldMappings) {
        const userFieldKey = fieldMappings[platformFieldId];
        if (user[userFieldKey]) {
            requestFieldValues[platformFieldId] = user[userFieldKey];
        }
    }

    // 4. Call the integration-service dynamically
    const integrationServiceUrl = `http://localhost:5005/${platform}/requests`;
    const response = await fetch(integrationServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            configKey,
            serviceDeskId,
            requestTypeId,
            requestFieldValues
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Integration service failed: ${errorBody}`);
    }

    const ticket = await response.json();

    // 5. Update the task instance with the new status and ticket info
    const result = await OnboardingModel.updateTaskInstance(taskId, 'completed', { 
        ticketId: ticket.issueId,
        ticketKey: ticket.issueKey,
        ticketUrl: ticket._links.web,
    });
    
    return result;
};
