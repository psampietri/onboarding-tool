import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
    FormControl, Select, MenuItem, Button
} from '@mui/material';
import api from '../../services/api';
import { executeAutomatedTask } from '../../services/onboardingService';

const OnboardingInstanceDetail = () => {
    const { instanceId } = useParams();
    const [instance, setInstance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [taskLoading, setTaskLoading] = useState(null); // To show loading on a specific task

    const fetchInstanceDetails = async () => {
        try {
            // Keep the main loader on for full refresh
            setLoading(true);
            const response = await api.get(`/onboarding/instances/${instanceId}`);
            setInstance(response.data);
        } catch (err) {
            setError('Failed to fetch onboarding instance details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstanceDetails();
    }, [instanceId]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.put(`/onboarding/tasks/${taskId}`, { status: newStatus });
            // Refresh the details after updating
            fetchInstanceDetails();
        } catch (err) {
            setError('Failed to update task status.');
            console.error(err);
        }
    };

    const handleExecuteTask = async (taskId) => {
        setTaskLoading(taskId);
        setError('');
        try {
            await executeAutomatedTask(taskId);
            fetchInstanceDetails(); // Refresh details after execution
        } catch (err) {
            setError('Failed to execute automated task.');
            console.error(err);
        } finally {
            setTaskLoading(null);
        }
    };

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'in_progress':
                return 'warning';
            case 'blocked':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!instance) {
        return <Typography>Onboarding instance not found.</Typography>;
    }

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 2 }}>
                Onboarding Details for {instance.user_name}
            </Typography>
            <Paper sx={{ p: 2, mb: 4 }}>
                <Typography><strong>User:</strong> {instance.user_name}</Typography>
                <Typography><strong>Status:</strong> {instance.status}</Typography>
                <Typography><strong>Assigned By:</strong> {instance.admin_name}</Typography>
                <Typography><strong>Start Date:</strong> {new Date(instance.created_at).toLocaleString()}</Typography>
            </Paper>

            <Typography variant="h5" sx={{ mb: 2 }}>
                Tasks
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Task Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {instance.tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell>{task.name}</TableCell>
                                <TableCell>{task.task_type}</TableCell>
                                <TableCell>
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <Select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                            renderValue={(selected) => (
                                                <Chip label={selected} color={getStatusChipColor(selected)} size="small" />
                                            )}
                                        >
                                            <MenuItem value="not_started">Not Started</MenuItem>
                                            <MenuItem value="in_progress">In Progress</MenuItem>
                                            <MenuItem value="completed">Completed</MenuItem>
                                            <MenuItem value="blocked">Blocked</MenuItem>
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell>
                                    {task.task_type === 'automated_access_request' && task.status === 'not_started' && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => handleExecuteTask(task.id)}
                                            disabled={taskLoading === task.id}
                                        >
                                            {taskLoading === task.id ? <CircularProgress size={20} /> : 'Run Automation'}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default OnboardingInstanceDetail;
