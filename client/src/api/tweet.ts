import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface Tweet {
    _id: string;
    text: string;
    author: {
        _id: string;
        username: string;
        avatar: string;
    };
    likes: string[];
    media: string[];
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
}

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});


export const getTweets = async (): Promise<Tweet[]> => {
    const response = await axios.get<{ tweets: Tweet[] }>(`${API_URL}/tweets`);
    return response.data.tweets;
}

export const getTweetsByUser = async (username: string): Promise<Tweet[]> => {
    const response = await axios.get<{ tweets: Tweet[] }>(`${API_URL}/tweets/user/${username}`);
    return response.data.tweets;
}

export const createTweet = async (text: string, media: string[] = []): Promise<Tweet> => {
    const response = await axios.post<{ tweet: Tweet}>(`${API_URL}/tweets`, { text, media }, authHeader());
    return response.data.tweet;
}

export const likeTweet = async (tweetId: string): Promise<Tweet> => {
    const response = await axios.post<{ tweet: Tweet }>(`${API_URL}/tweets/${tweetId}/like`, {}, authHeader());
    return response.data.tweet;
}

export const deleteTweet = async (tweetId: string): Promise<void> => {
    await axios.delete(`${API_URL}/tweets/${tweetId}`, authHeader());
}

export const editTweet = async (tweetId: string, text: string): Promise<Tweet> => {
    const response = await axios.patch<{ tweet: Tweet }>(
        `${API_URL}/tweets/${tweetId}`,
        { text },
        authHeader()
    )
    return response.data.tweet;
}

export const uploadMedia = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file)

    const response = await axios.post<{ url: string }>(
        `${API_URL}/upload`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            }
        }
    )
    return response.data.url;   
}
