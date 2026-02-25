import { type Tweet, likeTweet, deleteTweet } from '../api/tweet';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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

    const handleLike = async () => {
        try {
            const updated = await likeTweet(tweet._id);
            onUpdate(updated);
        } catch (error) {
            console.error(error);
        }
    }

    const handleDelete = async () => {
        try {
            await deleteTweet(tweet._id);
            onDelete(tweet._id);
        } catch (error) {
            console.error(error);
        }
    }

    const formattedDate = new Date(tweet.createdAt).toLocaleDateString('uk-UA');

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">

            {/* Верхня частина — аватар + ім'я автора + дата */}
            <div className="flex items-center gap-3 mb-3">

                {/* Аватар — якщо є URL показуємо картинку, якщо ні — сіре коло з літерою */}
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold overflow-hidden">
                    {tweet.author.avatar
                        ? <img src={tweet.author.avatar} alt="avatar" className="w-full h-full object-cover" />
                        : tweet.author.username[0].toUpperCase() // перша літера імені
                    }
                </div>

                {/* Ім'я автора та дата публікації */}
                <div>
                    <p
                        className="font-semibold text-white hover:underline cursor-pointer"
                        onClick={() => navigate(`/profile/${tweet.author.username}`)}
                    >
                        @{tweet.author.username}
                    </p>
                    <p className="text-gray-500 text-sm">{formattedDate}</p>
                </div>
            </div>

            {/* Текст твіту */}
            <p className="text-white mb-4 leading-relaxed">{tweet.text}</p>

            {/* Нижня частина — кнопки дій */}
            <div className="flex items-center gap-4">

                {/* Кнопка лайку */}
                {/* isLiked змінює колір: синій якщо лайкнув, сірий якщо ні */}
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1 text-sm transition-colors ${isLiked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-400'
                        }`}
                >
                    {/* Серце — заповнене якщо лайкнув, порожнє якщо ні */}
                    {isLiked ? '❤️' : '🤍'}
                    {/* Кількість лайків */}
                    <span>{tweet.likes.length}</span>
                </button>

                {/* Кнопка видалення — показується ТІЛЬКИ автору твіту */}
                {isOwner && (
                    <button
                        onClick={handleDelete}
                        className="text-sm text-gray-500 hover:text-red-400 transition-colors ml-auto"
                    >
                        Видалити
                    </button>
                )}
            </div>
        </div>
    )
}

export default TweetCard;