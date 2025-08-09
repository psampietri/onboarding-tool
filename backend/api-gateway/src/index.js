import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const app = express();
const PORT = 5010;
const SECRET_KEY = process.env.SECRET_KEY;

app.use(cors());

// The gateway's job is to proxy, not parse the body.
// We remove the express.json() middleware here and let the
// downstream services handle the body parsing.

const services = {
    user: 'http://localhost:5001',
    template: 'http://localhost:5002',
    onboarding: 'http://localhost:5003',
    analytics: 'http://localhost:5004',
};

// Common proxy options
const commonProxyOptions = {
    changeOrigin: true, // Recommended for robust proxying
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Public route for authentication
app.use('/api/auth', createProxyMiddleware({ ...commonProxyOptions, target: services.user, pathRewrite: { '^/api/auth': '' } }));

// Protected routes
app.use('/api/users', authenticateToken, createProxyMiddleware({ ...commonProxyOptions, target: services.user, pathRewrite: { '^/api/users': '/users' } }));
app.use('/api/templates', authenticateToken, createProxyMiddleware({ ...commonProxyOptions, target: services.template, pathRewrite: { '^/api/templates': '' } }));
app.use('/api/onboarding', authenticateToken, createProxyMiddleware({ ...commonProxyOptions, target: services.onboarding, pathRewrite: { '^/api/onboarding': '' } }));
app.use('/api/analytics', authenticateToken, createProxyMiddleware({ ...commonProxyOptions, target: services.analytics, pathRewrite: { '^/api/analytics': '' } }));

app.listen(PORT, () => {
    console.log(`API Gateway listening on port ${PORT}`);
});
