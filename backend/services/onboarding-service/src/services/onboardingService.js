import * as OnboardingModel from '../models/onboardingModel.js';

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

export const executeAutomatedTask = async (taskId) => {
    // In a real-world scenario, you would fetch task details,
    // use its config to call an external API (e.g., Jira, GitHub),
    // and then update the status based on the API response.

    // For this simulation, we'll just update the status directly.
    console.log(`Executing automated task for task ID: ${taskId}`);
    
    // Simulate the API call process
    await OnboardingModel.updateTaskInstance(taskId, 'in_progress');
    
    // Simulate a delay for the external API call
    await new Promise(resolve => setTimeout(resolve, 2000)); 

    // Simulate a successful completion
    const result = await OnboardingModel.updateTaskInstance(taskId, 'completed', { ticket_id: `AUTO-${Date.now()}` });
    
    return result;
};
