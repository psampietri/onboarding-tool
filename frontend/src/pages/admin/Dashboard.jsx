import React from 'react';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';

const StatCard = ({ title, value, icon }) => (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ mr: 2 }}>{icon}</Box>
        <Box>
            <Typography color="text.secondary">{title}</Typography>
            <Typography variant="h5">{value}</Typography>
        </Box>
    </Paper>
);

const AdminDashboard = () => {
    // Mock data - replace with API calls to the analytics service
    const stats = {
        activeOnboardings: 12,
        avgCompletionDays: 5.2,
        totalUsers: 45,
    };

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Admin Dashboard
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <StatCard title="Active Onboardings" value={stats.activeOnboardings} icon={<AssignmentIcon color="primary" sx={{ fontSize: 40 }} />} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard title="Total Users" value={stats.totalUsers} icon={<PeopleIcon color="secondary" sx={{ fontSize: 40 }} />} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard title="Avg. Completion Time (Days)" value={stats.avgCompletionDays} icon={<BarChartIcon color="success" sx={{ fontSize: 40 }} />} />
                </Grid>
                {/* Add more components here for recent activity, etc. */}
            </Grid>
        </Container>
    );
};

export default AdminDashboard;
