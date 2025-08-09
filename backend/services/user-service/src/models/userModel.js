import pool from 'database';

export const findUserByEmail = async (email) => {
    console.log(`[userModel] Searching for user with email: ${email}`);
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        console.log(`[userModel] Query finished. Found ${rows.length} user(s).`);
        return rows[0];
    } catch (err) {
        console.error('[userModel] Error in findUserByEmail:', err);
        throw err;
    }
};

export const createUser = async (email, name, password_hash, role) => {
    console.log(`[userModel] Attempting to create user: ${email}`);
    try {
        const { rows } = await pool.query(
            'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
            [email, name, password_hash, role]
        );
        console.log(`[userModel] Successfully created user with ID: ${rows[0].id}`);
        return rows[0];
    } catch (err) {
        console.error('[userModel] Error in createUser:', err);
        throw err;
    }
};

export const findAllUsers = async () => {
    const { rows } = await pool.query('SELECT id, email, name, role FROM users');
    return rows;
}

export const findUserById = async (id) => {
    const { rows } = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [id]);
    return rows[0];
}

export const updateUser = async (id, { email, name, role }) => {
    const { rows } = await pool.query(
        'UPDATE users SET email = $1, name = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, email, name, role',
        [email, name, role, id]
    );
    return rows[0];
}

export const deleteUser = async (id) => {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
}
