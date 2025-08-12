// frontend/src/pages/admin/OnboardingInstanceDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
    FormControl, Select, MenuItem, Button, Tooltip, Grid, Card, CardContent,
    LinearProgress, Stack, Divider, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import IconButton from '@mui/material/IconButton';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import api from '../../services/api';
import { executeAutomatedTask } from '../../services/onboardingService';

const OnboardingInstanceDetail = () => {
    const { instanceId } = useParams();
    const [instance, setInstance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [taskLoading, setTaskLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('table'); // 'table', 'timeline', 'kanban'

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

    useEffect(() => {
        fetchInstanceDetails();
    }, [instanceId]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.put(`/onboarding/tasks/${taskId}`, { status: newStatus });
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
            fetchInstanceDetails();
        } catch (err) {
            setError('Failed to execute automated task.');
            console.error(err);
        } finally {
            setTaskLoading(null);
        }
    };

    // Memoize the calculation of blocked tasks
    const blockedTasks = useMemo(() => {
        if (!instance?.tasks) return new Set();
        
        const completedTaskIds = new Set(
            instance.tasks.filter(t => t.status === 'completed').map(t => t.task_template_id)
        );
        
        const blocked = new Set();
        instance.tasks.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
                const isBlocked = !task.dependencies.every(depId => completedTaskIds.has(depId));
                if (isBlocked) {
                    blocked.add(task.id);
                }
            }
        });
        return blocked;
    }, [instance]);

    // Calculate overall progress
    const progress = useMemo(() => {
        if (!instance?.tasks || instance.tasks.length === 0) return 0;
        const completed = instance.tasks.filter(task => task.status === 'completed').length;
        return (completed / instance.tasks.length) * 100;
    }, [instance]);

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        if (!instance?.tasks) return {};
        return instance.tasks.reduce((acc, task) => {
            if (!acc[task.status]) acc[task.status] = [];
            acc[task.status].push(task);
            return acc;
        }, {});
    }, [instance]);

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'in_progress': return 'warning';
            case 'blocked': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon color="success" />;
            case 'in_progress': return <AccessTimeIcon color="warning" />;
            case 'blocked': return <ErrorIcon color="error" />;
            default: return <HourglassEmptyIcon color="disabled" />;
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
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                    Onboarding Details for {instance.user_name}
                </Typography>
                
                <Grid container spacing={3}>
                    {/* Summary Card */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Onboarding Summary</Typography>
                            <Typography><strong>User:</strong> {instance.user_name}</Typography>
                            <Typography><strong>Status:</strong> {instance.status}</Typography>
                            <Typography><strong>Assigned By:</strong> {instance.admin_name}</Typography>
                            <Typography><strong>Start Date:</strong> {new Date(instance.created_at).toLocaleString()}</Typography>
                            
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" gutterBottom>Overall Progress</Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={progress} 
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                                <Typography variant="caption" align="right" display="block" sx={{ mt: 0.5 }}>
                                    {Math.round(progress)}% Complete
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                    
                    {/* Stats Card */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Task Statistics</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                                        <CardContent>
                                            <Typography variant="h5">{tasksByStatus.completed?.length || 0}</Typography>
                                            <Typography variant="body2">Completed Tasks</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6}>
                                    <Card variant="outlined" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                                        <CardContent>
                                            <Typography variant="h5">{tasksByStatus.in_progress?.length || 0}</Typography>
                                            <Typography variant="body2">In Progress</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6}>
                                    <Card variant="outlined" sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                                        <CardContent>
                                            <Typography variant="h5">{tasksByStatus.blocked?.length || 0}</Typography>
                                            <Typography variant="body2">Blocked</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="h5">{tasksByStatus.not_started?.length || 0}</Typography>
                                            <Typography variant="body2">Not Started</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
            
            {/* View selector buttons */}
            <Paper sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', p: 1 }}>
                    <Button 
                        variant={activeTab === 'table' ? 'contained' : 'text'} 
                        onClick={() => setActiveTab('table')}
                        sx={{ mx: 1 }}
                    >
                        Table View
                    </Button>
                    <Button 
                        variant={activeTab === 'timeline' ? 'contained' : 'text'} 
                        onClick={() => setActiveTab('timeline')}
                        sx={{ mx: 1 }}
                    >
                        Timeline View
                    </Button>
                    <Button 
                        variant={activeTab === 'kanban' ? 'contained' : 'text'} 
                        onClick={() => setActiveTab('kanban')}
                        sx={{ mx: 1 }}
                    >
                        Kanban View
                    </Button>
                </Box>
            </Paper>
            
            {/* Table View */}
            {activeTab === 'table' && (
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
                            {instance.tasks.map((task) => {
                                const isBlocked = blockedTasks.has(task.id);
                                return (
                                    <TableRow key={task.id} sx={{ opacity: isBlocked ? 0.6 : 1 }}>
                                        <TableCell>{task.name}</TableCell>
                                        <TableCell>{task.task_type}</TableCell>
                                        <TableCell>
                                            <FormControl size="small" sx={{ minWidth: 120 }} disabled={isBlocked}>
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
                                            {isBlocked && (
                                                <Tooltip title="This task is blocked by one or more incomplete dependencies.">
                                                    <IconButton><LockIcon /></IconButton>
                                                </Tooltip>
                                            )}
                                            {task.task_type === 'automated_access_request' && task.status === 'not_started' && !isBlocked && (
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
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            
            {/* Timeline View */}
            {activeTab === 'timeline' && (
                <Paper sx={{ p: 2 }}>
                    <Timeline position="alternate">
                        {instance.tasks.map((task) => {
                            const isBlocked = blockedTasks.has(task.id);
                            let dotColor;
                            switch(task.status) {
                                case 'completed': dotColor = 'success'; break;
                                case 'in_progress': dotColor = 'warning'; break;
                                case 'blocked': dotColor = 'error'; break;
                                default: dotColor = 'grey';
                            }
                            
                            return (
                                <TimelineItem key={task.id}>
                                    <TimelineSeparator>
                                        <TimelineDot color={dotColor}>
                                            {getStatusIcon(task.status)}
                                        </TimelineDot>
                                        <TimelineConnector />
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Paper elevation={3} sx={{ p: 2, opacity: isBlocked ? 0.6 : 1 }}>
                                            <Typography variant="h6" component="div">
                                                {task.name}
                                            </Typography>
                                            <Typography color="textSecondary" variant="body2">
                                                {task.task_type}
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Chip 
                                                    label={task.status} 
                                                    color={getStatusChipColor(task.status)} 
                                                    size="small"
                                                    sx={{ mr: 1 }}
                                                />
                                                {task.task_type === 'automated_access_request' && task.status === 'not_started' && !isBlocked && (
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => handleExecuteTask(task.id)}
                                                        disabled={taskLoading === task.id}
                                                    >
                                                        {taskLoading === task.id ? <CircularProgress size={20} /> : 'Run Automation'}
                                                    </Button>
                                                )}
                                            </Box>
                                        </Paper>
                                    </TimelineContent>
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                </Paper>
            )}
            
            {/* Kanban View */}
            {activeTab === 'kanban' && (
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Not Started</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <List>
                                {(tasksByStatus.not_started || []).map(task => {
                                    const isBlocked = blockedTasks.has(task.id);
                                    return (
                                        <ListItem
                                            key={task.id}
                                            component={Paper}
                                            sx={{ mb: 1, opacity: isBlocked ? 0.6 : 1 }}
                                        >
                                            <ListItemIcon>
                                                {isBlocked ? <LockIcon color="error" /> : getStatusIcon(task.status)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={task.name}
                                                secondary={task.task_type}
                                            />
                                            {task.task_type === 'automated_access_request' && !isBlocked && (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => handleExecuteTask(task.id)}
                                                    disabled={taskLoading === task.id}
                                                >
                                                    {taskLoading === task.id ? <CircularProgress size={20} /> : 'Run'}
                                                </Button>
                                            )}
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: '#fff9c4', height: '100%' }}>
                            <Typography variant="h6" gutterBottom>In Progress</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <List>
                                {(tasksByStatus.in_progress || []).map(task => (
                                    <ListItem
                                        key={task.id}
                                        component={Paper}
                                        sx={{ mb: 1 }}
                                    >
                                        <ListItemIcon>
                                            {getStatusIcon(task.status)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={task.name}
                                            secondary={task.task_type}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: '#e8f5e9', height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Completed</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <List>
                                {(tasksByStatus.completed || []).map(task => (
                                    <ListItem
                                        key={task.id}
                                        component={Paper}
                                        sx={{ mb: 1 }}
                                    >
                                        <ListItemIcon>
                                            {getStatusIcon(task.status)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={task.name}
                                            secondary={task.task_type}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: '#ffebee', height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Blocked</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <List>
                                {(tasksByStatus.blocked || []).map(task => (
                                    <ListItem
                                        key={task.id}
                                        component={Paper}
                                        sx={{ mb: 1 }}
                                    >
                                        <ListItemIcon>
                                            {getStatusIcon(task.status)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={task.name}
                                            secondary={task.task_type}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Container>
    );
};

export default OnboardingInstanceDetail;