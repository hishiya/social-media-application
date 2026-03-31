import React, { useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { getConversations } from "../api/chat";
import Navbar from "../components/Navbar";
import { usePageTitle } from "../hooks/usePageTitle";

const ChatPage: React.FC = () => {
  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const conversations = useChatStore((state) => state.conversations);
  const setConversations = useChatStore((state) => state.setConversations);
  const isLoading = useChatStore((state) => state.isLoading);
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
        console.error("Failed to load conversations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [token]);

  const getOtherParticipant = (conversation: (typeof conversations)[0]) => {
    return conversation.participants.find((p) => p._id !== user?.id);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Повідомлення</h1>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            У тебе ще немає повідомлень. Знайди когось у пошуку!
          </p>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conversation) => {
              const other = getOtherParticipant(conversation);

              if (!other) return null;

              return (
                <li
                  key={conversation._id}
                  onClick={() => navigate(`/chat/${conversation._id}`)}
                  className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  {other.avatar ? (
                    <img
                      src={other.avatar}
                      alt={other.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                      {other.username[0].toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">@{other.username}</p>

                    <p className="text-gray-500 text-sm">
                      {new Date(conversation.updatedAt).toLocaleDateString(
                        "uk-UA",
                      )}
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
};

export default ChatPage;
