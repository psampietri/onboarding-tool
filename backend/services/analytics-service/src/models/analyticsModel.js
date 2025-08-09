import pool from 'database';

export const getAverageCompletionTime = async () => {
    const { rows } = await pool.query(
        `SELECT AVG(updated_at - created_at) as avg_time
         FROM onboarding_instances
         WHERE status = 'completed'`
    );
    // This will return an interval type from Postgres, you might need to format it.
    return rows[0]?.avg_time;
};

export const countActiveOnboardings = async () => {
    const { rows } = await pool.query(
        "SELECT COUNT(*) FROM onboarding_instances WHERE status = 'in_progress'"
    );
    return parseInt(rows[0].count, 10);
};

export const countCompletedOnboardings = async () => {
    const { rows } = await pool.query(
        "SELECT COUNT(*) FROM onboarding_instances WHERE status = 'completed'"
    );
    return parseInt(rows[0].count, 10);
};
