import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Grid, Paper, Box, Button, Modal, FormControl,
    InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Alert, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Snackbar
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import api from '../../services/api';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

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
    const [stats, setStats] = useState({ activeOnboardings: 0, avgCompletionDays: 'N/A', totalUsers: 0 });
    const [instances, setInstances] = useState([]);
    const [users, setUsers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [assignment, setAssignment] = useState({ userId: '', templateId: '' });
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [instancesRes, usersRes, templatesRes, kpisRes] = await Promise.all([
                api.get('/onboarding/instances'),
                api.get('/users'),
                api.get('/templates/onboarding'),
                api.get('/analytics/kpis')
            ]);
            setInstances(instancesRes.data);
            setUsers(usersRes.data);
            setTemplates(templatesRes.data);
            
            // Format average completion time
            let avgTime = 'N/A';
            if (kpisRes.data.averageCompletionTimeHours) {
                const { days, hours } = kpisRes.data.averageCompletionTimeHours;
                avgTime = `${days || 0}d ${hours || 0}h`;
            }

            setStats({
                activeOnboardings: kpisRes.data.activeOnboardings,
                totalUsers: kpisRes.data.totalUsers,
                avgCompletionDays: avgTime
            });
        } catch (err) {
            setError('Failed to load dashboard data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);
    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);

    const handleAssignmentChange = (e) => {
        setAssignment({ ...assignment, [e.target.name]: e.target.value });
    };

    const handleConfirmAssignment = (e) => {
        e.preventDefault();
        if (assignment.userId && assignment.templateId) {
            handleOpenDialog();
        } else {
            setError("Please select a user and a template.");
        }
    };

    const handleAssignOnboarding = async () => {
        handleCloseDialog();
        setError('');
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            await api.post('/onboarding/instances', {
                userId: assignment.userId,
                templateId: assignment.templateId,
                assignedBy: currentUser.id
            });
            handleCloseModal();
            setSnackbarOpen(true);
            fetchData(); // Refresh data
        } catch (err) {
            setError('Failed to assign onboarding.');
            console.error(err);
        }
    };

    const handleRowClick = (instanceId) => {
        navigate(`/admin/onboarding/${instanceId}`);
    };

    if (loading) return <CircularProgress />;

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Admin Dashboard
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <StatCard title="Active Onboardings" value={stats.activeOnboardings} icon={<AssignmentIcon color="primary" sx={{ fontSize: 40 }} />} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard title="Total Users" value={stats.totalUsers} icon={<PeopleIcon color="secondary" sx={{ fontSize: 40 }} />} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard title="Avg. Completion Time" value={stats.avgCompletionDays} icon={<BarChartIcon color="success" sx={{ fontSize: 40 }} />} />
                </Grid>
            </Grid>

            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Onboarding Monitor</Typography>
                    <Button variant="contained" onClick={handleOpenModal}>Assign Onboarding</Button>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell>Template</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Assigned By</TableCell>
                                <TableCell>Start Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {instances.map((inst) => (
                                <TableRow 
                                    key={inst.id} 
                                    hover 
                                    onClick={() => handleRowClick(inst.id)} 
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>{inst.user_name}</TableCell>
                                    <TableCell>{inst.template_name}</TableCell>
                                    <TableCell>{inst.status}</TableCell>
                                    <TableCell>{inst.admin_name}</TableCell>
                                    <TableCell>{new Date(inst.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={style} component="form" onSubmit={handleConfirmAssignment}>
                    <Typography variant="h6" component="h2">Assign Onboarding</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>User to Onboard</InputLabel>
                        <Select name="userId" value={assignment.userId} label="User to Onboard" onChange={handleAssignmentChange}>
                            {users.map(user => <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Onboarding Template</InputLabel>
                        <Select name="templateId" value={assignment.templateId} label="Onboarding Template" onChange={handleAssignmentChange}>
                            {templates.map(template => <MenuItem key={template.id} value={template.id}>{template.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button type="submit" variant="contained">Assign</Button>
                    </Box>
                </Box>
            </Modal>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Assignment</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to assign the template "{templates.find(t => t.id === assignment.templateId)?.name}" to the user "{users.find(u => u.id === assignment.userId)?.name}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleAssignOnboarding} color="primary">Confirm</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message="Onboarding assigned successfully!"
            />
        </Container>
    );
};

export default AdminDashboard;
