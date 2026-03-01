import { Request, Response } from 'express';
import User from '../models/User';
import Tweet from '../models/Tweet';

export const search = async (req: Request, res: Response): Promise<void> => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string' || !q.trim()) {
            res.status(400).json({ users: [], tweets: [] });
            return;
        }

        const regex = new RegExp(q.trim(), 'i'); // нечутливый к регистру поиск

        const [users, tweets] = await Promise.all([
            User
                .find({ username: regex })
                .select('username avatar bio')
                .limit(10),

            Tweet
                .find({ text: regex })
                .populate('author', 'username avatar')
                .sort({ createdAt: -1 })
                .limit(20)
        ])
        res.status(200).json({ users, tweets });
    } catch (error) {
        console.error('SEARCH ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}