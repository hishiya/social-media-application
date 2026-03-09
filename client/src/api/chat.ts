import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface Participant {
    _id: string;
    username: string;
    avatar: string;
}

export interface Conversation {
    _id: string;
    participants: Participant[];
    updatedAt: string;
}

export interface Message {
    _id: string;
    conversation: string;
    sender: Participant;
    text: string;
    createdAt: string;
    isDeleted: boolean;
}

export const getConversations = async (token: string): Promise<Conversation[]> => {
    const response = await axios.get<{ conversations: Conversation[] }>(
        `${API_URL}/chat/conversations`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    )
    return response.data.conversations;
}

export const getOrCreateConversation = async (
    token: string,
    userId: string
): Promise<Conversation> => {
    const response = await axios.post<{ conversation: Conversation}>(
        `${API_URL}/chat/conversations/${userId}`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    )
    return response.data.conversation;
}

export const getMessages = async (
    token: string,
    conversationId: string,
    page: number = 1,
): Promise<Message[]> => {
    const response = await axios.get<{ messages: Message[] }>(
        `${API_URL}/chat/conversations/${conversationId}/messages`,
        {
            params: { page },
            headers: { Authorization: `Bearer ${token}` },
        }
    )
    return response.data.messages;
}

export const deleteMessage = async (
    token: string,
    messageId: string,
): Promise<void> => {
    await axios.delete(
        `${API_URL}/chat/messages/${messageId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    )
}