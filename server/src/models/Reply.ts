import mongoose, { Document, Schema } from 'mongoose';

export interface IReply extends Document {
    text: string;
    author: mongoose.Types.ObjectId;
    tweet: mongoose.Types.ObjectId;
    createdAt: Date;
}

const ReplySchema: Schema<IReply> = new Schema(
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

        tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tweet',
            required: true,
        },

    },
    {
        timestamps: true,
    }
)

export default mongoose.model<IReply>('Reply', ReplySchema);