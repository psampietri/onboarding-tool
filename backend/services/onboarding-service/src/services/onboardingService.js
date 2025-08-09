import * as OnboardingModel from '../models/onboardingModel.js';

export const assignOnboarding = async (userId, templateId, assignedBy) => {
    return await OnboardingModel.createOnboardingInstance(userId, templateId, assignedBy);
};

export const getOnboardingStatusForUser = async (userId) => {
    return await OnboardingModel.findTasksByUserId(userId);
};

export const updateTaskStatus = async (taskId, status, ticketInfo) => {
    return await OnboardingModel.updateTaskInstance(taskId, status, ticketInfo);
};
