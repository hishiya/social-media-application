import { Request, Response } from 'express';
import Tweet from '../models/Tweet';

export const createTweet = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.body.text — текст твіту який клієнт надіслав в тілі POST запиту
        const { text } = req.body;

        if (!text || !text.trim()) {
            res.status(400).json({ message: 'Text is required' });
            return;
        }

        const tweet = new Tweet({
            text,
            author: req.userId,
        })

        await tweet.save();

        res.status(201).json({ tweet });
    } catch (error) {
        console.error('CREATE TWEET ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const getTweets = async (req: Request, res: Response): Promise<void> => {
    try {
        const tweets = await Tweet
            .find()
            // .populate('author') — замінює author (ObjectId) на реальний об'єкт юзера з БД
            // другий аргумент 'username avatar' — вибираємо тільки ці два поля (не повертаємо email, passwordHash і т.д.)
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 });

            res.status(200).json({ tweets });
    } catch (error) {
        console.error('GET FEED ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const deleteTweet = async (req: Request, res: Response): Promise<void> => {
    try {
        const tweet = await Tweet.findById(req.params.id);

        if (!tweet) {
            res.status(404).json({ message: 'Tweet not found' });
            return;
        }

        if (tweet.author.toString() !== req.userId) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }

        await tweet.deleteOne();

        res.status(200).json({ message: 'Tweet deleted' });
    } catch (error) {
        console.error('DELETE TWEET ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const likeTweet = async (req: Request, res: Response): Promise<void> => {
    try {
        const tweet = await Tweet.findById(req.params.id);

        if (!tweet) {
            res.status(404).json({ message: 'Tweet not found' });
            return;
        }

        const alreadyLiked = tweet.likes.some(
            (id) => id.toString() === req.userId
        )

        if (alreadyLiked)  {
            tweet.likes = tweet.likes.filter(
                (id) => id.toString() !== req.userId
            )
        } else {
            tweet.likes.push(req.userId as any);
        }

        await tweet.save();
        res.status(200).json({ tweet });
    } catch (error) {
        console.error('LIKE TWEET ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}