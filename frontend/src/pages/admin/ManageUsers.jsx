import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, TableContainer, Table, TableHead,
    TableRow, TableCell, TableBody, CircularProgress, Box, Alert, Button,
    Modal, TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, List, ListItem, ListItemText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';
import { getUserFields, addUserField, deleteUserField } from '../../services/userService';

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
    maxHeight: '90vh',
    overflowY: 'auto',
};

const ManageFieldsModal = ({ open, onClose, userFields, onFieldUpdate }) => {
    const [newFieldName, setNewFieldName] = useState('');
    const [error, setError] = useState('');

    const handleAddField = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await addUserField(newFieldName);
            setNewFieldName('');
            onFieldUpdate(); // Callback to refresh fields in parent
        } catch (err) {
            setError('Failed to add field.');
            console.error(err);
        }
    };

    const handleDeleteField = async (fieldName) => {
        setError('');
        try {
            await deleteUserField(fieldName);
            onFieldUpdate(); // Callback to refresh fields in parent
        } catch (err) {
            setError('Failed to delete field.');
            console.error(err);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Manage User Fields</Typography>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                <List sx={{ maxHeight: 200, overflow: 'auto', my: 2 }}>
                    {userFields.map(field => (
                        <ListItem key={field} secondaryAction={
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteField(field)}>
                                <DeleteIcon />
                            </IconButton>
                        }>
                            <ListItemText primary={field} />
                        </ListItem>
                    ))}
                </List>
                <Box component="form" onSubmit={handleAddField} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="New Field Name"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                    />
                    <Button type="submit" variant="contained">Add</Button>
                </Box>
            </Box>
        </Modal>
    );
};


const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [userFields, setUserFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [newOwnerId, setNewOwnerId] = useState('');
    
    const [fieldsModalOpen, setFieldsModalOpen] = useState(false);


    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, fieldsRes] = await Promise.all([
                api.get('/users'),
                getUserFields()
            ]);
            setUsers(usersRes.data);
            setUserFields(fieldsRes);
        } catch (err) {
            setError('Failed to fetch user data.');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentUser({ role: 'user' });
        setModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setIsEditing(true);
        setCurrentUser({ ...user });
        setModalOpen(true);
    };

    const handleCloseModal = () => setModalOpen(false);

    const handleOpenDialog = (user) => {
        setUserToDelete(user);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setUserToDelete(null);
        setNewOwnerId('');
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
                await api.put(`/users/${currentUser.id}`, currentUser);
            } else {
                await api.post('/auth/register', currentUser);
            }
            handleCloseModal();
            fetchData(); // Refresh the list
        } catch (err) {
            setError(`Failed to ${isEditing ? 'update' : 'create'} user.`);
            console.error('Save user error:', err);
        }
    };

    const handleDeleteUser = async () => {
        setError('');
        if (!newOwnerId) {
            setError('You must select a new owner for the assets.');
            return;
        }
        try {
            await api.delete(`/users/${userToDelete.id}`, { data: { newOwnerId } });
            handleCloseDialog();
            fetchData(); // Refresh the list
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
                <Box>
                    <Button variant="outlined" sx={{ mr: 2 }} onClick={() => setFieldsModalOpen(true)}>Manage Fields</Button>
                    <Button variant="contained" onClick={handleOpenCreateModal}>Add User</Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            {userFields.map(field => <TableCell key={field}>{field}</TableCell>)}
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                {userFields.map(field => <TableCell key={`${user.id}-${field}`}>{user[field] || ''}</TableCell>)}
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
                    
                    {userFields.filter(field => !['id', 'created_at', 'updated_at', 'role'].includes(field)).map(field => (
                        <TextField
                            key={field}
                            margin="normal"
                            required={!isEditing || ['name', 'email'].includes(field)}
                            fullWidth
                            label={field.charAt(0).toUpperCase() + field.slice(1)}
                            name={field}
                            value={currentUser?.[field] || ''}
                            onChange={handleInputChange}
                        />
                    ))}

                    {!isEditing && (
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            name="password"
                            type="password"
                            value={currentUser?.password || ''}
                            onChange={handleInputChange}
                        />
                    )}

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Role</InputLabel>
                        <Select
                            name="role"
                            value={currentUser?.role || 'user'}
                            label="Role"
                            onChange={handleInputChange}
                        >
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
            
            <ManageFieldsModal 
                open={fieldsModalOpen} 
                onClose={() => setFieldsModalOpen(false)} 
                userFields={userFields}
                onFieldUpdate={fetchData}
            />

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To delete "{userToDelete?.name}", you must reassign their created templates and other assets to another user.
                    </DialogContentText>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Reassign Assets To</InputLabel>
                        <Select
                            value={newOwnerId}
                            label="Reassign Assets To"
                            onChange={(e) => setNewOwnerId(e.target.value)}
                        >
                            {users.filter(u => u.id !== userToDelete?.id).map(user => (
                                <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleDeleteUser} color="error" disabled={!newOwnerId}>
                        Delete User
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ManageUsers;