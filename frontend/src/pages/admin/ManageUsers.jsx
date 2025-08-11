import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, TableContainer, Table, TableHead,
    TableRow, TableCell, TableBody, CircularProgress, Box, Alert, Button,
    Modal, TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for the create/edit modal
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState({ id: null, name: '', email: '', password: '', role: 'user' });

    // State for the delete confirmation dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);


    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users.');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentUser({ id: null, name: '', email: '', password: '', role: 'user' });
        setModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setIsEditing(true);
        setCurrentUser({ ...user, password: '' }); // Don't pre-fill password for editing
        setModalOpen(true);
    };

    const handleCloseModal = () => setModalOpen(false);

    const handleOpenDialog = (user) => {
        setUserToDelete(user);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setUserToDelete(null);
        setDialogOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentUser(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isEditing) {
                // Update existing user
                await api.put(`/users/${currentUser.id}`, {
                    name: currentUser.name,
                    email: currentUser.email,
                    role: currentUser.role,
                });
            } else {
                // Create new user
                await api.post('/auth/register', {
                    name: currentUser.name,
                    email: currentUser.email,
                    password: currentUser.password,
                    role: currentUser.role,
                });
            }
            handleCloseModal();
            fetchUsers(); // Refresh the list
        } catch (err) {
            setError(`Failed to ${isEditing ? 'update' : 'create'} user.`);
            console.error('Save user error:', err);
        }
    };

    const handleDeleteUser = async () => {
        setError('');
        try {
            await api.delete(`/users/${userToDelete.id}`);
            handleCloseDialog();
            fetchUsers(); // Refresh the list
        } catch (err) {
            setError('Failed to delete user.');
            console.error('Delete user error:', err);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">
                    Manage Users
                </Typography>
                <Button variant="contained" onClick={handleOpenCreateModal}>Add User</Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.id}</TableCell>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpenEditModal(user)}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleOpenDialog(user)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={style} component="form" onSubmit={handleSaveUser}>
                    <Typography variant="h6" component="h2">
                        {isEditing ? 'Edit User' : 'Create New User'}
                    </Typography>
                    <TextField margin="normal" required fullWidth label="Full Name" name="name" value={currentUser.name} onChange={handleInputChange} />
                    <TextField margin="normal" required fullWidth label="Email Address" name="email" type="email" value={currentUser.email} onChange={handleInputChange} />
                    {!isEditing && (
                        <TextField margin="normal" required fullWidth label="Password" name="password" type="password" value={currentUser.password} onChange={handleInputChange} />
                    )}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Role</InputLabel>
                        <Select name="role" value={currentUser.role} label="Role" onChange={handleInputChange}>
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button type="submit" variant="contained">Save</Button>
                    </Box>
                </Box>
            </Modal>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleDeleteUser} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ManageUsers;
