import * as UserModel from '../models/userModel.js';

export const getAllUsers = async () => {
    return await UserModel.findAllUsers();
};

export const getUserById = async (id) => {
    return await UserModel.findUserById(id);
};

export const updateUser = async (id, userData) => {
    return await UserModel.updateUser(id, userData);
};

export const deleteUser = async (id) => {
    return await UserModel.deleteUser(id);
};

export const getUserFields = async () => {
    return await UserModel.findUserFields();
};
