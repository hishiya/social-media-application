import { Request, Response } from 'express';
import User from '../models/User';
import { comparePassword, hashPassword } from '../utils/password';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User
            .findOne({ username: req.params.username })
            .select('-passwordHash')
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.status(200).json({ user });
    } catch (error) {
        console.error('GET PROFILE ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const followUser = async (req: Request, res: Response): Promise<void> => {
    try {

        if (req.params.id === req.userId) {
            res.status(400).json({ message: 'You cannot follow yourself' });
            return;
        }

        const [targetUser, currentUser] = await Promise.all([
            User.findById(req.params.id),
            User.findById(req.userId),
        ])

        if (!targetUser || !currentUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isFollowing = currentUser.following.some(
            (id) => id.toString() === req.params.id
        );
        
        if (isFollowing) {
            currentUser.following = currentUser.following.filter(
                (id) => id.toString() !== req.params.id
            );
            targetUser.followers = targetUser.followers.filter(
                (id) => id.toString() !== req.userId
            );
        } else {
            currentUser.following.push(targetUser._id);
            targetUser.followers.push(currentUser._id);
        }

        await Promise.all([currentUser.save(), targetUser.save()]);

        const message = isFollowing ? 'User unfollowed' : 'User followed';
        res.status(200).json({ message });


    } catch (error) {
        console.error('FOLLOW USER ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const { username, bio, avatar, currentPassword, newPassword } = req.body;

        // Якщо передано новий пароль — перевіряємо поточний
        if (newPassword) {
            if (!currentPassword) {
                res.status(400).json({ message: 'Введіть поточний пароль' });
                return;
            }

            const isMatch = await comparePassword(currentPassword, user.passwordHash);
            if (!isMatch) {
                res.status(400).json({ message: 'Поточний пароль невірний' });
                return;
            }

            user.passwordHash = await hashPassword(newPassword);
        }

        // Якщо username змінюється — перевіримо чи він вже зайнятий
        if (username && username !== user.username) {
            const existing = await User.findOne({ username });
            if (existing) {
                res.status(400).json({ message: 'Це ім\'я вже зайняте' });
                return;
            }
            user.username = username;
        }

        if (bio !== undefined) user.bio = bio;
        if (avatar !== undefined) user.avatar = avatar;

        await user.save();

        res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
            }
        });

    } catch (error) {
        console.error('UPDATE PROFILE ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
}