import React, { useState, useEffect } from 'react';
import {
    Container, Typography, CircularProgress, Box, Alert
} from '@mui/material';
import api from '../../services/api';
import OnboardingTemplatesTable from '../../components/OnboardingTemplatesTable';
import TaskTemplatesTable from '../../components/TaskTemplatesTable';

const ManageTemplates = () => {
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const fetchTaskTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/templates/tasks');
            setTaskTemplates(response.data);
        } catch (error) {
            setError("Failed to fetch task templates.");
            console.error("Failed to fetch task templates for parent", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaskTemplates();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Manage Templates
            </Typography>
            <OnboardingTemplatesTable taskTemplates={taskTemplates} />
            <TaskTemplatesTable
                taskTemplates={taskTemplates}
                setTaskTemplates={setTaskTemplates}
                fetchTaskTemplates={fetchTaskTemplates}
            />
        </Container>
    );
};

export default ManageTemplates;