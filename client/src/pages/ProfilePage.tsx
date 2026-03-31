import { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { getProfile, followUser, type UserProfile } from "../api/user";
import { getTweetsByUser, type Tweet } from "../api/tweet";
import { getOrCreateConversation } from "../api/chat";
import { useAuthStore } from "../store/authStore";
import TweetCard from "../components/TweetCard";
import Navbar from "../components/Navbar";
import { usePageTitle } from "../hooks/usePageTitle";

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  usePageTitle("Profile");

  const isOwnProfile = user?.username === username;

  const isFollowing =
    profile?.followers.some((f) => f._id === user?.id) ?? false;

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      try {
        const [profileData, tweetsData] = await Promise.all([
          getProfile(username),
          getTweetsByUser(username),
        ]);
        setProfile(profileData);
        setTweets(tweetsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      await followUser(profile._id);
      const updatedProfile = await getProfile(username!);
      setProfile(updatedProfile);
    } catch (error) {
      console.error(error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!token || !profile) return;

    try {
      const conversation = await getOrCreateConversation(token, profile._id);
      navigate(`/chat/${conversation._id}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const handleUpdate = (updated: Tweet) => {
    setTweets(tweets.map((t) => (t._id === updated._id ? updated : t)));
  };

  const handleDelete = (id: string) => {
    setTweets(tweets.filter((t) => t._id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Завантаження...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Юзера не знайдено
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Назад
        </button>
        <h1 className="text-xl font-bold">@{profile.username}</h1>

        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.username[0].toUpperCase()
              )}
            </div>

            {isOwnProfile && (
              <button
                onClick={() => navigate("/profile/edit")}
                className="px-5 py-2 rounded-full font-semibold text-sm border border-gray-600 text-white hover:bg-gray-800 transition-colors"
              >
                Редагувати профіль
              </button>
            )}

            {!isOwnProfile && (
              <div className="flex gap-2">
                <button
                  onClick={handleStartChat}
                  className="px-5 py-2 rounded-full font-semibold text-sm border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                >
                  Написати
                </button>

                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-5 py-2 rounded-full font-semibold text-sm transition-colors disabled:opacity-50 ${
                    isFollowing
                      ? "border border-gray-600 text-white hover:border-red-500 hover:text-red-400"
                      : "bg-white text-black hover:bg-gray-200"
                  }`}
                >
                  {followLoading
                    ? "..."
                    : isFollowing
                      ? "Відписатись"
                      : "Підписатись"}
                </button>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold">@{profile.username}</h2>

          {profile.bio && <p className="text-gray-400 mt-1">{profile.bio}</p>}

          <div className="flex gap-4 mt-3 text-sm">
            <span>
              <strong>{profile.following.length}</strong>{" "}
              <span className="text-gray-500">підписок</span>
            </span>
            <span>
              <strong>{profile.followers.length}</strong>{" "}
              <span className="text-gray-500">підписників</span>
            </span>
          </div>
        </div>

        <div className="border-t border-gray-800 mb-4" />

        {tweets.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Твітів ще немає.</p>
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
export default ProfilePage;
