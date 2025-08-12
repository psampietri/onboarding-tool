// frontend/src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Grid, Paper, Box, Button, Modal, FormControl,
    InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Alert, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Snackbar, Tabs, Tab,
    TextField, InputAdornment, IconButton, Card, CardContent
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Chip from '@mui/material/Chip';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { format, subDays } from 'date-fns';
import api from '../../services/api';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 1
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StatCard = ({ title, value, icon, trend = null, trendValue = null }) => (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
        <Box sx={{ mr: 2 }}>{icon}</Box>
        <Box sx={{ flexGrow: 1 }}>
            <Typography color="text.secondary">{title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h5">{value}</Typography>
                {trend && (
                    <Box 
                        sx={{ 
                            ml: 1, 
                            display: 'flex', 
                            alignItems: 'center',
                            color: trend === 'up' ? 'success.main' : 'error.main'
                        }}
                    >
                        {trend === 'up' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {trendValue}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    </Paper>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({ 
        activeOnboardings: 0, 
        avgCompletionDays: 'N/A', 
        totalUsers: 0,
        completionRate: 0
    });
    const [instances, setInstances] = useState([]);
    const [filteredInstances, setFilteredInstances] = useState([]);
    const [users, setUsers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [assignment, setAssignment] = useState({ userId: '', templateId: '' });
    const [tabValue, setTabValue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [chartData, setChartData] = useState({
        taskTypeDistribution: [],
        completionTrend: [],
        statusDistribution: []
    });
    
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [instancesRes, usersRes, templatesRes, kpisRes, analyticsRes] = await Promise.all([
                api.get('/onboarding/instances'),
                api.get('/users'),
                api.get('/templates/onboarding'),
                api.get('/analytics/kpis'),
                api.get('/analytics/charts')
            ]);
            
            const instancesData = instancesRes.data;
            setInstances(instancesData);
            setFilteredInstances(instancesData);
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
                avgCompletionDays: avgTime,
                completionRate: kpisRes.data.completionRate || 0
            });
            
            // Process analytics data for charts
            // Note: In a real application, this data would come from the analyticsRes
            // Here we're simulating it based on the instances data we have
            
            // For demo purposes, let's create some mock chart data
            const mockTaskTypeDistribution = [
                { name: 'Manual', value: 35 },
                { name: 'Manual Access', value: 40 },
                { name: 'Automated', value: 25 },
            ];
            
            // Generate completion trend data for the last 14 days
            const trendData = [];
            for (let i = 13; i >= 0; i--) {
                const date = subDays(new Date(), i);
                trendData.push({
                    date: format(date, 'MMM dd'),
                    completed: Math.floor(Math.random() * 5), // Random number 0-5
                    started: Math.floor(Math.random() * 8), // Random number 0-8
                });
            }
            
            // Calculate status distribution from instances
            const statusCounts = instancesData.reduce((acc, instance) => {
                acc[instance.status] = (acc[instance.status] || 0) + 1;
                return acc;
            }, {});
            
            const statusDistribution = Object.keys(statusCounts).map(status => ({
                name: status,
                value: statusCounts[status]
            }));
            
            setChartData({
                taskTypeDistribution: mockTaskTypeDistribution,
                completionTrend: trendData,
                statusDistribution: statusDistribution
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
    
    // Filter instances when search term or status filter changes
    useEffect(() => {
        let filtered = [...instances];
        
        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(inst => 
                inst.user_name.toLowerCase().includes(term) || 
                inst.template_name.toLowerCase().includes(term) ||
                inst.admin_name.toLowerCase().includes(term)
            );
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(inst => inst.status === statusFilter);
        }
        
        setFilteredInstances(filtered);
    }, [searchTerm, statusFilter, instances]);

    const handleOpenModal = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);
    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);
    const handleTabChange = (event, newValue) => setTabValue(newValue);

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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Admin Dashboard
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid xs={12} md={3}>
                    <StatCard 
                        title="Active Onboardings" 
                        value={stats.activeOnboardings} 
                        icon={<AssignmentIcon color="primary" sx={{ fontSize: 40 }} />} 
                        trend="up"
                        trendValue="12%"
                    />
                </Grid>
                <Grid xs={12} md={3}>
                    <StatCard 
                        title="Total Users" 
                        value={stats.totalUsers} 
                        icon={<PeopleIcon color="secondary" sx={{ fontSize: 40 }} />} 
                    />
                </Grid>
                <Grid xs={12} md={3}>
                    <StatCard 
                        title="Avg. Completion Time" 
                        value={stats.avgCompletionDays} 
                        icon={<BarChartIcon color="success" sx={{ fontSize: 40 }} />} 
                        trend="down"
                        trendValue="8%"
                    />
                </Grid>
                <Grid xs={12} md={3}>
                    <StatCard 
                        title="Completion Rate" 
                        value={`${stats.completionRate}%`} 
                        icon={<AssignmentIcon color="info" sx={{ fontSize: 40 }} />} 
                    />
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Paper sx={{ p: 2, mb: 4 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="Overview" />
                    <Tab label="Task Analysis" />
                    <Tab label="Trends" />
                </Tabs>

                {/* Overview Tab */}
                {tabValue === 0 && (
                    <Grid container spacing={3}>
                        <Grid xs={12} md={8}>
                            <Typography variant="h6" gutterBottom>Onboarding Completion Trend</Typography>
                            <Paper sx={{ p: 2, height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData.completionTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="completed" stroke="#8884d8" activeDot={{ r: 8 }} />
                                        <Line type="monotone" dataKey="started" stroke="#82ca9d" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid xs={12} md={4}>
                            <Typography variant="h6" gutterBottom>Status Distribution</Typography>
                            <Paper sx={{ p: 2, height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.statusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {chartData.statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* Task Analysis Tab */}
                {tabValue === 1 && (
                    <Grid container spacing={3}>
                        <Grid xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Task Type Distribution</Typography>
                            <Paper sx={{ p: 2, height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.taskTypeDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {chartData.taskTypeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Task Completion Time by Type</Typography>
                            <Paper sx={{ p: 2, height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { name: 'Manual', time: 2.5 },
                                            { name: 'Manual Access', time: 5.3 },
                                            { name: 'Automated', time: 0.3 }
                                        ]}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                                        <RechartsTooltip />
                                        <Bar dataKey="time" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* Trends Tab */}
                {tabValue === 2 && (
                    <Grid container spacing={3}>
                        <Grid xs={12}>
                            <Typography variant="h6" gutterBottom>Weekly Completion Rate</Typography>
                            <Paper sx={{ p: 2, height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={[
                                            { week: 'Week 1', rate: 65 },
                                            { week: 'Week 2', rate: 72 },
                                            { week: 'Week 3', rate: 68 },
                                            { week: 'Week 4', rate: 78 },
                                            { week: 'Week 5', rate: 82 },
                                            { week: 'Week 6', rate: 85 }
                                        ]}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" />
                                        <YAxis label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
                                        <RechartsTooltip />
                                        <Line type="monotone" dataKey="rate" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Paper>

            {/* Onboarding Monitor */}
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Onboarding Monitor</Typography>
                    <Button variant="contained" onClick={handleOpenModal}>Assign Onboarding</Button>
                </Box>

                {/* Search and Filter */}
                <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Search by name or template..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                            labelId="status-filter-label"
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
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
                        </Select>
                    </FormControl>
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
                            {filteredInstances.length > 0 ? (
                                filteredInstances.map((inst) => (
                                    <TableRow 
                                        key={inst.id} 
                                        hover 
                                        onClick={() => handleRowClick(inst.id)} 
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>{inst.user_name}</TableCell>
                                        <TableCell>{inst.template_name}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={inst.status} 
                                                color={
                                                    inst.status === 'completed' ? 'success' :
                                                    inst.status === 'in_progress' ? 'warning' : 'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{inst.admin_name}</TableCell>
                                        <TableCell>{new Date(inst.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No onboarding instances found matching the filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Assign Onboarding Modal */}
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

            {/* Confirm Dialog */}
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