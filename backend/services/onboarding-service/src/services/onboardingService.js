// backend/services/onboarding-service/src/services/onboardingService.js
import * as OnboardingModel from '../models/onboardingModel.js';
import * as IntegrationService from '../../../integration-service/src/services/integrationService.js';
import * as UserService from '../../../user-service/src/services/userService.js';

export const createOnboardingInstance = async (instanceData) => {
    return await OnboardingModel.createOnboardingInstance(instanceData.userId, instanceData.templateId, instanceData.assignedBy);
};

export const getAllOnboardingInstances = async () => {
    return await OnboardingModel.findAllOnboardingInstances();
};

export const getOnboardingInstanceById = async (id) => {
    return await OnboardingModel.findOnboardingInstanceById(id);
};

export const getTasksByUserId = async (userId) => {
    return await OnboardingModel.findTasksByUserId(userId);
};

export const updateTaskStatus = async (taskId, { status, ticketInfo, ticket_created_at, ticket_closed_at }) => {
    const currentTask = await OnboardingModel.findTaskInstanceById(taskId);
    if (!currentTask) {
        throw new Error("Task not found");
    }

    const fieldsToUpdate = { status };

    // Set task_started_at only when moving to 'in_progress' for the first time
    if (status === 'in_progress' && !currentTask.task_started_at) {
        fieldsToUpdate.task_started_at = new Date().toISOString();
    }

    if (ticketInfo !== undefined) {
        fieldsToUpdate.ticket_info = ticketInfo;
    }
    
    if (ticket_created_at) {
        fieldsToUpdate.ticket_created_at = ticket_created_at;
    }
    if (ticket_closed_at) {
        fieldsToUpdate.ticket_closed_at = ticket_closed_at;
    }

    // Set task_completed_at if status is 'completed'
    if (status === 'completed') {
        fieldsToUpdate.task_completed_at = new Date().toISOString();
    }
    
    return await OnboardingModel.updateTaskInstance(taskId, fieldsToUpdate);
};

export const executeAutomatedTask = async (taskId) => {
    const task = await OnboardingModel.findTaskInstanceById(taskId);
    if (!task || task.task_type !== 'automated_access_request') {
        throw new Error('Task is not an automated access request.');
    }

    const startTime = new Date().toISOString();
    await OnboardingModel.updateTaskInstance(taskId, { ticket_created_at: startTime, task_started_at: startTime, status: 'in_progress' });

    const user = await UserService.getUserById(task.user_id);
    const result = await IntegrationService.createJiraTicket(task.config.jira, user);
    
    const completionTime = new Date().toISOString();
    const fieldsToUpdate = {
        status: 'completed',
        ticket_info: result,
        task_completed_at: completionTime,
        ticket_closed_at: completionTime
    };
    return await OnboardingModel.updateTaskInstance(taskId, fieldsToUpdate);
};

export const dryRunAutomatedTask = async (taskId) => {
    const task = await OnboardingModel.findTaskInstanceById(taskId);
    if (!task || task.task_type !== 'automated_access_request') {
        throw new Error('Task is not an automated access request.');
    }

    const user = await UserService.getUserById(task.user_id);
    const payload = IntegrationService.prepareJiraTicketPayload(task.config.jira, user);

    return {
        message: "This is a dry run. The following payload would be sent to Jira.",
        payload: payload
    };
};

export const updateOnboardingInstance = async (instanceId, data) => {
    return await OnboardingModel.updateOnboardingInstance(instanceId, data);
};

export const deleteOnboardingInstance = async (instanceId) => {
    return await OnboardingModel.deleteOnboardingInstance(instanceId);
};
