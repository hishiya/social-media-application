import { Request, Response } from "express";
import Tweet from "../models/Tweet";
import User from "../models/User";

export const createTweet = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { text, media } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ message: "Text is required" });
      return;
    }

    const mediaUrls: string[] = Array.isArray(media) ? media : [];

    const tweet = new Tweet({
      text,
      author: req.userId,
      media: mediaUrls,
    });

    await tweet.save();

    await tweet.populate("author", "username avatar");

    res.status(201).json({ tweet });
  } catch (error) {
    console.error("CREATE TWEET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTweets = async (req: Request, res: Response): Promise<void> => {
  try {
    const tweets = await Tweet.find()

      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ tweets });
  } catch (error) {
    console.error("GET FEED ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTweetsByUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const tweets = await Tweet.find({ author: user._id })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ tweets });
  } catch (error) {
    console.error("GET USER TWEETS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTweet = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      res.status(404).json({ message: "Tweet not found" });
      return;
    }

    if (tweet.author.toString() !== req.userId) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }

    await tweet.deleteOne();

    res.status(200).json({ message: "Tweet deleted" });
  } catch (error) {
    console.error("DELETE TWEET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const likeTweet = async (req: Request, res: Response): Promise<void> => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      res.status(404).json({ message: "Tweet not found" });
      return;
    }

    const alreadyLiked = tweet.likes.some((id) => id.toString() === req.userId);

    if (alreadyLiked) {
      tweet.likes = tweet.likes.filter((id) => id.toString() !== req.userId);
    } else {
      tweet.likes.push(req.userId as any);
    }

    await tweet.save();
    await tweet.populate("author", "username avatar");
    res.status(200).json({ tweet });
  } catch (error) {
    console.error("LIKE TWEET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const editTweet = async (req: Request, res: Response): Promise<void> => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      res.status(404).json({ message: "Tweet not found" });
      return;
    }

    if (tweet.author.toString() !== req.userId) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ message: "Text is required" });
      return;
    }

    tweet.text = text.trim();
    tweet.isEdited = true;

    await tweet.save();
    await tweet.populate("author", "username avatar");
    res.status(200).json({ tweet });
  } catch (error) {
    console.error("EDIT TWEET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
