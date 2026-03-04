import mongoose, { Document, Schema } from 'mongoose';

export interface ITweet extends Document {
    text: string;
    author: mongoose.Types.ObjectId;
    likes: mongoose.Types.ObjectId[];
    media: string[];
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TweetSchema: Schema<ITweet> = new Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 280,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        media: {
            type: [String],
            default: [], // Масив URL медіа, може бути порожнім
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model<ITweet>('Tweet', TweetSchema);