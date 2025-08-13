import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
    FormControl, Select, MenuItem, Button, Tooltip, Grid, Card, CardContent,
    LinearProgress, Stack, Divider, List, ListItem, ListItemText, ListItemIcon,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputLabel, Modal, Link, TextField
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import api from '../../services/api';
import { executeAutomatedTask, dryRunAutomatedTask, updateOnboardingInstance, deleteOnboardingInstance, updateTaskStatus } from '../../services/onboardingService';
import { getTicketDetails } from '../../services/integrationService';


const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const OnboardingInstanceDetail = () => {
    const { instanceId } = useParams();
    const navigate = useNavigate();
    const [instance, setInstance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [taskLoading, setTaskLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('table'); // 'table', 'timeline', 'kanban', 'tree'
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dryRunModalOpen, setDryRunModalOpen] = useState(false);
    const [dryRunResult, setDryRunResult] = useState(null);
    const [taskTree, setTaskTree] = useState([]);
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [selectedTaskForTicket, setSelectedTaskForTicket] = useState(null);
    const [liveTicketDetails, setLiveTicketDetails] = useState(null);
    const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
    const [manualTicketInfo, setManualTicketInfo] = useState({ key: '', self: '' });
    const [isManualTicketEntry, setIsManualTicketEntry] = useState(false);

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

    useEffect(() => {
        if (instance?.tasks) {
            const buildTaskTree = (tasks) => {
                const tasksMap = new Map(tasks.map(task => [task.task_template_id, task]));
                const adjacencyList = new Map();

                tasks.forEach(task => {
                    if (task.dependencies && task.dependencies.length > 0) {
                        task.dependencies.forEach(depId => {
                            if (!adjacencyList.has(depId)) {
                                adjacencyList.set(depId, []);
                            }
                            adjacencyList.get(depId).push(task.task_template_id);
                        });
                    }
                });

                const buildNode = (taskId) => {
                    const taskData = tasksMap.get(taskId);
                    const childrenIds = adjacencyList.get(taskId) || [];
                    return {
                        ...taskData,
                        children: childrenIds.map(childId => buildNode(childId))
                    };
                };

                const rootTasks = tasks.filter(task => !task.dependencies || task.dependencies.length === 0);
                return rootTasks.map(task => buildNode(task.task_template_id));
            };
            setTaskTree(buildTaskTree(instance.tasks));
        }
    }, [instance]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.put(`/onboarding/tasks/${taskId}`, { status: newStatus });
            fetchInstanceDetails();
        } catch (err) {
            setError('Failed to update task status.');
            console.error(err);
        }
    };

    const handleInstanceStatusChange = async (e) => {
        const newStatus = e.target.value;
        try {
            await updateOnboardingInstance(instanceId, { status: newStatus });
            setInstance(prev => ({ ...prev, status: newStatus }));
        } catch (err) {
            setError('Failed to update instance status.');
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

    const handleDryRun = async (taskId) => {
        setTaskLoading(taskId);
        setError('');
        try {
            const result = await dryRunAutomatedTask(taskId);
            setDryRunResult(result);
            setDryRunModalOpen(true);
        } catch (err) {
            setError('Failed to perform dry run.');
            console.error(err);
        } finally {
            setTaskLoading(null);
        }
    };

    const handleOpenDeleteDialog = () => {
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        try {
            await deleteOnboardingInstance(instanceId);
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Failed to delete onboarding instance.');
            console.error(err);
        }
    };

    const blockedTasks = useMemo(() => {
        if (!instance?.tasks) return new Map();
        
        const tasksMap = new Map(instance.tasks.map(t => [t.task_template_id, t]));
        const completedTaskIds = new Set(
            instance.tasks.filter(t => t.status === 'completed').map(t => t.task_template_id)
        );
        
        const blocked = new Map();
        instance.tasks.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
                const blockers = task.dependencies
                    .filter(depId => !completedTaskIds.has(depId))
                    .map(depId => tasksMap.get(depId)?.name || `Task ID ${depId}`);

                if (blockers.length > 0) {
                    blocked.set(task.id, blockers);
                }
            }
        });
        return blocked;
    }, [instance]);

    const handleOpenTicketModal = async (task) => {
        setSelectedTaskForTicket(task);
        setLiveTicketDetails(null);
        setTicketDetailsLoading(false);
        setManualTicketInfo(task.ticket_info || { key: '', self: '' });
        
        const isAutomated = task.task_type === 'automated_access_request';
        const hasTicket = task.ticket_info && task.ticket_info.key;

        // Default to manual entry if not automated, or if automated but no ticket exists yet
        setIsManualTicketEntry(!isAutomated || (isAutomated && !hasTicket));

        if (isAutomated && hasTicket) {
            setTicketDetailsLoading(true);
            try {
                const details = await getTicketDetails('jira', task.ticket_info.key);
                setLiveTicketDetails(details);
            } catch (err) {
                console.error("Failed to fetch live ticket details", err);
                setError("Failed to fetch live ticket details from Jira.");
            } finally {
                setTicketDetailsLoading(false);
            }
        }
        setTicketModalOpen(true);
    };

    const handleSaveTicketInfo = async () => {
        try {
            const ticketInfoToSave = {
                ...manualTicketInfo,
                self: manualTicketInfo.key ? `${process.env.JIRA_BASE_URL}/browse/${manualTicketInfo.key}` : manualTicketInfo.self
            };
            await updateTaskStatus(selectedTaskForTicket.id, selectedTaskForTicket.status, ticketInfoToSave);
            fetchInstanceDetails();
            setTicketModalOpen(false);
        } catch (err) {
            setError("Failed to save ticket information.");
        }
    };

    const handleRemoveTicketInfo = async () => {
        try {
            await updateTaskStatus(selectedTaskForTicket.id, selectedTaskForTicket.status, null);
            fetchInstanceDetails();
            setTicketModalOpen(false);
        } catch (err) {
            setError("Failed to remove ticket information.");
        }
    };


    const progress = useMemo(() => {
        if (!instance?.tasks || instance.tasks.length === 0) return 0;
        const completed = instance.tasks.filter(task => task.status === 'completed').length;
        return (completed / instance.tasks.length) * 100;
    }, [instance]);

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

    const renderTree = (nodes, prefix = 'root') => (
        nodes.map((node, index) => {
            const nodeId = `${prefix}-${node.id}-${index}`;
            return (
                <TreeItem 
                    key={nodeId}
                    nodeId={nodeId}
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
                            {getStatusIcon(node.status)}
                            <Typography sx={{ ml: 1, flexGrow: 1 }}>{node.name}</Typography>
                            <Chip label={node.status} color={getStatusChipColor(node.status)} size="small" />
                        </Box>
                    }
                >
                    {Array.isArray(node.children) && node.children.length > 0
                        ? renderTree(node.children, nodeId)
                        : null}
                </TreeItem>
            );
        })
    );

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
                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={instance.status}
                                    label="Status"
                                    onChange={handleInstanceStatusChange}
                                >
                                    <MenuItem value="not_started">Not Started</MenuItem>
                                    <MenuItem value="in_progress">In Progress</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                </Select>
                            </FormControl>
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
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button color="error" onClick={handleOpenDeleteDialog}>Delete Instance</Button>
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
                                            <Typography variant="h5">{blockedTasks.size || 0}</Typography>
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
                        disabled // Timeline view is currently disabled
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
                    <Button 
                        variant={activeTab === 'tree' ? 'contained' : 'text'} 
                        onClick={() => setActiveTab('tree')}
                        sx={{ mx: 1 }}
                    >
                        Tree View
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
                                const blockers = blockedTasks.get(task.id);
                                return (
                                    <TableRow key={task.id} sx={{ opacity: isBlocked ? 0.6 : 1 }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {task.name}
                                                {task.instructions && (
                                                    <Tooltip title={task.instructions}>
                                                        <IconButton size="small" sx={{ ml: 1 }}>
                                                            <InfoOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                            {task.ticket_info?.key && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Ticket: <Link href={task.ticket_info.self} target="_blank" rel="noopener noreferrer">{task.ticket_info.key}</Link>
                                                </Typography>
                                            )}
                                        </TableCell>
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
                                                <Tooltip title={`Blocked by: ${blockers.join(', ')}`}>
                                                    <IconButton><LockIcon /></IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="View Ticket">
                                                <IconButton onClick={() => handleOpenTicketModal(task)}><ConfirmationNumberIcon /></IconButton>
                                            </Tooltip>
                                            {task.task_type === 'automated_access_request' && task.status === 'not_started' && !isBlocked && (
                                                <>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => handleDryRun(task.id)}
                                                        disabled={taskLoading === task.id}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        Dry Run
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => handleExecuteTask(task.id)}
                                                        disabled={taskLoading === task.id}
                                                    >
                                                        {taskLoading === task.id ? <CircularProgress size={20} /> : 'Run'}
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            
            {/* Kanban View */}
            {activeTab === 'kanban' && (
                <Grid container spacing={2}>
                    {['not_started', 'in_progress', 'completed', 'blocked'].map(status => (
                        <Grid item xs={12} sm={6} md={3} key={status}>
                            <Paper sx={{ p: 2, bgcolor: `${getStatusChipColor(status)}.lightest`, height: '100%' }}>
                                <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <List>
                                    {(tasksByStatus[status] || []).map(task => {
                                        const isBlocked = blockedTasks.has(task.id);
                                        return (
                                            <ListItem
                                                key={task.id}
                                                component={Paper}
                                                sx={{ mb: 1, opacity: isBlocked && status !== 'blocked' ? 0.6 : 1 }}
                                            >
                                                <ListItemIcon>
                                                    {isBlocked && status !== 'blocked' ? <LockIcon color="error" /> : getStatusIcon(task.status)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={task.name}
                                                    secondary={task.task_type}
                                                />
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Tree View */}
            {activeTab === 'tree' && (
                <Paper sx={{ p: 2 }}>
                    <TreeView
                        defaultCollapseIcon={<ExpandMoreIcon />}
                        defaultExpandIcon={<ChevronRightIcon />}
                        sx={{ flexGrow: 1, overflowY: 'auto' }}
                    >
                        {renderTree(taskTree)}
                    </TreeView>
                </Paper>
            )}

            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Delete Onboarding Instance</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this onboarding instance? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button onClick={handleDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            <Modal open={dryRunModalOpen} onClose={() => setDryRunModalOpen(false)}>
                <Box sx={style}>
                    <Typography variant="h6" component="h2">Dry Run Result</Typography>
                    {dryRunResult && (
                        <>
                            <Typography sx={{ mt: 2 }}>{dryRunResult.message}</Typography>
                            <Paper variant="outlined" sx={{ p: 2, mt: 1, maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                <pre>{JSON.stringify(dryRunResult.payload, null, 2)}</pre>
                            </Paper>
                        </>
                    )}
                </Box>
            </Modal>
            
            <Modal open={ticketModalOpen} onClose={() => setTicketModalOpen(false)}>
                <Box sx={style}>
                    <Typography variant="h6" component="h2">Ticket Information</Typography>
                    {isManualTicketEntry ? (
                        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSaveTicketInfo(); }}>
                            <TextField
                                fullWidth
                                label="Ticket Key"
                                margin="normal"
                                value={manualTicketInfo.key}
                                onChange={(e) => setManualTicketInfo(prev => ({ ...prev, key: e.target.value }))}
                            />
                            <DialogActions>
                                <Button onClick={() => setTicketModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleRemoveTicketInfo} color="error">Remove</Button>
                                <Button type="submit" variant="contained">Save</Button>
                            </DialogActions>
                        </Box>
                    ) : (
                        <Box>
                            {ticketDetailsLoading ? <CircularProgress /> : (
                                liveTicketDetails ? (
                                    <List>
                                        <ListItem><ListItemText primary="Ticket Key" secondary={liveTicketDetails.key} /></ListItem>
                                        <ListItem><ListItemText primary="Status" secondary={liveTicketDetails.fields.status.name} /></ListItem>
                                        <ListItem><ListItemText primary="Created" secondary={new Date(liveTicketDetails.fields.created).toLocaleString()} /></ListItem>
                                        <ListItem><ListItemText primary="Resolved" secondary={liveTicketDetails.fields.resolutiondate ? new Date(liveTicketDetails.fields.resolutiondate).toLocaleString() : 'Not resolved'} /></ListItem>
                                    </List>
                                ) : <Typography>No ticket information found.</Typography>
                            )}
                            <Button onClick={() => setIsManualTicketEntry(true)} sx={{ mt: 2 }}>Switch to Manual Entry</Button>
                        </Box>
                    )}
                </Box>
            </Modal>
        </Container>
    );
};

export default OnboardingInstanceDetail;