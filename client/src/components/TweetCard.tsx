import { useState } from "react";

import { type Tweet, likeTweet, deleteTweet, editTweet } from "../api/tweet";
import { type Reply, getRepliesByTweet, createReply } from "../api/reply";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ReplyCard from "./ReplyCard";

interface TweetCardProps {
  tweet: Tweet;
  onUpdate: (updated: Tweet) => void;
  onDelete: (id: string) => void;
}

const TweetCard = ({ tweet, onUpdate, onDelete }: TweetCardProps) => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const isLiked = user ? tweet.likes.includes(user.id) : false;

  const isOwner = user?.id === tweet.author._id;

  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(tweet.text);
  const [editMedia, setEditMedia] = useState<string[]>(tweet.media || []);
  const [editLoading, setEditLoading] = useState(false);

  const formattedDate = new Date(tweet.createdAt).toLocaleDateString("uk-UA");

  const handleLike = async () => {
    try {
      const updated = await likeTweet(tweet._id);
      onUpdate(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTweet(tweet._id);
      onDelete(tweet._id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditSave = async () => {
    if (!editText.trim() || editText.trim() === tweet.text) {
      setIsEditing(false);
      return;
    }

    setEditLoading(true);

    try {
      const updated = await editTweet(tweet._id, editText.trim());

      onUpdate(updated);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditText(tweet.text);
    setIsEditing(false);
  };

  const handleToggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    setShowReplies(true);
    setRepliesLoading(true);

    try {
      const data = await getRepliesByTweet(tweet._id);
      setReplies(data);
    } catch (error) {
      console.error(error);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const newReply = await createReply(tweet._id, replyText.trim());
      setReplies([...replies, newReply]);
      setReplyText("");
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = (replyId: string) => {
    setReplies(replies.filter((r) => r._id !== replyId));
  };

  const isVideoUrl = (url: string): boolean => {
    return /\.(mp4|webm|ogg|mov)$/i.test(url);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold overflow-hidden">
          {tweet.author.avatar ? (
            <img
              src={tweet.author.avatar}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            tweet.author.username[0].toUpperCase()
          )}
        </div>

        <div>
          <p
            className="font-semibold text-white hover:underline cursor-pointer"
            onClick={() => navigate(`/profile/${tweet.author.username}`)}
          >
            @{tweet.author.username}
          </p>

          <p className="text-gray-500 text-sm flex items-center gap-2">
            {formattedDate}

            {tweet.isEdited && (
              <span className="text-gray-600 text-xs">(відредаговано)</span>
            )}
          </p>
        </div>
      </div>

      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={280}
            rows={3}
            autoFocus
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:border-blue-500"
          />

          <p
            className={`text-xs mt-1 text-right ${editText.length > 260 ? "text-red-400" : "text-gray-600"}`}
          >
            {editText.length}/280
          </p>

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleEditSave}
              disabled={editLoading || !editText.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors disabled:opacity-50"
            >
              {editLoading ? "Зберігаю..." : "Зберегти"}
            </button>

            <button
              onClick={handleEditCancel}
              className="text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded-full border border-gray-700 transition-colors"
            >
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <p className="text-white mb-4 leading-relaxed">{tweet.text}</p>
      )}

      {tweet.media && tweet.media.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {tweet.media.map((url, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden border border-gray-800"
            >
              {isVideoUrl(url) ? (
                <video src={url} controls className="w-full max-h-80" />
              ) : (
                <img
                  src={url}
                  alt={`медіа ${index + 1}`}
                  className="w-full max-h-80 object-cover cursor-pointer"
                  onClick={() => window.open(url, "_blank")}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${
            isLiked ? "text-blue-500" : "text-gray-500 hover:text-blue-400"
          }`}
        >
          {isLiked ? "❤️" : "🤍"}
          <span>{tweet.likes.length}</span>
        </button>

        <button
          onClick={handleToggleReplies}
          className={`flex items-center gap-1 text-sm transition-colors ${
            showReplies ? "text-blue-400" : "text-gray-500 hover:text-blue-400"
          }`}
        >
          💬
          {showReplies && <span>{replies.length}</span>}
        </button>

        {isOwner && (
          <div className="flex items-center gap-3 ml-auto">
            {!isEditing && (
              <button
                onClick={() => {
                  setEditText(tweet.text);
                  setIsEditing(true);
                }}
                className="text-sm text-gray-500 hover:text-blue-400 transition-colors"
              >
                Редагувати
              </button>
            )}

            <button
              onClick={handleDelete}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              Видалити
            </button>
          </div>
        )}
      </div>

      {showReplies && (
        <div className="mt-4 flex flex-col gap-2">
          <div className="border-t border-gray-800" />

          {repliesLoading ? (
            <p className="text-gray-500 text-sm py-2">Завантаження...</p>
          ) : (
            <>
              {replies.length > 0 ? (
                <div className="flex flex-col gap-2 mt-1">
                  {replies.map((reply) => (
                    <ReplyCard
                      key={reply._id}
                      reply={reply}
                      onDelete={handleDeleteReply}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm py-1">
                  Ще немає відповідей
                </p>
              )}

              <form onSubmit={handleSubmitReply} className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Написати відповідь..."
                  maxLength={280}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "..." : "Відповісти"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TweetCard;
