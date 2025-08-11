import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Card, CardContent, List, ListItem, ListItemText,
    Checkbox, CircularProgress, Box, Alert
} from '@mui/material';
import { getOnboardingStatusForUser, updateTaskStatus } from '../../services/onboardingService';

const UserDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (!currentUser) {
                    setError('User not found. Please log in again.');
                    setLoading(false);
                    return;
                }
                const userTasks = await getOnboardingStatusForUser(currentUser.id);
                setTasks(userTasks);
            } catch (err) {
                setError('Failed to load onboarding tasks.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const handleTaskToggle = async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
        try {
            await updateTaskStatus(taskId, newStatus);
            setTasks(tasks.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
            ));
        } catch (err) {
            console.error('Failed to update task status:', err);
            setError('Could not update task status.');
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Your Onboarding Progress
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Card>
                <CardContent>
                    {tasks.length > 0 ? (
                        <List>
                            {tasks.map((task) => (
                                <ListItem key={task.id} dense>
                                    <Checkbox
                                        edge="start"
                                        checked={task.status === 'completed'}
                                        onChange={() => handleTaskToggle(task.id, task.status)}
                                        // Only allow users to check off manual tasks
                                        disabled={task.task_type !== 'manual'}
                                    />
                                    <ListItemText 
                                        primary={task.name} 
                                        secondary={`${task.description} [Status: ${task.status}]`} 
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography>You have no pending onboarding tasks.</Typography>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};

export default UserDashboard;
