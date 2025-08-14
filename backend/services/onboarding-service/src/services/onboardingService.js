// psampietri/onboarding-tool/onboarding-tool-c4425792da692bb2c6dbce1b97f9a5d699b36ad9/backend/services/onboarding-service/src/services/onboardingService.js
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

export const updateTaskStatus = async (taskId, { status, ticketInfo }) => {
    return await OnboardingModel.updateTaskInstance(taskId, status, ticketInfo);
};

export const executeAutomatedTask = async (taskId) => {
    const task = await OnboardingModel.findTaskInstanceById(taskId);
    if (!task || task.task_type !== 'automated_access_request') {
        throw new Error('Task is not an automated access request.');
    }

    const user = await UserService.getUserById(task.user_id);
    const result = await IntegrationService.createJiraTicket(task.config.jira, user);
    
    // Update task with ticket info and set as completed
    return await OnboardingModel.updateTaskInstance(taskId, 'completed', result);
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