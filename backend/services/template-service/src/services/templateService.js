import * as TemplateModel from '../models/templateModel.js';

export const createOnboardingTemplate = async (templateData) => {
    return await TemplateModel.createOnboardingTemplate(templateData);
};

export const getAllOnboardingTemplates = async () => {
    return await TemplateModel.findAllOnboardingTemplates();
};

export const getOnboardingTemplateById = async (id) => {
    return await TemplateModel.findOnboardingTemplateById(id);
};

export const updateOnboardingTemplate = async (id, templateData) => {
    return await TemplateModel.updateOnboardingTemplate(id, templateData);
};

export const deleteOnboardingTemplate = async (id) => {
    return await TemplateModel.deleteOnboardingTemplate(id);
};

export const createTaskTemplate = async (templateData) => {
    return await TemplateModel.createTaskTemplate(templateData);
};

export const getAllTaskTemplates = async () => {
    return await TemplateModel.findAllTaskTemplates();
};

export const getTaskTemplateById = async (id) => {
    return await TemplateModel.findTaskTemplateById(id);
};

export const updateTaskTemplate = async (id, templateData) => {
    return await TemplateModel.updateTaskTemplate(id, templateData);
};

export const deleteTaskTemplate = async (id) => {
    return await TemplateModel.deleteTaskTemplate(id);
};
