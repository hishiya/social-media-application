import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface AuthResponse {
    token: string
    user: {
        id: string
        username: string
        email: string
    }
}

export const register = async (
    username: string,
    email: string,
    password: string
): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/register`, {
        username,
        email,
        password
    });
    return response.data;
}

export const login = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
        email,
        password
    });
    return response.data;
}


