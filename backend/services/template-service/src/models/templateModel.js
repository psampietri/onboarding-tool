import pool from 'database';

// --- Onboarding Templates ---

export const createOnboardingTemplate = async ({ name, description, created_by, tasks }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            'INSERT INTO onboarding_templates (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
            [name, description, created_by]
        );
        const newTemplate = rows[0];

        if (tasks && tasks.length > 0) {
            for (const task of tasks) {
                await client.query(
                    'INSERT INTO onboarding_template_tasks (onboarding_template_id, task_template_id, "order") VALUES ($1, $2, $3)',
                    [newTemplate.id, task.id, task.order]
                );
            }
        }
        await client.query('COMMIT');
        return newTemplate;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const findAllOnboardingTemplates = async () => {
    const { rows } = await pool.query('SELECT * FROM onboarding_templates ORDER BY name');
    return rows;
};

export const findOnboardingTemplateById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM onboarding_templates WHERE id = $1', [id]);
    return rows[0];
};

export const updateOnboardingTemplate = async (id, { name, description, tasks }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            'UPDATE onboarding_templates SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [name, description, id]
        );
        const updatedTemplate = rows[0];

        await client.query('DELETE FROM onboarding_template_tasks WHERE onboarding_template_id = $1', [id]);

        if (tasks && tasks.length > 0) {
            for (const task of tasks) {
                await client.query(
                    'INSERT INTO onboarding_template_tasks (onboarding_template_id, task_template_id, "order") VALUES ($1, $2, $3)',
                    [updatedTemplate.id, task.id, task.order]
                );
            }
        }
        await client.query('COMMIT');
        return updatedTemplate;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const deleteOnboardingTemplate = async (id) => {
    await pool.query('DELETE FROM onboarding_templates WHERE id = $1', [id]);
};

// --- Task Templates ---

export const createTaskTemplate = async ({ name, description, task_type, config, created_by }) => {
    const { rows } = await pool.query(
        'INSERT INTO task_templates (name, description, task_type, config, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, description, task_type, config, created_by]
    );
    return rows[0];
};

export const findAllTaskTemplates = async () => {
    const { rows } = await pool.query('SELECT * FROM task_templates ORDER BY name');
    return rows;
};

export const findTaskTemplateById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM task_templates WHERE id = $1', [id]);
    return rows[0];
};

export const updateTaskTemplate = async (id, { name, description, task_type, config }) => {
    const { rows } = await pool.query(
        'UPDATE task_templates SET name = $1, description = $2, task_type = $3, config = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [name, description, task_type, config, id]
    );
    return rows[0];
};

export const deleteTaskTemplate = async (id) => {
    await pool.query('DELETE FROM task_templates WHERE id = $1', [id]);
};
