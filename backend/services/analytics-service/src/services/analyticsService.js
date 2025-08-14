import pool from '../../../../database/index.js';
import { subDays, format } from 'date-fns';

/**
 * Formats a PostgreSQL interval object into a readable "Xd Yh" string.
 * @param {object} interval - The interval object from the database (e.g., { days: 2, hours: 6 }).
 * @returns {string} A formatted string like "2d 6h" or "N/A".
 */
const formatLeadTime = (interval) => {
    if (!interval) return 'N/A';
    const days = interval.days || 0;
    const hours = interval.hours || 0;
    return `${days}d ${hours}h`;
};

/**
 * Calculates the average lead time for tasks from 'in_progress' to 'completed'.
 */
const getAverageTaskLeadTime = async () => {
    try {
        console.log('[Analytics] Calculating average task lead time...');
        const { rows } = await pool.query(`
            SELECT AVG(task_completed_at - task_started_at) AS avg_lead_time
            FROM task_instances
            WHERE status = 'completed' AND task_started_at IS NOT NULL AND task_completed_at IS NOT NULL;
        `);
        console.log('[Analytics] Task lead time query successful.');
        return formatLeadTime(rows[0]?.avg_lead_time);
    } catch (error) {
        console.error('[Analytics] ERROR in getAverageTaskLeadTime:', error);
        throw error; // Re-throw to be caught by getKpis
    }
};

/**
 * Calculates the average lead time for tickets from creation to closure.
 */
const getAverageTicketLeadTime = async () => {
    try {
        console.log('[Analytics] Calculating average ticket lead time...');
        const { rows } = await pool.query(`
            SELECT AVG(ticket_closed_at - ticket_created_at) AS avg_lead_time
            FROM task_instances
            WHERE ticket_info IS NOT NULL AND ticket_created_at IS NOT NULL AND ticket_closed_at IS NOT NULL;
        `);
        console.log('[Analytics] Ticket lead time query successful.');
        return formatLeadTime(rows[0]?.avg_lead_time);
    } catch (error) {
        console.error('[Analytics] ERROR in getAverageTicketLeadTime:', error);
        throw error;
    }
};

/**
 * Calculates the average completion time for the entire onboarding process.
 */
const getAverageOnboardingTime = async () => {
    try {
        console.log('[Analytics] Calculating average onboarding time...');
        const { rows } = await pool.query(`
            SELECT AVG(updated_at - created_at) as avg_time 
            FROM onboarding_instances 
            WHERE status = 'completed'
        `);
        console.log('[Analytics] Onboarding time query successful.');
        return formatLeadTime(rows[0]?.avg_time);
    } catch (error) {
        console.error('[Analytics] ERROR in getAverageOnboardingTime:', error);
        throw error;
    }
};

export const getKpis = async () => {
    console.log('[Analytics] getKpis called.');
    try {
        const [
            instancesRes, 
            usersRes, 
            taskLeadTime, 
            ticketLeadTime, 
            averageCompletionTime
        ] = await Promise.all([
            pool.query('SELECT status FROM onboarding_instances'),
            pool.query('SELECT COUNT(*) FROM users'),
            getAverageTaskLeadTime(),
            getAverageTicketLeadTime(),
            getAverageOnboardingTime()
        ]);
        console.log('[Analytics] All KPI queries completed.');

        const activeOnboardings = instancesRes.rows.filter(i => i.status === 'in_progress').length;
        const completedOnboardings = instancesRes.rows.filter(i => i.status === 'completed').length;
        const totalUsers = parseInt(usersRes.rows[0].count, 10);
        const completionRate = instancesRes.rows.length > 0
            ? Math.round((completedOnboardings / instancesRes.rows.length) * 100)
            : 0;

        const kpis = {
            activeOnboardings,
            totalUsers,
            averageCompletionTime,
            completionRate,
            taskLeadTime,
            ticketLeadTime
        };
        console.log('[Analytics] KPIs calculated:', kpis);
        return kpis;
    } catch (error) {
        console.error('[Analytics] FATAL ERROR in getKpis:', error);
        throw error; // Re-throw to send 500 response
    }
};

export const getChartData = async () => {
    const [statusDistributionRes, taskTypeDistributionRes, completionTrendRes, startedTrendRes] = await Promise.all([
        pool.query("SELECT status as name, COUNT(*) as value FROM onboarding_instances GROUP BY status"),
        pool.query(`
            SELECT tt.task_type as name, COUNT(ti.id) as value
            FROM task_instances ti
            JOIN task_templates tt ON ti.task_template_id = tt.id
            GROUP BY tt.task_type
        `),
        pool.query(`
            SELECT date_trunc('day', updated_at)::date AS day, COUNT(*) AS completed_count
            FROM onboarding_instances
            WHERE status = 'completed' AND updated_at >= CURRENT_DATE - interval '13 days'
            GROUP BY day
        `),
        pool.query(`
            SELECT created_at::date AS day, COUNT(*) AS started_count
            FROM onboarding_instances
            WHERE created_at >= CURRENT_DATE - interval '13 days'
            GROUP BY day
        `)
    ]);

    const trendData = {};
    for (let i = 13; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateKey = format(date, 'yyyy-MM-dd');
        trendData[dateKey] = { date: format(date, 'MMM dd'), started: 0, completed: 0 };
    }

    startedTrendRes.rows.forEach(row => {
        const dateKey = format(new Date(row.day), 'yyyy-MM-dd');
        if (trendData[dateKey]) {
            trendData[dateKey].started = parseInt(row.started_count, 10);
        }
    });

    completionTrendRes.rows.forEach(row => {
        const dateKey = format(new Date(row.day), 'yyyy-MM-dd');
        if (trendData[dateKey]) {
            trendData[dateKey].completed = parseInt(row.completed_count, 10);
        }
    });

    return {
        statusDistribution: statusDistributionRes.rows,
        taskTypeDistribution: taskTypeDistributionRes.rows,
        completionTrend: Object.values(trendData)
    };
};
