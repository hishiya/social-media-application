import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface SearchUser {
    _id: string;
    username: string;
    avatar: string;
    bio: string;
}

export interface SearchTweet {
    _id: string;
    text: string;
    author: {
        _id: string;
        username: string;
        avatar: string;
    };
    likes: string[];
    createdAt: string;
}

interface SearchResponse {
    users: SearchUser[];
    tweets: SearchTweet[];
}

export const search = async (q: string): Promise<SearchResponse> => {
    const response = await axios.get<SearchResponse>(`${API_URL}/search?q=${encodeURIComponent(q)}`);
    return response.data;
}