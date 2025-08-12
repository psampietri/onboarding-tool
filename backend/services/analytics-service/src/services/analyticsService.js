import * as AnalyticsModel from '../models/analyticsModel.js';

export const getOnboardingKPIs = async () => {
    const avgHours = await AnalyticsModel.getAverageCompletionTime();
    const activeOnboardings = await AnalyticsModel.countActiveOnboardings();
    const completedOnboardings = await AnalyticsModel.countCompletedOnboardings();
    const totalOnboardings = activeOnboardings + completedOnboardings;
    const totalUsers = await AnalyticsModel.countTotalUsers();

    let averageCompletionTime = null;
    if (avgHours !== null) {
        const days = Math.floor(avgHours / 24);
        const hours = Math.round(avgHours % 24);
        averageCompletionTime = { days, hours };
    }

    const completionRate = totalOnboardings > 0 ? Math.round((completedOnboardings / totalOnboardings) * 100) : 0;

    return {
        averageCompletionTime,
        activeOnboardings,
        completedOnboardings,
        totalUsers,
        completionRate
    };
};

export const getChartData = async () => {
    const [statusDistribution, taskTypeDistribution, completionTrend] = await Promise.all([
        AnalyticsModel.getStatusDistribution(),
        AnalyticsModel.getTaskTypeDistribution(),
        AnalyticsModel.getCompletionTrend()
    ]);

    return {
        statusDistribution,
        taskTypeDistribution,
        completionTrend
    };
};
