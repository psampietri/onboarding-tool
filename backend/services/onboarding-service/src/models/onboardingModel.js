import pool from 'database';

export const createOnboardingInstance = async (userId, templateId, assignedBy) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const instanceRes = await client.query(
            'INSERT INTO onboarding_instances (user_id, onboarding_template_id, assigned_by) VALUES ($1, $2, $3) RETURNING *',
            [userId, templateId, assignedBy]
        );
        const instance = instanceRes.rows[0];

        const tasksRes = await client.query(
            'SELECT task_template_id FROM onboarding_template_tasks WHERE onboarding_template_id = $1',
            [templateId]
        );

        for (const task of tasksRes.rows) {
            await client.query(
                'INSERT INTO task_instances (onboarding_instance_id, task_template_id) VALUES ($1, $2)',
                [instance.id, task.task_template_id]
            );
        }

        await client.query('COMMIT');
        return instance;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const findAllOnboardingInstances = async () => {
    const { rows } = await pool.query(
        `SELECT oi.id, oi.status, oi.created_at, u.name as user_name, a.name as admin_name, ot.name as template_name
         FROM onboarding_instances oi
         JOIN users u ON oi.user_id = u.id
         JOIN users a ON oi.assigned_by = a.id
         JOIN onboarding_templates ot ON oi.onboarding_template_id = ot.id
         ORDER BY oi.created_at DESC`
    );
    return rows;
};

export const findOnboardingInstanceById = async (id) => {
    const instanceRes = await pool.query(
        `SELECT oi.*, u.name as user_name, a.name as admin_name
         FROM onboarding_instances oi
         JOIN users u ON oi.user_id = u.id
         JOIN users a ON oi.assigned_by = a.id
         WHERE oi.id = $1`,
        [id]
    );
    if (instanceRes.rows.length === 0) {
        return null;
    }
    const instance = instanceRes.rows[0];

    const tasksRes = await pool.query(
        `SELECT 
            ti.*, 
            tt.name, 
            tt.description, 
            tt.task_type,
            COALESCE(deps.dependencies, '[]'::json) as dependencies
         FROM task_instances ti
         JOIN task_templates tt ON ti.task_template_id = tt.id
         LEFT JOIN (
             SELECT 
                 task_template_id, 
                 json_agg(depends_on_id) as dependencies
             FROM task_template_dependencies
             GROUP BY task_template_id
         ) deps ON ti.task_template_id = deps.task_template_id
         WHERE ti.onboarding_instance_id = $1
         ORDER BY ti.id`,
        [id]
    );
    instance.tasks = tasksRes.rows;
    return instance;
};

export const findTasksByUserId = async (userId) => {
    const { rows } = await pool.query(
        `SELECT 
            ti.*, 
            tt.name, 
            tt.description, 
            tt.task_type,
            COALESCE(deps.dependencies, '[]'::json) as dependencies
         FROM task_instances ti
         JOIN onboarding_instances oi ON ti.onboarding_instance_id = oi.id
         JOIN task_templates tt ON ti.task_template_id = tt.id
         LEFT JOIN (
             SELECT 
                 task_template_id, 
                 json_agg(depends_on_id) as dependencies
             FROM task_template_dependencies
             GROUP BY task_template_id
         ) deps ON ti.task_template_id = deps.task_template_id
         WHERE oi.user_id = $1 AND oi.status != 'completed'`,
        [userId]
    );
    return rows;
};

export const updateTaskInstance = async (taskId, status, ticketInfo) => {
    const { rows } = await pool.query(
        'UPDATE task_instances SET status = $1, ticket_info = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [status, ticketInfo, taskId]
    );
    return rows[0];
};
