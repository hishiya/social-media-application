import React, { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { getConversations } from '../api/chat';
import Navbar from '../components/Navbar';
import { usePageTitle } from '../hooks/usePageTitle';

const ChatPage: React.FC = () => {
    const navigate = useNavigate();

    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const conversations = useChatStore((state) => state.conversations)
    const setConversations = useChatStore((state) => state.setConversations);
    const isLoading = useChatStore((state) => state.isLoading)
    const setLoading = useChatStore((state) => state.setLoading);

    usePageTitle("Chat");

    useEffect(() => {
        if (!token) return;

        const fetchConversations = async () => {
            setLoading(true);
            try {
                const data = await getConversations(token);
                setConversations(data);
            } catch (err) {
                console.error('Failed to load conversations', err);
            } finally {
                setLoading(false);
            }
        }

        fetchConversations();
    }, [token]);

    const getOtherParticipant = (conversation: (typeof conversations)[0]) => {
        return conversation.participants.find((p) => p._id !== user?.id);
    }

    return (
        // Зовнішній div — займає весь екран, темний фон
        <div className="min-h-screen bg-gray-950 text-white">
            
            {/* Навбар зверху */}
            <Navbar />

            {/* Контейнер з максимальною шириною і відступами */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                
                {/* Заголовок сторінки */}
                <h1 className="text-2xl font-bold mb-6">Повідомлення</h1>

                {/* Умовний рендер: якщо завантажується — спінер */}
                {isLoading ? (
                    // Центруємо спінер
                    <div className="flex justify-center py-10">
                        {/* Анімований круг-спінер через TailwindCSS */}
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : conversations.length === 0 ? (
                    // Якщо немає розмов — показуємо заглушку
                    <p className="text-gray-500 text-center py-10">
                        У тебе ще немає повідомлень. Знайди когось у пошуку!
                    </p>
                ) : (
                    // Список розмов
                    // <ul> — невпорядкований список (семантичний HTML)
                    <ul className="space-y-2">
                        {/* .map() — ітерація масиву, повертає масив JSX елементів */}
                        {conversations.map((conversation) => {
                            // Дістаємо іншого учасника для кожної розмови
                            const other = getOtherParticipant(conversation);

                            // Якщо якось інший учасник не знайдений — пропускаємо
                            if (!other) return null;

                            return (
                                // key — обов'язковий React атрибут для списків
                                // Допомагає React ефективно оновлювати DOM
                                <li
                                    key={conversation._id}
                                    // onClick — при кліку переходимо на сторінку розмови
                                    onClick={() => navigate(`/chat/${conversation._id}`)}
                                    // Стилі: картка розмови з hover-ефектом
                                    className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors"
                                >
                                    {/* Аватарка або заглушка */}
                                    {other.avatar ? (
                                        // Якщо є аватарка — показуємо зображення
                                        <img
                                            src={other.avatar}
                                            alt={other.username}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        // Якщо аватарки нема — показуємо першу літеру імені
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                                            {/* [0] — перший символ, toUpperCase — велика літера */}
                                            {other.username[0].toUpperCase()}
                                        </div>
                                    )}

                                    {/* Права частина: ім'я і дата */}
                                    <div className="flex-1 min-w-0">
                                        {/* min-w-0 — дозволяє тексту обрізатись при overflow */}
                                        <p className="font-semibold">@{other.username}</p>
                                        
                                        {/* Дата останнього повідомлення */}
                                        <p className="text-gray-500 text-sm">
                                            {/* new Date(str) — парсимо ISO рядок в Date об'єкт */}
                                            {/* .toLocaleDateString('uk-UA') — форматуємо по-українськи */}
                                            {new Date(conversation.updatedAt).toLocaleDateString('uk-UA')}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ChatPage;
