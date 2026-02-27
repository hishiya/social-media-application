import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const authHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
})

export interface UserProfile {
    _id: string;
    username: string;
    bio: string;
    avatar: string;
    followers: { _id: string; username: string; avatar: string }[];
    following: { _id: string; username: string; avatar: string }[];
    createdAt: string;
}

export interface UpdateProfileData {
    username?: string;
    bio?: string;
    avatar?: string;
    currentPassword?: string;
    newPassword?: string;
}

export interface UpdatedUser {
    id: string;
    username: string;
    email: string;
    bio: string;
    avatar: string;
}

export const getProfile = async (username: string): Promise<UserProfile> => {
    const response = await axios.get<{ user: UserProfile }>(`${API_URL}/users/${username}`)
    return response.data.user;
}

export const followUser = async (userId: string): Promise<void> => {
    await axios.post(`${API_URL}/users/${userId}/follow`, {}, authHeader());
}

export const updateProfile = async (data: UpdateProfileData): Promise<UpdatedUser> => {
    const response = await axios.put<{ user: UpdatedUser }>(`${API_URL}/users/me`, data, authHeader());
    return response.data.user;
}