import api from './api';

export const getUserFields = async () => {
    const response = await api.get('/users/fields');
    return response.data;
};
