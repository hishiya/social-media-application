import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    updatedAt: Date;
}

const ConversationSchema: Schema<IConversation> = new Schema(
    {
        participants: [
            {
                type: mongoose.Types.ObjectId,
                // вказує на модель User, щоб можна було використовувати populate для отримання даних користувача
                ref: 'User',
                required: true
            }
        ]
    }, 
    {
        timestamps: true
    }
)

ConversationSchema.index({ participants: 1 });// Індекс для швидкого пошуку за учасниками

export default mongoose.model<IConversation>('Conversation', ConversationSchema);