import { create } from 'zustand';

import type { Conversation, Message } from '../api/chat';

interface ChatState {
    conversations: Conversation[];

    activeConversation: Conversation | null;

    messages: Message[];

    isLoading: boolean;

    setConversations: (conversations: Conversation[]) => void;

    setActiveConversation: (conversation: Conversation | null) => void;

    setMessages: (messages: Message[]) => void;

    addMessage: (message: Message) => void;

    removeMessage: (messageId: string) => void;

    setLoading: (isLoading: boolean) => void;

    reset: () => void;

}

const initialState = {
    conversations: [],
    activeConversation: null,
    messages: [],
    isLoading: false,
}

export const useChatStore = create<ChatState>((set) => ({
    ...initialState,
    setConversations: (conversations) => set({ conversations }),
    setActiveConversation: (conversation) => set({ activeConversation: conversation, messages: []}),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    removeMessage: (messageId) => set((state) => ({ messages: state.messages.map((msg) => msg._id === messageId ? { ...msg, isDeleted: true } : msg) })),
    setLoading: (isLoading) => set({ isLoading }),
    reset: () => set(initialState),
}))