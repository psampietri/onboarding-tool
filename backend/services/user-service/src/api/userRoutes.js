import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../services/userService.js';

const router = Router();

router.get('/', async (req, res) => {
    console.log('[userRoutes] GET / handler reached.');
    try {
        const users = await getAllUsers();
        console.log(`[userRoutes] Found ${users.length} users.`);
        res.json(users);
    } catch (error) {
        console.error('[userRoutes] Error fetching all users:', error);
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
        const { email, name, role } = req.body;
        const updatedUser = await updateUser(req.params.id, { email, name, role });
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
