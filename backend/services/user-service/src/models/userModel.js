import pool from 'database';

export const findUserByEmail = async (email) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
};

export const createUser = async (email, name, password_hash, role) => {
    const { rows } = await pool.query(
        'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        [email, name, password_hash, role]
    );
    return rows[0];
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

export const findUserFields = async () => {
    const { rows } = await pool.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = 'users' AND column_name NOT LIKE '%_hash' AND column_name NOT LIKE '%_at'`
    );
    return rows.map(row => row.column_name);
};
