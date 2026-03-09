import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    conversation: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    text: string;
    isDeleted: boolean;
    createdAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
    {
        conversation: {
            type: mongoose.Types.ObjectId,
            ref: 'Conversation',
            required: true
        },

        sender: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true
        },

        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

MessageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', MessageSchema);