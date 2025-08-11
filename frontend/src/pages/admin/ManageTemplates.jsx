import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, TableContainer, Table, TableHead,
    TableRow, TableCell, TableBody, CircularProgress, Box, Alert, Button,
    Modal, TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
    List, ListItem, ListItemText, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const OnboardingTemplates = ({ taskTemplates, fetchTaskTemplates }) => {
    const [onboardingTemplates, setOnboardingTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState([]);

    const fetchOnboardingTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/templates/onboarding');
            setOnboardingTemplates(response.data);
        } catch (err) {
            setError('Failed to fetch onboarding templates.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOnboardingTemplates();
    }, []);
    
    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentTemplate({ name: '', description: '' });
        setSelectedTasks([]);
        setModalOpen(true);
    };

    const handleOpenEditModal = async (template) => {
        setIsEditing(true);
        try {
            const response = await api.get(`/templates/onboarding/${template.id}`);
            setCurrentTemplate(response.data);
            setSelectedTasks(response.data.tasks || []);
            setModalOpen(true);
        } catch (err) {
            setError('Failed to fetch template details.');
        }
    };

    const handleOpenDeleteDialog = (template) => {
        setCurrentTemplate(template);
        setDialogOpen(true);
    };

    const handleCloseModal = () => setModalOpen(false);
    const handleCloseDialog = () => setDialogOpen(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentTemplate(prevState => ({ ...prevState, [name]: value }));
    };

    const handleTaskSelection = (taskId) => {
        setSelectedTasks(prev => 
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const payload = {
                ...currentTemplate,
                created_by: currentUser.id, // Should be handled by backend
                tasks: selectedTasks.map((taskId, index) => ({ id: taskId, order: index + 1 }))
            };
            if (isEditing) {
                await api.put(`/templates/onboarding/${currentTemplate.id}`, payload);
            } else {
                await api.post('/templates/onboarding', payload);
            }
            handleCloseModal();
            fetchOnboardingTemplates();
        } catch (err) {
            setError('Failed to save onboarding template.');
            console.error(err);
        }
    };

    const handleDeleteTemplate = async () => {
        setError('');
        try {
            await api.delete(`/templates/onboarding/${currentTemplate.id}`);
            handleCloseDialog();
            fetchOnboardingTemplates();
        } catch (err) {
            setError('Failed to delete onboarding template.');
            console.error(err);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Onboarding Templates</Typography>
                <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenCreateModal}>
                    Create Onboarding Template
                </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {onboardingTemplates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell>{template.name}</TableCell>
                                <TableCell>{template.description}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenEditModal(template)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => handleOpenDeleteDialog(template)}><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={style} component="form" onSubmit={handleSaveTemplate}>
                    <Typography variant="h6" component="h2">{isEditing ? 'Edit' : 'Create'} Onboarding Template</Typography>
                    <TextField margin="normal" required fullWidth label="Template Name" name="name" value={currentTemplate?.name || ''} onChange={handleInputChange} />
                    <TextField margin="normal" fullWidth label="Description" name="description" value={currentTemplate?.description || ''} onChange={handleInputChange} />
                    <Typography sx={{ mt: 2 }}>Select and Order Tasks:</Typography>
                    <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                        <List dense>
                            {taskTemplates.map(task => (
                                <ListItem key={task.id} secondaryAction={
                                    <Checkbox edge="end" onChange={() => handleTaskSelection(task.id)} checked={selectedTasks.includes(task.id)} />
                                }>
                                    <ListItemText primary={task.name} secondary={task.task_type} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button type="submit" variant="contained">Save</Button>
                    </Box>
                </Box>
            </Modal>
            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Delete Onboarding Template</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the template "{currentTemplate?.name}"? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleDeleteTemplate} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

const TaskTemplates = ({ taskTemplates, fetchTaskTemplates }) => {
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentTemplate({ name: '', description: '', task_type: 'manual', config: '{}' });
        setModalOpen(true);
    };

    const handleOpenEditModal = (template) => {
        setIsEditing(true);
        setCurrentTemplate({ ...template, config: JSON.stringify(template.config || {}, null, 2) });
        setModalOpen(true);
    };

    const handleOpenDeleteDialog = (template) => {
        setCurrentTemplate(template);
        setDialogOpen(true);
    };

    const handleCloseModal = () => setModalOpen(false);
    const handleCloseDialog = () => setDialogOpen(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentTemplate(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const payload = {
                ...currentTemplate,
                config: JSON.parse(currentTemplate.config),
                created_by: currentUser.id // This should ideally be handled by the backend based on the token
            };

            if (isEditing) {
                await api.put(`/templates/tasks/${currentTemplate.id}`, payload);
            } else {
                await api.post('/templates/tasks', payload);
            }
            handleCloseModal();
            fetchTaskTemplates();
        } catch (err) {
            setError('Failed to save template. Ensure config is valid JSON.');
            console.error(err);
        }
    };

    const handleDeleteTemplate = async () => {
        setError('');
        try {
            await api.delete(`/templates/tasks/${currentTemplate.id}`);
            handleCloseDialog();
            fetchTaskTemplates();
        } catch (err) {
            setError('Failed to delete template.');
            console.error(err);
        }
    };

    return (
        <Paper sx={{ p: 2, mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Task Templates</Typography>
                <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenCreateModal}>
                    Create Task Template
                </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {taskTemplates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell>{template.name}</TableCell>
                                <TableCell>{template.task_type}</TableCell>
                                <TableCell>{template.description}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenEditModal(template)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => handleOpenDeleteDialog(template)}><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={style} component="form" onSubmit={handleSaveTemplate}>
                    <Typography variant="h6" component="h2">{isEditing ? 'Edit' : 'Create New'} Task Template</Typography>
                    <TextField margin="normal" required fullWidth label="Template Name" name="name" value={currentTemplate?.name || ''} onChange={handleInputChange} />
                    <TextField margin="normal" fullWidth label="Description" name="description" value={currentTemplate?.description || ''} onChange={handleInputChange} />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Task Type</InputLabel>
                        <Select name="task_type" value={currentTemplate?.task_type || 'manual'} label="Task Type" onChange={handleInputChange}>
                            <MenuItem value="manual">Manual Task</MenuItem>
                            <MenuItem value="manual_access_request">Manual Access Request</MenuItem>
                            <MenuItem value="automated_access_request">Automated Access Request</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Configuration (JSON)"
                        name="config"
                        multiline
                        rows={4}
                        value={currentTemplate?.config || '{}'}
                        onChange={handleInputChange}
                        helperText="Enter a valid JSON object for task-specific settings."
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button type="submit" variant="contained">Save</Button>
                    </Box>
                </Box>
            </Modal>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Delete Task Template</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the template "{currentTemplate?.name}"? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleDeleteTemplate} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};


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

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Manage Templates
            </Typography>
            <OnboardingTemplates taskTemplates={taskTemplates} fetchTaskTemplates={fetchTaskTemplates} />
            <TaskTemplates taskTemplates={taskTemplates} fetchTaskTemplates={fetchTaskTemplates} />
        </Container>
    );
};

export default ManageTemplates;
