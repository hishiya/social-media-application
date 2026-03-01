import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const authHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    }
})

export interface Reply {
    _id: string;
    text: string;
    author: {
        _id: string;
        username: string;
        avatar: string;
    };
    tweet: string;
    createdAt: string;
}

export const getRepliesByTweet = async (tweetId: string): Promise<Reply[]> => {
    const response = await axios.get<{ replies: Reply[] }>(`${API_URL}/replies/${tweetId}`);
    return response.data.replies;
}

export const createReply = async (tweetId: string, text: string): Promise<Reply> => {
    const response = await axios.post<{ reply: Reply }>(
        `${API_URL}/replies/${tweetId}`,
        { text },
        authHeader()
    );
    return response.data.reply;
}

export const deleteReply = async (replyId: string): Promise<void> => {
    await axios.delete(`${API_URL}/replies/${replyId}`, authHeader());
}
    
