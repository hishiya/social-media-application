import React, { useEffect, useRef, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";

import { getMessages, deleteMessage } from "../api/chat";
import socket from "../socket";

import Navbar from "../components/Navbar";
import { usePageTitle } from "../hooks/usePageTitle";

const ConversationPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();

  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const [inputText, setInputText] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  usePageTitle("Conversation");

  useEffect(() => {
    if (!token || !conversationId) return;

    const fetchMessages = async () => {
      try {
        const data = await getMessages(token, conversationId);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };

    fetchMessages();

    if (!socket.connected) {
      socket.auth = { token };
      socket.connect();
    }

    socket.emit("join_conversation", { conversationId });

    const handleNewMessage = (message: Parameters<typeof addMessage>[0]) => {
      addMessage(message);
    };

    socket.on("new_message", handleNewMessage);

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      removeMessage(messageId);
    };

    socket.on("message_deleted", handleMessageDeleted);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [conversationId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !conversationId) return;

    socket.emit("send_message", {
      conversationId,
      text: inputText.trim(),
    });

    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!token) return;

    try {
      await deleteMessage(token, messageId);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto w-full px-4 pt-4">
        <button
          onClick={() => navigate("/chat")}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-2"
        >
          ← Назад до повідомлень
        </button>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 overflow-y-auto flex flex-col gap-2 py-4">
        {messages.map((message) => {
          const isOwn = message.sender._id === user?.id;

          return (
            <div
              key={message._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
            >
              <div
                className={`flex items-end gap-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                    isOwn
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-800 text-white rounded-bl-sm"
                  } ${message.isDeleted ? "opacity-50" : ""}`}
                >
                  {message.isDeleted ? (
                    <p className="italic text-gray-300 text-xs">
                      Повідомлення видалено
                    </p>
                  ) : (
                    <>
                      <p className="break-words">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${isOwn ? "text-blue-200" : "text-gray-400"}`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString(
                          "uk-UA",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </>
                  )}

                  {isOwn && !message.isDeleted && (
                    <button
                      onClick={() => handleDeleteMessage(message._id)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-gray-400 hover:text-red-400 rounded-full p-1 shadow-md"
                      title="Видалити"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-3 h-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pb-4">
        <div className="flex gap-2 bg-gray-900 rounded-xl p-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Написати повідомлення... (Enter — відправити)"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm placeholder-gray-500 py-2 px-2"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Надіслати
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
