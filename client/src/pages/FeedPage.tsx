import { useState, useEffect, useRef } from "react";

import { type Tweet, getTweets, createTweet, uploadMedia } from "../api/tweet";

import TweetCard from "../components/TweetCard";
import Navbar from "../components/Navbar";
import { usePageTitle } from "../hooks/usePageTitle";

const FeedPage = () => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  usePageTitle("Main");

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const data = await getTweets();
        setTweets(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTweets();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setMediaPreview(localPreviewUrl);

    if (file.type.startsWith("image/")) {
      setMediaType("image");
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
    }

    setUploading(true);

    try {
      const url = await uploadMedia(file);

      setMediaUrl(url);
    } catch (error) {
      console.error("Помилка завантаження медіа:", error);

      setMediaPreview("");
      setMediaUrl("");
      setMediaType(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    setMediaPreview("");
    setMediaUrl("");
    setMediaType(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) return;

    if (uploading) return;

    setSubmitting(true);

    try {
      const mediaArray: string[] = mediaUrl ? [mediaUrl] : [];

      const newTweet = await createTweet(text, mediaArray);

      setTweets([newTweet, ...tweets]);

      setText("");
      setMediaUrl("");
      setMediaPreview("");
      setMediaType(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = (updated: Tweet) => {
    setTweets(tweets.map((t) => (t._id === updated._id ? updated : t)));
  };

  const handleDelete = (id: string) => {
    setTweets(tweets.filter((t) => t._id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Що відбувається?"
            rows={3}
            maxLength={280}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
          />

          {mediaPreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-700">
              {mediaType === "image" ? (
                <img
                  src={mediaPreview}
                  alt="прев'ю"
                  className="w-full max-h-64 object-cover"
                />
              ) : (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-h-64"
                />
              )}

              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition-colors"
                title="Видалити медіа"
              >
                ✕
              </button>

              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-sm">Завантаження...</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!mediaPreview || uploading}
                className="text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xl"
                title="Прикріпити фото або відео"
              >
                📎
              </button>

              <span
                className={`text-sm ${text.length > 260 ? "text-red-400" : "text-gray-500"}`}
              >
                {text.length}/280
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || !text.trim() || uploading}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-full transition-colors"
            >
              {submitting
                ? "Надсилаю..."
                : uploading
                  ? "Чекаю файл..."
                  : "Твітнути"}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Завантаження...</p>
        ) : tweets.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Твітів ще немає. Будь першим!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {tweets.map((tweet) => (
              <TweetCard
                key={tweet._id}
                tweet={tweet}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FeedPage;
