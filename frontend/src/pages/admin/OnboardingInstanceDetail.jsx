import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert,
    FormControl, Select, MenuItem, Button, Tooltip, Grid, Card, CardContent,
    LinearProgress, Divider, List, ListItem, ListItemText,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputLabel, Modal, Link, TextField, Chip, InputAdornment
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
import LinkOffIcon from '@mui/icons-material/LinkOff';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import api from '../../services/api';
import { executeAutomatedTask, dryRunAutomatedTask, updateOnboardingInstance, deleteOnboardingInstance, updateTaskStatus, unassignTicket } from '../../services/onboardingService';
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

// Custom hook to get the previous value of a prop or state.
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const OnboardingInstanceDetail = () => {
    const { instanceId } = useParams();
    const navigate = useNavigate();
    const [instance, setInstance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [taskLoading, setTaskLoading] = useState(null);
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
    const [expandedNodes, setExpandedNodes] = useState([]);
    const [taskSearchTerm, setTaskSearchTerm] = useState('');
    const [taskStatusFilter, setTaskStatusFilter] = useState('all');
    const scrollPositionRef = useRef(0);

    const fetchInstanceDetails = async () => {
        if (instance) {
            scrollPositionRef.current = window.scrollY;
        }
        try {
            // No need to set loading to true on refresh, avoids flickering
            if (!instance) setLoading(true);
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

    useLayoutEffect(() => {
        if (scrollPositionRef.current > 0) {
            window.scrollTo(0, scrollPositionRef.current);
        }
    }, [instance]);

    useEffect(() => {
        if (instance?.tasks) {
            const tasks = instance.tasks;
            const nodes = new Map(tasks.map(task => [task.id, { ...task, children: [] }]));
            const templateIdToTaskId = new Map(tasks.map(task => [task.task_template_id, task.id]));
            
            const assignedChildren = new Set();

            tasks.forEach(task => {
                if (task.dependencies && task.dependencies.length > 0) {
                    for (const depTemplateId of task.dependencies) {
                        if (assignedChildren.has(task.id)) break;

                        const parentId = templateIdToTaskId.get(depTemplateId);
                        if (parentId) {
                            const parentNode = nodes.get(parentId);
                            const childNode = nodes.get(task.id);
                            if (parentNode && childNode) {
                                parentNode.children.push(childNode);
                                assignedChildren.add(childNode.id);
                            }
                        }
                    }
                }
            });

            const rootNodes = Array.from(nodes.values()).filter(node => !assignedChildren.has(node.id));
            setTaskTree(rootNodes);
        }
    }, [instance]);

    const filteredTaskTree = useMemo(() => {
        if (!taskSearchTerm && taskStatusFilter === 'all') {
            return { tree: taskTree, expandedIds: [] };
        }

        const expandedIds = new Set();
        const filterNodes = (nodes) => {
            const result = [];
            for (const node of nodes) {
                const filteredChildren = node.children ? filterNodes(node.children) : [];
                
                const nameMatch = node.name.toLowerCase().includes(taskSearchTerm.toLowerCase());
                const statusMatch = taskStatusFilter === 'all' || node.status === taskStatusFilter;

                if ((nameMatch && statusMatch) || filteredChildren.length > 0) {
                    if (filteredChildren.length > 0) {
                        expandedIds.add(String(node.id));
                    }
                    result.push({ ...node, children: filteredChildren });
                }
            }
            return result;
        };

        const tree = filterNodes(taskTree);
        return { tree, expandedIds: Array.from(expandedIds) };
    }, [taskTree, taskSearchTerm, taskStatusFilter]);

    const prevSearchTerm = usePrevious(taskSearchTerm);
    const prevStatusFilter = usePrevious(taskStatusFilter);

    useEffect(() => {
        // This effect now only runs when the filters themselves change.
        // It no longer runs on a simple data refresh, which preserves the user's expanded state.
        if (taskSearchTerm !== prevSearchTerm || taskStatusFilter !== prevStatusFilter) {
            setExpandedNodes(filteredTaskTree.expandedIds);
        }
    }, [taskSearchTerm, taskStatusFilter, filteredTaskTree.expandedIds, prevSearchTerm, prevStatusFilter]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const task = instance.tasks.find(t => t.id === taskId);
            if (!task) {
                console.error("Task not found:", taskId);
                setError("An error occurred while updating the task.");
                return;
            }

            // Call the service with the new status, preserving existing ticket and date info
            await updateTaskStatus(
                taskId, 
                newStatus, 
                task.ticket_info, 
                task.ticket_created_at, 
                task.ticket_closed_at
            );
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

    const handleUnassignTicket = async (taskId) => {
        if (window.confirm('Are you sure you want to unassign this ticket? The task status will be reset.')) {
            try {
                await unassignTicket(taskId);
                fetchInstanceDetails();
            } catch (err) {
                setError("Failed to unassign ticket.");
                console.error("Unassign ticket error:", err);
            }
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
        nodes.map((node) => {
            const isBlocked = blockedTasks.has(node.id);
            const blockers = blockedTasks.get(node.id);
            return (
                <TreeItem 
                    key={node.id}
                    itemId={String(node.id)}
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, width: '100%', opacity: isBlocked ? 0.6 : 1 }}>
                            {/* Left Side: Info */}
                            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                                {getStatusIcon(node.status)}
                                <Box sx={{ ml: 1.5 }}>
                                    <Typography>{node.name}</Typography>
                                    {node.ticket_info?.key && (
                                        <Typography variant="caption" color="text.secondary">
                                            Ticket: <Link href={node.ticket_info.self} target="_blank" rel="noopener noreferrer">{node.ticket_info.key}</Link>
                                        </Typography>
                                    )}
                                </Box>
                                {node.instructions && (
                                    <Tooltip title={node.instructions}>
                                        <IconButton size="small" sx={{ ml: 1 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
                                    </Tooltip>
                                )}
                            </Box>

                            {/* Right Side: Actions */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormControl size="small" sx={{ minWidth: 120 }} disabled={isBlocked}>
                                    <Select
                                        value={node.status}
                                        onChange={(e) => handleStatusChange(node.id, e.target.value)}
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

                                {isBlocked && (
                                    <Tooltip title={`Blocked by: ${blockers.join(', ')}`}>
                                        <IconButton><LockIcon /></IconButton>
                                    </Tooltip>
                                )}
                                <Tooltip title="View/Edit Ticket">
                                    <IconButton onClick={() => handleOpenTicketModal(node)}><ConfirmationNumberIcon /></IconButton>
                                </Tooltip>
                                {node.ticket_info?.key && (
                                    <Tooltip title="Unassign Ticket">
                                        <IconButton onClick={() => handleUnassignTicket(node.id)}><LinkOffIcon /></IconButton>
                                    </Tooltip>
                                )}
                                {node.task_type === 'automated_access_request' && node.status === 'not_started' && !isBlocked && (
                                    <>
                                        <Button variant="outlined" size="small" onClick={() => handleDryRun(node.id)} disabled={taskLoading === node.id}>Dry Run</Button>
                                        <Button variant="contained" size="small" onClick={() => handleExecuteTask(node.id)} disabled={taskLoading === node.id}>
                                            {taskLoading === node.id ? <CircularProgress size={20} /> : 'Run'}
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>
                    }
                >
                    {Array.isArray(node.children) && node.children.length > 0
                        ? renderTree(node.children)
                        : null}
                </TreeItem>
            );
        })
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
            
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Search tasks..."
                        value={taskSearchTerm}
                        onChange={(e) => setTaskSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={taskStatusFilter}
                            label="Status"
                            onChange={(e) => setTaskStatusFilter(e.target.value)}
                            startAdornment={
                                <InputAdornment position="start">
                                    <FilterListIcon />
                                </InputAdornment>
                            }
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="not_started">Not Started</MenuItem>
                            <MenuItem value="in_progress">In Progress</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="blocked">Blocked</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {filteredTaskTree.tree.length > 0 ? (
                    <SimpleTreeView
                        expandedItems={expandedNodes}
                        onExpandedItemsChange={(event, ids) => setExpandedNodes(ids)}
                        slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
                        sx={{ flexGrow: 1, overflowY: 'auto' }}
                    >
                        {renderTree(filteredTaskTree.tree)}
                    </SimpleTreeView>
                ) : (
                    <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                        No tasks match the current filters.
                    </Typography>
                )}
            </Paper>

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
