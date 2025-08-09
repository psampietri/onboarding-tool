import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../models/userModel.js';

const SECRET_KEY = process.env.SECRET_KEY;

export const registerUser = async (email, name, password, role = 'user') => {
    console.log(`[authService] Registering user: ${email}`);
    
    console.log('[authService] Checking if user exists...');
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        console.log('[authService] User already exists.');
        throw new Error('User with this email already exists.');
    }
    console.log('[authService] User does not exist. Proceeding to hash password.');

    console.log('[authService] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[authService] Password hashed successfully.');

    console.log('[authService] Creating user in database...');
    const newUser = await createUser(email, name, hashedPassword, role);
    console.log('[authService] User created successfully.');
    
    return newUser;
};

export const loginUser = async (email, password) => {
    console.log(`[authService] Attempting login for: ${email}`);
    
    const user = await findUserByEmail(email);
    if (!user) {
        console.log('[authService] Login failed: User not found.');
        throw new Error('Invalid credentials.');
    }

    console.log('[authService] User found. Comparing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        console.log('[authService] Login failed: Invalid password.');
        throw new Error('Invalid credentials.');
    }
    console.log('[authService] Password is valid.');

    console.log('[authService] Generating JWT...');
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    console.log('[authService] JWT generated.');

    // eslint-disable-next-line no-unused-vars
    const { password_hash, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
};
