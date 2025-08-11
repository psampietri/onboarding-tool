import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import api from '../../services/api';

const OnboardingInstanceDetail = () => {
    const { instanceId } = useParams();
    const [instance, setInstance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInstanceDetails = async () => {
            try {
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

        fetchInstanceDetails();
    }, [instanceId]);

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
                Onboarding Details for Instance #{instance.id}
            </Typography>
            <Paper sx={{ p: 2, mb: 4 }}>
                <Typography><strong>User ID:</strong> {instance.user_id}</Typography>
                <Typography><strong>Status:</strong> {instance.status}</Typography>
                <Typography><strong>Assigned By ID:</strong> {instance.assigned_by}</Typography>
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
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {instance.tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell>{task.name}</TableCell>
                                <TableCell>{task.task_type}</TableCell>
                                <TableCell>
                                    <Chip label={task.status} color={getStatusChipColor(task.status)} size="small" />
                                </TableCell>
                                <TableCell>{task.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default OnboardingInstanceDetail;
