import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser, getUserFields, addUserField, deleteUserField } from '../services/userService.js';

const router = Router();

// --- User Field Management ---

router.get('/fields', async (req, res) => {
    try {
        const fields = await getUserFields();
        res.json(fields);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve user fields.' });
    }
});

router.post('/fields', async (req, res) => {
    try {
        const { fieldName } = req.body;
        await addUserField(fieldName);
        res.status(201).json({ message: `Field '${fieldName}' added successfully.` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/fields/:fieldName', async (req, res) => {
    try {
        const { fieldName } = req.params;
        await deleteUserField(fieldName);
        res.status(200).json({ message: `Field '${fieldName}' deleted successfully.` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// --- User Management ---

router.get('/', async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve users.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve user.' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedUser = await updateUser(req.params.id, req.body);
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await deleteUser(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

export default router;
