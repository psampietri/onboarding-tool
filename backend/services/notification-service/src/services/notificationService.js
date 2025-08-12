import nodemailer from 'nodemailer';
import * as NotificationModel from '../models/notificationModel.js';

// Configure nodemailer (for a real implementation, use environment variables)
let transporter;
try {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || 'user@example.com',
            pass: process.env.SMTP_PASSWORD || 'password'
        }
    });
} catch (error) {
    console.error('Error configuring email transport:', error);
}

// Create an in-app notification
export const createNotification = async (userId, title, message, type, relatedEntityType = null, relatedEntityId = null) => {
    return await NotificationModel.createNotification(userId, title, message, type, relatedEntityType, relatedEntityId);
};

// Get user notifications
export const getUserNotifications = async (userId, limit = 20, offset = 0) => {
    return await NotificationModel.getUserNotifications(userId, limit, offset);
};

// Get count of unread notifications
export const getUserUnreadCount = async (userId) => {
    return await NotificationModel.getUserUnreadCount(userId);
};

// Mark notification as read
export const markAsRead = async (notificationId, userId) => {
    return await NotificationModel.markAsRead(notificationId, userId);
};

// Mark all notifications as read
export const markAllAsRead = async (userId) => {
    return await NotificationModel.markAllAsRead(userId);
};

// Delete notification
export const deleteNotification = async (notificationId, userId) => {
    return await NotificationModel.deleteNotification(notificationId, userId);
};

// Send an email notification
export const sendEmailNotification = async (to, subject, html, cc = [], bcc = []) => {
    if (!transporter) {
        console.error('Email transport not configured.');
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Access Request System" <no-reply@example.com>',
            to: Array.isArray(to) ? to.join(',') : to,
            cc: Array.isArray(cc) ? cc.join(',') : cc,
            bcc: Array.isArray(bcc) ? bcc.join(',') : bcc,
            subject,
            html
        });
        
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Send notification with template
export const sendTemplatedEmail = async (templateId, userData, recipientEmail) => {
    try {
        // Get the email template
        const template = await NotificationModel.getEmailTemplateById(templateId);
        if (!template) {
            throw new Error(`Email template not found: ${templateId}`);
        }
        
        // Replace placeholders in the template
        let subject = template.subject;
        let html = template.body_template;
        
        // Replace all {{placeholder}} with actual values from userData
        Object.keys(userData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, userData[key]);
            html = html.replace(regex, userData[key]);
        });
        
        // Send the email
        return await sendEmailNotification(recipientEmail, subject, html);
    } catch (error) {
        console.error('Error sending templated email:', error);
        return false;
    }
};

// Email template management
export const createEmailTemplate = async (name, subject, bodyTemplate, createdBy) => {
    return await NotificationModel.createEmailTemplate(name, subject, bodyTemplate, createdBy);
};

export const getAllEmailTemplates = async () => {
    return await NotificationModel.getAllEmailTemplates();
};

export const getEmailTemplateById = async (id) => {
    return await NotificationModel.getEmailTemplateById(id);
};

export const updateEmailTemplate = async (id, name, subject, bodyTemplate) => {
    return await NotificationModel.updateEmailTemplate(id, name, subject, bodyTemplate);
};

export const deleteEmailTemplate = async (id) => {
    return await NotificationModel.deleteEmailTemplate(id);
};