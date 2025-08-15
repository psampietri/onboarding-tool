import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import pinoHttp from 'pino-http';
import logger from '../../utils/logger.js';

const app = express();
const PORT = process.env.PORT || 5010;
const SECRET_KEY = process.env.SECRET_KEY;
const httpLogger = pinoHttp({ logger });

app.use(httpLogger);
app.use(cors());

const services = {
    user: 'http://localhost:5001',
    template: 'http://localhost:5002',
    onboarding: 'http://localhost:5003',
    analytics: 'http://localhost:5004',
    integration: 'http://localhost:5005',
    notification: 'http://localhost:5006',
};

// Enhanced Proxy Logging Handlers
const onProxyReq = (proxyReq, req, res) => {
    const targetService = services[req.context.serviceName];
    req.log.info(`[API Gateway] PROXYING: ${req.method} ${req.originalUrl} -> ${targetService}${proxyReq.path}`);
};

const onProxyRes = (proxyRes, req, res) => {
    req.log.info(`[API Gateway] RESPONSE from ${services[req.context.serviceName]} for ${req.originalUrl} -> STATUS: ${proxyRes.statusCode}`);
};

const onError = (err, req, res) => {
    req.log.error({ err }, `[API Gateway] PROXY ERROR for ${req.originalUrl}`);
    if (!res.headersSent) {
        res.status(504).send('Proxy Timeout or Error');
    }
};

const commonProxyOptions = {
    changeOrigin: true,
    proxyTimeout: 60000,
    onProxyReq,
    onProxyRes,
    onError,
};

// Middleware to attach service context for logging
const setServiceContext = (serviceName) => (req, res, next) => {
    req.context = { serviceName };
    next();
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            req.log.error({ err }, "JWT Verification Error:");
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Apply context middleware before proxying
app.use('/api/auth', setServiceContext('user'), createProxyMiddleware({ ...commonProxyOptions, target: services.user, pathRewrite: { '^/api/auth': '' } }));
app.use('/api/users', authenticateToken, setServiceContext('user'), createProxyMiddleware({ ...commonProxyOptions, target: services.user, pathRewrite: { '^/api/users': '' } }));
app.use('/api/templates', authenticateToken, setServiceContext('template'), createProxyMiddleware({ ...commonProxyOptions, target: services.template, pathRewrite: { '^/api/templates': '' } }));
app.use('/api/onboarding', authenticateToken, setServiceContext('onboarding'), createProxyMiddleware({ ...commonProxyOptions, target: services.onboarding, pathRewrite: { '^/api/onboarding': '' } }));
app.use('/api/analytics', authenticateToken, setServiceContext('analytics'), createProxyMiddleware({ ...commonProxyOptions, target: services.analytics, pathRewrite: { '^/api/analytics': '' } }));
app.use('/api/integrations', authenticateToken, setServiceContext('integration'), createProxyMiddleware({ ...commonProxyOptions, target: services.integration, pathRewrite: { '^/api/integrations': '' } }));
app.use('/api/notifications', authenticateToken, setServiceContext('notification'), createProxyMiddleware({ ...commonProxyOptions, target: services.notification, pathRewrite: { '^/api/notifications': '' } }));
app.use('/api/audit', authenticateToken, setServiceContext('analytics'), createProxyMiddleware({ ...commonProxyOptions, target: services.analytics, pathRewrite: { '^/api/audit': '' } }));

app.listen(PORT, () => {
    logger.info(`API Gateway listening on port ${PORT}`);
});