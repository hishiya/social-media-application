import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Reply, deleteReply } from '../api/reply';
import { useAuthStore } from '../store/authStore';

interface ReplyCardProps {
    reply: Reply;
    onDelete: (id: string) => void;
}

const ReplyCard = ({ reply, onDelete }: ReplyCardProps) => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    const [deleting, setDeleting] = useState(false);

    const isOwner = user?.id === reply.author._id;
    
    const formattedDate = new Date(reply.createdAt).toLocaleDateString('uk-UA');

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteReply(reply._id);
            onDelete(reply._id);
        } catch (error) {
            console.error(error);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="pl-4 border-l-2 border-gray-700 py-2"> 
            <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {reply.author.avatar
                        ? <img src={reply.author.avatar} alt="avatar" className="w-full h-full object-cover"></img> 
                        : reply.author.username[0].toUpperCase()
                    }
                </div>

                <span
                    className="font-semibold text-sm text-white hover:underline cursor-pointer"
                    onClick={() => navigate(`/profile/${reply.author.username}`)}
                >
                    @{reply.author.username}
                </span>

                <span className="text-xs text-gray-500">{formattedDate}</span>
                
                {isOwner && (
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="ml-auto text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                        {deleting ? '...' : 'Видалити'}
                    </button>
                )}
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">{reply.text}</p>
        </div>
    )
    
}

export default ReplyCard;