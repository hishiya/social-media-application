import { Request, Response } from 'express';
import Reply from '../models/Reply';
import Tweet from '../models/Tweet';

export const createReply = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tweetId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            res.status(400).json({ message: 'Текст відповіді ообов\'язковий' });
            return;
        }

        const tweet = await Tweet.findById(tweetId)
        if (!tweet) {
            res.status(404).json({ message: 'Твіт не знайдено' });
            return;
        }

        const reply = new Reply({
            text,
            author: req.userId,
            tweet: tweetId,
        })

        await reply.save();
        await reply.populate('author', 'username avatar');

        res.status(201).json({ reply });
    } catch (error) {
        console.error('CREATE REPLY ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const getRepliesByTweet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tweetId } = req.params;

        const replies = await Reply
            .find({ tweet: tweetId })
            .populate('author', 'username avatar')
            .sort({ createdAt: 1 });

        res.status(200).json({ replies });
    } catch (error) {
        console.error('GET REPLIES ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const deleteReply = async (req: Request, res: Response): Promise<void> => {
    try {
        const { replyId } = req.params;

        const reply = await Reply.findById(replyId);

        if (!reply) {
            res.status(404).json({ message: 'Відповідь не знайдено' });
            return;
        }

        if (reply.author.toString() !== req.userId) {
            res.status(403).json({ message: 'Немає прав на видалення' });
            return;
        } 

        await reply.deleteOne();
        res.status(200).json({ message: 'Відповідь видалена' });
    } catch (error) {
        console.error('DELETE REPLY ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}