import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
    FormControl, Select, MenuItem, Button, Tooltip, Grid, Card, CardContent,
    LinearProgress, Stack, Divider, List, ListItem, ListItemText, ListItemIcon,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputLabel, Modal, Link, TextField
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
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
    const [activeTab, setActiveTab] = useState('table');
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
    const [manualTicketCreatedDate, setManualTicketCreatedDate] = useState(null);
    const [manualTicketClosedDate, setManualTicketClosedDate] = useState(null);

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
            const tasks = instance.tasks;
            // Create maps for efficient lookups
            const taskMap = new Map(tasks.map(task => [task.id, { ...task, children: [] }]));
            const templateIdToTaskIdMap = new Map(tasks.map(task => [task.task_template_id, task.id]));
            
            const childIds = new Set();

            // Build the full dependency graph (a DAG)
            for (const task of taskMap.values()) {
                if (task.dependencies && task.dependencies.length > 0) {
                    for (const depTemplateId of task.dependencies) {
                        const parentTaskId = templateIdToTaskIdMap.get(depTemplateId);
                        if (parentTaskId) {
                            const parentNode = taskMap.get(parentTaskId);
                            if (parentNode) {
                                parentNode.children.push(task);
                                childIds.add(task.id);
                            }
                        }
                    }
                }
            }

            // Identify the root nodes of the graph
            const rootNodes = [];
            for (const task of taskMap.values()) {
                if (!childIds.has(task.id)) {
                    rootNodes.push(task);
                }
            }

            // Traverse the graph and build a new tree structure, ensuring each node is only visited and added once.
            // This converts the DAG into a tree that can be safely rendered.
            const visited = new Set();
            function buildUniqueTree(nodes) {
                const result = [];
                for (const node of nodes) {
                    if (!visited.has(node.id)) {
                        visited.add(node.id);
                        const newNode = { ...node };
                        if (node.children.length > 0) {
                            newNode.children = buildUniqueTree(node.children);
                        }
                        result.push(newNode);
                    }
                }
                return result;
            }

            const finalTree = buildUniqueTree(rootNodes);
            setTaskTree(finalTree);
        }
    }, [instance]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await updateTaskStatus(taskId, newStatus);
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
        setManualTicketCreatedDate(task.ticket_created_at ? new Date(task.ticket_created_at) : null);
        setManualTicketClosedDate(task.ticket_closed_at ? new Date(task.ticket_closed_at) : null);
        
        const isAutomated = task.task_type === 'automated_access_request';
        const hasTicket = task.ticket_info && task.ticket_info.key;

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
            const ticketInfoToSave = { key: manualTicketInfo.key };
            const ticket_created_at = manualTicketCreatedDate ? manualTicketCreatedDate.toISOString() : null;
            const ticket_closed_at = manualTicketClosedDate ? manualTicketClosedDate.toISOString() : null;
            
            await updateTaskStatus(
                selectedTaskForTicket.id, 
                selectedTaskForTicket.status, 
                ticketInfoToSave, 
                ticket_created_at, 
                ticket_closed_at
            );
            fetchInstanceDetails();
            setTicketModalOpen(false);
        } catch (err) {
            console.error("Failed to save ticket info:", err);
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

    const renderTree = (nodes) => (
        nodes.map((node) => (
            <TreeItem 
                key={node.id}
                itemId={String(node.id)}
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
                        {getStatusIcon(node.status)}
                        <Typography sx={{ ml: 1, flexGrow: 1 }}>{node.name}</Typography>
                        <Chip label={node.status} color={getStatusChipColor(node.status)} size="small" />
                    </Box>
                }
            >
                {Array.isArray(node.children) && node.children.length > 0
                    ? renderTree(node.children)
                    : null}
            </TreeItem>
        ))
    );

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error && !instance) { // Only show full-page error if instance fails to load
        return <Alert severity="error">{error}</Alert>;
    }

    if (!instance) {
        return <Typography>Onboarding instance not found.</Typography>;
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container maxWidth="lg">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                    Onboarding Details for {instance.user_name}
                </Typography>
                {/* Render non-critical errors here */}
                {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Grid container spacing={3}>
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
                        disabled
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
            
            {activeTab === 'kanban' && (
                <Grid container spacing={2}>
                    {['not_started', 'in_progress', 'completed', 'blocked'].map(status => (
                        <Grid item xs={12} md={3} key={status}>
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

            {activeTab === 'tree' && (
                <Paper sx={{ p: 2 }}>
                    <SimpleTreeView
                        slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
                        sx={{ flexGrow: 1, overflowY: 'auto' }}
                    >
                        {renderTree(taskTree)}
                    </SimpleTreeView>
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
                            {selectedTaskForTicket?.task_type !== 'automated_access_request' && (
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={6}>
                                        <DateTimePicker
                                            label="Ticket Created Date"
                                            value={manualTicketCreatedDate}
                                            onChange={setManualTicketCreatedDate}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <DateTimePicker
                                            label="Ticket Closed Date"
                                            value={manualTicketClosedDate}
                                            onChange={setManualTicketClosedDate}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                        />
                                    </Grid>
                                </Grid>
                            )}
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
                                        <ListItem><ListItemText primary="Ticket Key" secondary={liveTicketDetails.issueKey} /></ListItem>
                                        <ListItem><ListItemText primary="Status" secondary={liveTicketDetails?.currentStatus?.status || 'N/A'} /></ListItem>
                                        <ListItem><ListItemText primary="Created" secondary={liveTicketDetails?.createdDate?.iso8601 ? new Date(liveTicketDetails.createdDate.iso8601).toLocaleString() : 'N/A'} /></ListItem>
                                        <ListItem><ListItemText primary="Resolved" secondary={liveTicketDetails?.currentStatus?.statusCategory === 'DONE' && liveTicketDetails?.currentStatus?.statusDate?.iso8601 ? new Date(liveTicketDetails.currentStatus.statusDate.iso8601).toLocaleString() : 'Not resolved'} /></ListItem>
                                    </List>
                                ) : <Typography>No ticket information found.</Typography>
                            )}
                            <Button onClick={() => setIsManualTicketEntry(true)} sx={{ mt: 2 }}>Switch to Manual Entry</Button>
                        </Box>
                    )}
                </Box>
            </Modal>
        </Container>
        </LocalizationProvider>
    );
};

export default OnboardingInstanceDetail;
