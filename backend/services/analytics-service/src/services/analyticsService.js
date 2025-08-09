import * as AnalyticsModel from '../models/analyticsModel.js';

export const getOnboardingKPIs = async () => {
    const avgCompletionTime = await AnalyticsModel.getAverageCompletionTime();
    const activeOnboardings = await AnalyticsModel.countActiveOnboardings();
    const completedOnboardings = await AnalyticsModel.countCompletedOnboardings();

    return {
        averageCompletionTimeHours: avgCompletionTime,
        activeOnboardings,
        completedOnboardings,
    };
};
