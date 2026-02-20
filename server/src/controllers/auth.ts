import { Request, Response } from 'express';
import User from '../models/User';

import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/token';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Деструктуризація даних з тіла запиту який клієнт відправив на сервер
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        // $or — це MongoDB оператор "або": знайди де email збігається АБО username збігається
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            //409 Conflict - стандартний статус коли ресурс вже існує
            res.status(409).json({ message: 'Email or username already taken' });
            return;
        }

        const passwordHash = await hashPassword(password);

        const user = await new User({ username, email, passwordHash }).save();

        const token = generateToken(user._id.toString());

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
        });
    } catch (error) {
        console.error('REGISTER ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isMatch = await comparePassword(password, user.passwordHash);

        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const token = generateToken(user._id.toString());

        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
 
    } catch (error) {
        console.error('LOGIN ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const me = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({ user });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}
