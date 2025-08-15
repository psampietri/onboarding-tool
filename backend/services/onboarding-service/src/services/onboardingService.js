import axios from 'axios';
import * as OnboardingModel from '../models/onboardingModel.js';
import * as UserService from '../../../user-service/src/services/userService.js';
import logger from '../../../../utils/logger.js';

// This service now communicates with the integration service via HTTP.
const integrationServiceApi = axios.create({
    baseURL: 'http://localhost:5005', // URL of the integration service
});

export const createOnboardingInstance = async (instanceData) => {
    const instance = await OnboardingModel.createOnboardingInstance(instanceData.userId, instanceData.templateId, instanceData.assignedBy);
    logger.info({ instanceId: instance.id, userId: instanceData.userId }, "New onboarding instance created.");
    return instance;
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

    if (status === 'completed') {
        fieldsToUpdate.task_completed_at = new Date().toISOString();
    }
    
    logger.info({ taskId, newStatus: status }, "Updating task status.");
    return await OnboardingModel.updateTaskInstance(taskId, fieldsToUpdate);
};

export const executeAutomatedTask = async (taskId) => {
    logger.info({ taskId }, "Attempting to execute automated task.");
    const task = await OnboardingModel.findTaskInstanceById(taskId);
    if (!task || task.task_type !== 'automated_access_request') {
        logger.warn({ taskId }, "Execution failed: Task is not an automated access request.");
        throw new Error('Task is not an automated access request.');
    }

    const user = await UserService.getUserById(task.user_id);
    
    try {
        // Make an HTTP call to the integration service to create the ticket
        const response = await integrationServiceApi.post('/requests/create', {
            jiraConfig: task.config.jira,
            user: user
        });
        const result = response.data;
        logger.info({ taskId, ticketKey: result.issueKey }, "Successfully created ticket for automated task.");
        
        // After successful ticket creation, update the task status to 'in progress'
        // and save the ticket information.
        const fieldsToUpdate = {
            status: 'in_progress',
            ticket_info: result,
            issue_key: result.issueKey,
            ticket_created_at: new Date().toISOString(),
            task_started_at: new Date().toISOString() // Also mark the task as started
        };
        return await OnboardingModel.updateTaskInstance(taskId, fieldsToUpdate);
    } catch (error) {
        logger.error({ err: error, taskId }, "Error executing automated task.");
        throw new Error('Failed to create Jira ticket. Please check the integration service logs for details.');
    }
};

export const dryRunAutomatedTask = async (taskId) => {
    logger.info({ taskId }, "Performing dry run for automated task.");
    const task = await OnboardingModel.findTaskInstanceById(taskId);
    if (!task || task.task_type !== 'automated_access_request') {
        throw new Error('Task is not an automated access request.');
    }

    const user = await UserService.getUserById(task.user_id);

    // Make an HTTP call to the integration service for the dry run
    const response = await integrationServiceApi.post('/requests/dry-run', {
        jiraConfig: task.config.jira,
        user: user
    });
    
    return response.data;
};

export const updateOnboardingInstance = async (instanceId, data) => {
    logger.info({ instanceId, newStatus: data.status }, "Updating onboarding instance status.");
    return await OnboardingModel.updateOnboardingInstance(instanceId, data);
};

export const deleteOnboardingInstance = async (instanceId) => {
    logger.warn({ instanceId }, "Deleting onboarding instance.");
    return await OnboardingModel.deleteOnboardingInstance(instanceId);
};

export const unassignTicket = async (taskId) => {
    logger.info({ taskId }, "Unassigning ticket from task.");
    const fieldsToUpdate = {
        status: 'not_started',
        ticket_info: null,
        issue_key: null,
        task_started_at: null,
        task_completed_at: null,
        ticket_created_at: null,
        ticket_closed_at: null
    };
    return await OnboardingModel.updateTaskInstance(taskId, fieldsToUpdate);
};