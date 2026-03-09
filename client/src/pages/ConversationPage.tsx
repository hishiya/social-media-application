import React, { useEffect, useRef, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

import { getMessages, deleteMessage } from '../api/chat';
import socket from '../socket';

import Navbar from '../components/Navbar';

const ConversationPage: React.FC = () => {
    const { conversationId } = useParams<{ conversationId: string }>();

    const navigate = useNavigate();

    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const messages = useChatStore((state) => state.messages);
    const setMessages = useChatStore((state) => state.setMessages);
    const addMessage = useChatStore((state) => state.addMessage);
    const removeMessage = useChatStore((state) => state.removeMessage)
    const [inputText, setInputText] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Якщо немає токена або ID розмови — нічого не робимо
        if (!token || !conversationId) return;

        // Завантажуємо початкові повідомлення через REST API
        const fetchMessages = async () => {
            try {
                const data = await getMessages(token, conversationId);
                setMessages(data); // зберігаємо в стор
            } catch (err) {
                console.error('Failed to load messages:', err);
            }
        };

        fetchMessages();

        // Підключаємо сокет з токеном (якщо ще не підключений)
        // socket.auth — об'єкт що передається в handshake при connect()
        // Наш socket.ts middleware читає socket.handshake.auth.token
        if (!socket.connected) {
            // Встановлюємо auth перед підключенням
            socket.auth = { token }; // передаємо JWT для авторизації
            socket.connect(); // тепер підключаємось
        }

        // Надсилаємо подію join_conversation — join кімнату на сервері
        // socket.emit(event, data) — відправляємо подію на сервер
        socket.emit('join_conversation', { conversationId });

        // Слухаємо нові повідомлення
        // socket.on(event, callback) — підписуємось на подію 'new_message'
        // callback отримає дані що сервер передав в io.to(room).emit('new_message', data)
        const handleNewMessage = (message: Parameters<typeof addMessage>[0]) => {
            // Parameters<typeof addMessage>[0] — TypeScript: дістаємо тип першого параметра addMessage
            // Це еквівалентно Message з chatStore
            addMessage(message); // додаємо повідомлення в стор
        };

        // Реєструємо обробник
        socket.on('new_message', handleNewMessage);

        const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
            removeMessage(messageId); // позначаємо повідомлення як видалене в сторі
        }

        socket.on('message_deleted', handleMessageDeleted);

        // Функція очистки — useEffect може повертати функцію
        // Вона викликається при unmount компонента або при зміні залежностей
        return () => {
            // Відписуємось від події 'new_message' — щоб не накопичувались обробники
            // socket.off(event, callback) — видаляє конкретний обробник
            socket.off('new_message', handleNewMessage);
            socket.off('message_deleted', handleMessageDeleted);
            // Не відключаємо сокет при виході зі сторінки —
            // щоб він залишався для інших сторінок
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, token]); // перезапускати якщо змінився ID розмови або токен

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim() || !conversationId) return;

        socket.emit('send_message', {
            conversationId,
            text: inputText.trim(),
        })

        setInputText('');
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        if (!token) return;

        try {
            await deleteMessage(token, messageId);
        } catch (err) {
            console.error('Failed to delete message:', err);
        }
    }

    return (
        // Зовнішній div: занімає весь екран, flex column (вертикально)
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            
            <Navbar />

            {/* Кнопка назад */}
            <div className="max-w-2xl mx-auto w-full px-4 pt-4">
                <button
                    onClick={() => navigate('/chat')}
                    className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-2"
                >
                    {/* ← символ стрілки */}
                    ← Назад до повідомлень
                </button>
            </div>

            {/* Контейнер чату: займає весь залишок висоти (flex-1), скролиться */}
            <div className="flex-1 max-w-2xl mx-auto w-full px-4 overflow-y-auto flex flex-col gap-2 py-4">
                
                {/* Рендеримо кожне повідомлення */}
                {messages.map((message) => {
                    const isOwn = message.sender._id === user?.id;

                    return (
                        <div
                            key={message._id}
                            // group — Tailwind клас який активує group-hover на дочірніх елементах
                            // При наведенні на цей div — з'являється кнопка видалення
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                        >
                            {/* Обгортка бульбашки + кнопка */}
                            <div className={`flex items-end gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

                                {/* Бульбашка повідомлення */}
                                {/* relative — щоб кнопка видалення позиціонувалась відносно цього div */}
                                <div
                                    className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                                        isOwn
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-gray-800 text-white rounded-bl-sm'
                                    } ${message.isDeleted ? 'opacity-50' : ''}`}
                                >
                                    {message.isDeleted ? (
                                        <p className="italic text-gray-300 text-xs">Повідомлення видалено</p>
                                    ) : (
                                        <>
                                            <p className="break-words">{message.text}</p>
                                            <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(message.createdAt).toLocaleTimeString('uk-UA', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </>
                                    )}

                                    {/* Кнопка видалення — абсолютно позиційована у верхньому правому куті бульбашки */}
                                    {/* absolute — позиціонування відносно батьківського relative div */}
                                    {/* -top-2 -right-2 — трохи виходить за межі бульбашки вгору і вправо */}
                                    {isOwn && !message.isDeleted && (
                                        <button
                                            onClick={() => handleDeleteMessage(message._id)}
                                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-gray-400 hover:text-red-400 rounded-full p-1 shadow-md"
                                            title="Видалити"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Невидимий div в самому кінці — до нього скролимо */}
                <div ref={messagesEndRef} />
            </div>

            {/* Нижня панель вводу */}
            <div className="max-w-2xl mx-auto w-full px-4 pb-4">
                <div className="flex gap-2 bg-gray-900 rounded-xl p-2">
                    
                    {/* textarea — поле вводу з підтримкою переносу рядків */}
                    <textarea
                        // value і onChange — controlled component
                        // React контролює значення через стейт
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)} // e.target.value — поточне значення
                        onKeyDown={handleKeyDown} // обробник Enter
                        placeholder="Написати повідомлення... (Enter — відправити)"
                        rows={1} // початкова висота — 1 рядок
                        className="flex-1 bg-transparent resize-none outline-none text-sm placeholder-gray-500 py-2 px-2"
                    />

                    {/* Кнопка відправки */}
                    <button
                        onClick={handleSend}
                        // Вимкнена якщо текст порожній
                        disabled={!inputText.trim()}
                        className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Надіслати
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConversationPage;